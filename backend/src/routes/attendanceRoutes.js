
const express = require("express");

const {
    scanAttendance,
    checkoutAttendance,
    getTodayAttendance,
    getDashboardStats,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Siswa
router.post(
    "/scan",
    authMiddleware,
    roleMiddleware("STUDENT"),
    scanAttendance
);

router.post(
    "/checkout",
    authMiddleware,
    roleMiddleware("STUDENT"),
    checkoutAttendance
);

// Admin
router.get(
    "/today",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getTodayAttendance
);

router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getDashboardStats
);

module.exports = router;
