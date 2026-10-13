
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
require("dotenv").config();

const prisma = require("./config/prisma");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const studentDashboardRoutes = require("./routes/studentDashboardRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Keamanan HTTP
app.disable("x-powered-by");
app.use(helmet());

// Konfigurasi CORS.
// Sesuaikan FRONTEND_URL di .env dengan alamat frontend kamu.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Izinkan request tanpa Origin, misalnya curl atau Postman.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin tidak diizinkan oleh CORS"));
    },
}));

// Batas ukuran request
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "20kb",
}));

// Pembatasan percobaan autentikasi
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/student", studentDashboardRoutes);
app.use("/api/categories", categoryRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Sistem Absensi Siswa berjalan",
    });
});

// Pemeriksaan koneksi database
app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            success: true,
            message: "API dan database terhubung",
        });
    } catch (error) {
        console.error("Health check database error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database tidak terhubung",
        });
    }
});

// Error handler untuk error CORS dan error middleware
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err.message === "Origin tidak diizinkan oleh CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin tidak diizinkan",
        });
    }

    console.error("Server error:", err.message);

    return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
