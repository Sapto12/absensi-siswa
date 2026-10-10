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
    // Gunakan tanggal yang sama dengan proses scan siswa (WIB).
    const tanggal = getTodayWIB();

    const [totalStudents, attendances] = await Promise.all([
      prisma.student.count(),

      prisma.attendance.findMany({
        where: { tanggal },
        orderBy: [
          { jamMasuk: "desc" },
          { createdAt: "desc" },
        ],
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
      }),
    ]);

    const totalAttendance = attendances.length;
    const totalHadir = attendances.filter(
      (item) => item.status === "HADIR"
    ).length;
    const totalTerlambat = attendances.filter(
      (item) => item.status === "TERLAMBAT"
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        tanggal: formatDateWIB(tanggal),
        statistik: {
          totalSiswa: totalStudents,
          sudahAbsen: totalAttendance,
          hadir: totalHadir,
          terlambat: totalTerlambat,
          belumAbsen: Math.max(0, totalStudents - totalAttendance),
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

          // Riwayat tetap dapat ditampilkan setelah data siswa dihapus.
          student: item.student
            ? item.student
            : {
                id: null,
                nis: item.studentNis ?? "-",
                nama: item.studentNama ?? "Siswa dihapus",
                kelas: item.studentKelas ?? "-",
                jurusan: "-",
              },
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



const getDashboardStats = async (req, res) => {
    try {
        const getDateKey = (date) => {
            const parts = new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Jakarta",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).formatToParts(date);

            const values = Object.fromEntries(
                parts.map((part) => [part.type, part.value])
            );

            return `${values.year}-${values.month}-${values.day}`;
        };

        const todayKey = getDateKey(new Date());

        // Ambil tujuh tanggal terakhir, termasuk hari ini.
        const dates = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(`${todayKey}T00:00:00.000Z`);
            date.setUTCDate(date.getUTCDate() - (6 - index));
            return date.toISOString().slice(0, 10);
        });

        const startDate = new Date(`${dates[0]}T00:00:00.000Z`);
        const endDate = new Date(`${todayKey}T00:00:00.000Z`);

        const [students, attendances] = await Promise.all([
            prisma.student.findMany({
                select: {
                    id: true,
                    kelas: true,
                    jurusan: true,
                },
            }),
            prisma.attendance.findMany({
                where: {
                    tanggal: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    studentId: true,
                    tanggal: true,
                    status: true,
                },
            }),
        ]);

        const todayAttendance = attendances.filter(
            (item) => getDateKey(item.tanggal) === todayKey
        );

        const siswaPerKelas = Object.values(
            students.reduce((result, student) => {
                const kelas = student.kelas || "Belum ada kelas";

                if (!result[kelas]) {
                    result[kelas] = { kelas, jumlah: 0 };
                }

                result[kelas].jumlah += 1;
                return result;
            }, {})
        ).sort((a, b) => a.kelas.localeCompare(b.kelas));

        const absensiPerHari = dates.map((tanggal) => {
            const dataTanggal = attendances.filter(
                (item) => getDateKey(item.tanggal) === tanggal
            );

            return {
                tanggal,
                jumlah: dataTanggal.length,
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                totalSiswa: students.length,
                absensiHariIni: todayAttendance.length,
                hadir: todayAttendance.filter(
                    (item) => item.status === "HADIR"
                ).length,
                terlambat: todayAttendance.filter(
                    (item) => item.status === "TERLAMBAT"
                ).length,
                belumAbsen: Math.max(
                    0,
                    students.length - todayAttendance.length
                ),
                absensiPerHari,
                siswaPerKelas,
            },
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil statistik dashboard.",
        });
    }
};


module.exports = {
    scanAttendance,
    checkoutAttendance,
    getTodayAttendance,
    getDashboardStats,
};