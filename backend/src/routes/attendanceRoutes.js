const express = require("express");

const {
    scanAttendance,
    checkoutAttendance,
    getTodayAttendance,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Absensi siswa
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

// Data absensi untuk admin
router.get(
    "/today",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getTodayAttendance
);

module.exports = router;