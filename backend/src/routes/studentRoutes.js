const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const mustChangePasswordMiddleware = require("../middleware/mustChangePasswordMiddleware");
const {
  getStudents,
  createStudent,
  getStudentQR,
} = require("../controllers/studentController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  mustChangePasswordMiddleware,
  getStudents
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  mustChangePasswordMiddleware,
  createStudent
);
router.get(
  "/:id/qr",
  authMiddleware,
  roleMiddleware("ADMIN"),
  mustChangePasswordMiddleware,
  getStudentQR
);

module.exports = router;