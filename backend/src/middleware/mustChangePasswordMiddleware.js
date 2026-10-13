
const prisma = require("../config/prisma");

const mustChangePasswordMiddleware = async (req, res, next) => {
  // req.user harus berasal dari authMiddleware.
  if (!req.user || !Number.isInteger(req.user.userId)) {
    return res.status(401).json({
      success: false,
      message: "Silakan login terlebih dahulu",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { mustChangePassword: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Akun tidak ditemukan",
      });
    }

    if (user.mustChangePassword) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "Silakan ganti password sebelum menggunakan fitur ini",
      });
    }

    return next();
  } catch (error) {
    console.error("Must change password middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memverifikasi status password",
    });
  }
};

module.exports = mustChangePasswordMiddleware;
