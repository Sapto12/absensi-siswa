
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Silakan login terlebih dahulu",
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid",
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("JWT_SECRET belum dikonfigurasi");

        return res.status(500).json({
            success: false,
            message: "Konfigurasi autentikasi bermasalah",
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"],
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah kedaluwarsa",
        });
    }

    if (
        !decoded ||
        !Number.isInteger(decoded.userId) ||
        decoded.userId <= 0
    ) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid",
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                username: true,
                role: true,
                studentId: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Akun tidak ditemukan atau sudah tidak aktif",
            });
        }

        if (!["ADMIN", "STUDENT"].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Role akun tidak valid",
            });
        }

        // Gunakan identitas terbaru dari database, bukan klaim role JWT.
        req.user = {
            userId: user.id,
            username: user.username,
            role: user.role,
            studentId: user.studentId,
        };

        return next();
    } catch (error) {
        console.error("Auth middleware database error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Gagal memverifikasi akun",
        });
    }
};

module.exports = authMiddleware;
