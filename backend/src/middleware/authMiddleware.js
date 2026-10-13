
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
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

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET belum dikonfigurasi");
        return res.status(500).json({
            success: false,
            message: "Konfigurasi autentikasi bermasalah",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });

        if (
            !decoded ||
            !Number.isInteger(decoded.userId) ||
            !["ADMIN", "STUDENT"].includes(decoded.role)
        ) {
            return res.status(401).json({
                success: false,
                message: "Token tidak valid",
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah kedaluwarsa",
        });
    }
};

module.exports = authMiddleware;
