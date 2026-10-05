const express = require("express");

const{
    scanAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

router.post("/scan", scanAttendance);
module.exports = router;
