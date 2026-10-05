const express = require("express");

const {
    getStudentProfile,
    getStudentAttendance,
    getStudentTodayAttendance,
} = require("../controllers/studentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("STUDENT"));

router.get("/profile", getStudentProfile);
router.get("/attendance", getStudentAttendance);
router.get("/today", getStudentTodayAttendance);

module.exports = router;