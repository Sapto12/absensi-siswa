const express = require("express");

const {
    scanAttendance,
    checkoutAttendance,
    getTodayAttendance,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/scan", scanAttendance);
router.post("/checkout", checkoutAttendance);

router.get(
    "/today",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getTodayAttendance
);

module.exports = router;