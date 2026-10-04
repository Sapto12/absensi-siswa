const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        //validasi
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 6 karakter',
            });
        }

        //cek username dan password
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username sudah digunakan',
            });
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //buat user admin
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        res.status(201).json({
            success: true,
            message: 'Admin berhasil dibuat',
            data: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

         if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi',
            });
        }

        //cari user
        const user = await prisma.user.findUnique({
            where: { username },
        });


        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah',
            });
        }
        //cek password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah',
            });
        }

        //buat jwt

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
        });
    }
};

const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                username: true,
                role: true,
                studentId: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan",
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Me error:", error);

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
        });
    }
};

module.exports = {
    register,
    login,
    me,

};