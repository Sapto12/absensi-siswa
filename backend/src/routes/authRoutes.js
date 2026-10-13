
const express = require("express");

const {
    register,
    login,
    me,
    changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Registrasi hanya dapat dilakukan oleh admin yang sudah login.
router.post(
    "/register",
    authMiddleware,
    roleMiddleware("ADMIN"),
    register
);

// Login tetap dapat diakses tanpa token.
router.post("/login", login);

// Profil akun hanya dapat diakses dengan token valid.
router.get("/me", authMiddleware, me);

router.post("/change-password", authMiddleware, changePassword);

module.exports = router;
