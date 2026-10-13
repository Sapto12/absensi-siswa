
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const register = async (req, res) => {
    try {
        const nis = String(req.body.nis ?? "").trim();
        const username = String(req.body.username ?? "").trim();
        const password = req.body.password;

        if (!nis || !username || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "NIS, username, dan password wajib diisi",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password minimal 8 karakter",
            });
        }

        const student = await prisma.student.findUnique({
            where: { nis },
            select: { id: true },
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "NIS tidak terdaftar. Hubungi guru/admin.",
            });
        }

        const existingStudentAccount = await prisma.user.findUnique({
            where: { studentId: student.id },
        });

        if (existingStudentAccount) {
            return res.status(409).json({
                success: false,
                message: "Siswa sudah memiliki akun",
            });
        }

        const existingUsername = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username sudah digunakan",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: "STUDENT",
                studentId: student.id,
                mustChangePassword: false,
            },
            select: {
                id: true,
                username: true,
                role: true,
                mustChangePassword: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Akun siswa berhasil dibuat",
            data: user,
        });
    } catch (error) {
        console.error("Register student error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "NIS atau username sudah digunakan",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
        });
    }
};

const login = async (req, res) => {
    try {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("JWT_SECRET belum dikonfigurasi");

            return res.status(500).json({
                success: false,
                message: "Konfigurasi autentikasi bermasalah",
            });
        }

        const username = String(req.body.username ?? "").trim();
        const password = req.body.password;

        if (!username || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Username dan password wajib diisi",
            });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                password: true,
                role: true,
                studentId: true,
                mustChangePassword: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah",
            });
        }

        if (!["ADMIN", "STUDENT"].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Role akun tidak valid",
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
            },
            secret,
            {
                algorithm: "HS256",
                expiresIn: "1d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    studentId: user.studentId,
                    mustChangePassword: user.mustChangePassword,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
        });
    }
};

const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                role: true,
                studentId: true,
                mustChangePassword: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Me error:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Password lama dan password baru wajib diisi",
            });
        }

        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Password baru harus terdiri dari 8–128 karakter",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "Password baru harus berbeda dari password lama",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                password: true,
                mustChangePassword: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Akun tidak ditemukan",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Password lama salah",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Password berhasil diubah. Silakan login kembali.",
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengubah password",
        });
    }
};

module.exports = {
    register,
    login,
    me,
    changePassword,
};
