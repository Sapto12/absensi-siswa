const prisma = require("../config/prisma");
const {
    getTodayWIB,
    getCurrentHourWIB,
    formatDateWIB,
    formatDateTimeWIB,
} = require("../utils/dateUtils");



const scanAttendance = async (req, res) => {
    try {
        const { studentId, token } = req.body;

        if (!studentId || !token) {
            return res.status(400).json({
                success: false,
                message: "QR Code tidak valid",
            });
        }

        // Ambil user yang sedang login
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                studentId: true,
                role: true,
            },
        });

        if (!user || !user.studentId) {
            return res.status(404).json({
                success: false,
                message: "Data siswa tidak ditemukan",
            });
        }

        // Pastikan QR milik siswa yang sedang login
        if (user.studentId !== Number(studentId)) {
            return res.status(403).json({
                success: false,
                message: "QR Code bukan milik akun siswa ini",
            });
        }

        // Cari siswa berdasarkan ID + QR token
        const student = await prisma.student.findFirst({
            where: {
                id: Number(studentId),
                qrToken: token,
            },
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "QR Code tidak valid",
            });
        }

        // const now = new Date();

        // const today = new Date(
        //     now.getFullYear(),
        //     now.getMonth(),
        //     now.getDate()
        // );

        const now = new Date();
        const today = getTodayWIB();
        const currentHour = getCurrentHourWIB();

        // Cek apakah sudah absen
        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                studentId_tanggal: {
                    studentId: student.id,
                    tanggal: today,
                },
            },
        });

        if (existingAttendance) {
            return res.status(409).json({
                success: false,
                message: "Anda sudah melakukan absensi hari ini",
                data: {
                    jamMasuk: existingAttendance.jamMasuk
                        ? formatDateTimeWIB(existingAttendance.jamMasuk)
                        : null,
                    status: existingAttendance.status,
                },
            });
        }

        // Batas keterlambatan: jam 07:00
        const status = currentHour >= 7
            ? "TERLAMBAT"
            : "HADIR";

        const attendance = await prisma.attendance.create({
            data: {
                studentId: student.id,
                tanggal: today,
                jamMasuk: now,
                status,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Absensi berhasil",
            data: {
                id: attendance.id,
                studentId: student.id,
                nama: student.nama,
                tanggal: formatDateWIB(attendance.tanggal),
                jamMasuk: formatDateTimeWIB(attendance.jamMasuk),
                status: attendance.status,
            },
        });
    } catch (error) {
        console.error("Scan attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal melakukan absensi",
        });
    }
};

const checkoutAttendance = async (req, res) => {
    try {
        const { studentId, token } = req.body;

        if (!studentId || !token) {
            return res.status(400).json({
                success: false,
                message: "QR Code tidak valid",
            });
        }

        // Ambil user yang sedang login
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                studentId: true,
            },
        });

        if (!user || !user.studentId) {
            return res.status(404).json({
                success: false,
                message: "Data siswa tidak ditemukan",
            });
        }

        // Pastikan QR milik siswa yang login
        if (user.studentId !== Number(studentId)) {
            return res.status(403).json({
                success: false,
                message: "QR Code bukan milik akun siswa ini",
            });
        }

        const student = await prisma.student.findFirst({
            where: {
                id: Number(studentId),
                qrToken: token,
            },
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "QR Code tidak valid",
            });
        }

        const now = new Date();
        const today = getTodayWIB();

        const attendance = await prisma.attendance.findUnique({
            where: {
                studentId_tanggal: {
                    studentId: student.id,
                    tanggal: today,
                },
            },
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Anda belum melakukan absensi masuk",
            });
        }

        if (attendance.jamPulang) {
            return res.status(409).json({
                success: false,
                message: "Anda sudah melakukan absen pulang",
                data: {
                    jamPulang: formatDateTimeWIB(attendance.jamPulang),
                },
            });
        }

        const updatedAttendance = await prisma.attendance.update({
            where: {
                id: attendance.id,
            },
            data: {
                jamPulang: now,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Absen pulang berhasil",
            data: {
                id: updatedAttendance.id,
                studentId: student.id,
                nama: student.nama,
                tanggal: formatDateWIB(updatedAttendance.tanggal),
                jamMasuk: formatDateTimeWIB(updatedAttendance.jamMasuk),
                jamPulang: formatDateTimeWIB(updatedAttendance.jamPulang),
                status: updatedAttendance.status,
            },
        });
    } catch (error) {
        console.error("Checkout attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal melakukan absen pulang",
        });
    }
};

const getTodayAttendance = async (req, res) => {
    try {
        const now = new Date();

        const tanggal = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        // Ambil seluruh siswa
        const totalStudents = await prisma.student.count();

        // Ambil seluruh absensi hari ini
        const attendances = await prisma.attendance.findMany({
            where: {
                tanggal,
            },
            orderBy: {
                jamMasuk: "asc",
            },
            include: {
                student: {
                    select: {
                        id: true,
                        nis: true,
                        nama: true,
                        kelas: true,
                        jurusan: true,
                    },
                },
            },
        });

        const totalAttendance = attendances.length;

        const totalHadir = attendances.filter(
            (item) => item.status === "HADIR"
        ).length;

        const totalTerlambat = attendances.filter(
            (item) => item.status === "TERLAMBAT"
        ).length;

        const belumAbsen = totalStudents - totalAttendance;

return res.status(200).json({
    success: true,
    data: {
        tanggal: formatDateWIB(tanggal),

        statistik: {
            totalSiswa: totalStudents,
            sudahAbsen: totalAttendance,
            hadir: totalHadir,
            terlambat: totalTerlambat,
            belumAbsen,
        },

        absensi: attendances.map((item) => ({
            id: item.id,
            studentId: item.studentId,
            tanggal: formatDateWIB(item.tanggal),
            jamMasuk: formatDateTimeWIB(item.jamMasuk),
            jamPulang: formatDateTimeWIB(item.jamPulang),
            status: item.status,
            createdAt: formatDateTimeWIB(item.createdAt),
            updatedAt: formatDateTimeWIB(item.updatedAt),

            student: item.student,
        })),
    },
});
    } catch (error) {
        console.error("Get today attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data absensi hari ini",
        });
    }
};

module.exports = {
    scanAttendance,
    checkoutAttendance,
    getTodayAttendance,
};