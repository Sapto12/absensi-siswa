
const VALID_ROLES = ["ADMIN", "STUDENT"];

const roleMiddleware = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

    // Pastikan konfigurasi role pada route valid.
    if (
        roles.length === 0 ||
        roles.some((role) => !VALID_ROLES.includes(role))
    ) {
        throw new Error("Konfigurasi roleMiddleware tidak valid");
    }

    return (req, res, next) => {
        // Pastikan request sudah melewati authMiddleware.
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Silakan login terlebih dahulu",
            });
        }

        // Hanya izinkan role yang ditentukan pada route.
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message:
                    "Anda tidak memiliki izin untuk mengakses resource ini",
            });
        }

        return next();
    };
};

module.exports = roleMiddleware;
