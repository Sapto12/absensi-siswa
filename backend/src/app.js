const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./config/prisma");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Sistem Absensi Siswa berjalan",
    });
});

// Test koneksi database
app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            success: true,
            message: "API dan database terhubung",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database tidak terhubung",
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});