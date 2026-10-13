
const prisma = require("../config/prisma");
const {
    getTodayWIB,
    getCurrentHourWIB,
    formatDateWIB,
    formatDateTimeWIB,
} = require("../utils/dateUtils");

// =====================================================
// HELPER: Validasi data QR Code
// =====================================================
const validateQrInput = (body) => {
    const { studentId, token } = body || {};
    const parsedStudentId = Number(studentId);

    if (
        studentId === undefined ||
        studentId === null ||
        studentId === "" ||
        !Number.isSafeInteger(parsedStudentId) ||
        parsedStudentId <= 0 ||
        typeof token !== "string" ||
        token.trim().length === 0 ||
        token.length > 512
    ) {
        return null;
    }

    return {
        studentId: parsedStudentId,
        token,
    };
};

// =====================================================
// HELPER: Ambil akun siswa yang sedang login
// =====================================================
const getAuthenticatedStudent = async (userId, studentId, token) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            studentId: true,
        },
    });

    if (!user) {
        return { error: "USER_NOT_FOUND" };
    }

    // Jangan hanya mempercayai role yang tertulis di JWT.
    if (user.role !== "STUDENT") {
        return { error: "FORBIDDEN" };
    }

    if (!user.studentId) {
        return { error: "STUDENT_NOT_FOUND" };
    }

    // QR harus sesuai dengan siswa yang terhubung ke akun login.
    if (user.studentId !== studentId) {
        return { error: "QR_FORBIDDEN" };
    }

    const student = await prisma.student.findFirst({
        where: {
            id: user.studentId,
            qrToken: token,
        },
        select: {
            id: true,
            nis: true,
            nama: true,
            kelas: true,
            jurusan: true,
        },
    });

    if (!student) {
        return { error: "INVALID_QR" };
    }

    return { student };
};

// =====================================================
// HELPER: Respons error identitas siswa
// =====================================================
const sendStudentError = (res, error) => {
    switch (error) {
        case "USER_NOT_FOUND":
            return res.status(401).json({
                success: false,
                message: "Akun tidak ditemukan",
            });

        case "FORBIDDEN":
            return res.status(403).json({
                success: false,
                message: "Akses hanya untuk siswa",
            });

        case "STUDENT_NOT_FOUND":
            return res.status(404).json({
                success: false,
                message: "Data siswa tidak ditemukan",
            });

        case "QR_FORBIDDEN":
            return res.status(403).json({
                success: false,
                message: "QR Code bukan milik akun siswa ini",
            });

        case "INVALID_QR":
            return res.status(404).json({
                success: false,
                message: "QR Code tidak valid",
            });

        default:
            return res.status(500).json({
                success: false,
                message: "Gagal memverifikasi identitas siswa",
            });
    }
};

// =====================================================
// SCAN QR: ABSEN MASUK
// =====================================================
const scanAttendance = async (req, res) => {
    try {
        const input = validateQrInput(req.body);

        if (!input) {
            return res.status(400).json({
                success: false,
                message: "QR Code tidak valid",
            });
        }

        const { studentId, token } = input;

        const result = await getAuthenticatedStudent(
            req.user.userId,
            studentId,
            token
        );

        if (result.error) {
            return sendStudentError(res, result.error);
        }

        const { student } = result;
        const now = new Date();
        const today = getTodayWIB();
        const currentHour = getCurrentHourWIB();

        // Batas keterlambatan tetap pukul 07.00 WIB.
        const status = currentHour >= 7 ? "TERLAMBAT" : "HADIR";

        // Unique constraint studentId_tanggal di database
        // mencegah dua absensi masuk pada tanggal yang sama.
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
        // P2002: pelanggaran unique constraint Prisma.
        // Dapat terjadi jika dua request scan bersamaan.
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Anda sudah melakukan absensi hari ini",
            });
        }

        console.error("Scan attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal melakukan absensi",
        });
    }
};

// =====================================================
// CHECKOUT: ABSEN PULANG
// =====================================================
const checkoutAttendance = async (req, res) => {
    try {
        const input = validateQrInput(req.body);

        if (!input) {
            return res.status(400).json({
                success: false,
                message: "QR Code tidak valid",
            });
        }

        const { studentId, token } = input;

        const result = await getAuthenticatedStudent(
            req.user.userId,
            studentId,
            token
        );

        if (result.error) {
            return sendStudentError(res, result.error);
        }

        const { student } = result;
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
                    jamPulang: formatDateTimeWIB(
                        attendance.jamPulang
                    ),
                },
            });
        }

        // Update bersyarat: hanya satu request yang dapat
        // mengisi jamPulang ketika nilainya masih null.
        const updateResult = await prisma.attendance.updateMany({
            where: {
                id: attendance.id,
                studentId: student.id,
                jamPulang: null,
            },
            data: {
                jamPulang: now,
            },
        });

        if (updateResult.count === 0) {
            const latestAttendance =
                await prisma.attendance.findUnique({
                    where: {
                        id: attendance.id,
                    },
                    select: {
                        jamPulang: true,
                    },
                });

            return res.status(409).json({
                success: false,
                message: "Absen pulang sudah dilakukan",
                data: {
                    jamPulang: latestAttendance?.jamPulang
                        ? formatDateTimeWIB(
                              latestAttendance.jamPulang
                          )
                        : null,
                },
            });
        }

        const updatedAttendance =
            await prisma.attendance.findUnique({
                where: {
                    id: attendance.id,
                },
            });

        return res.status(200).json({
            success: true,
            message: "Absen pulang berhasil",
            data: {
                id: updatedAttendance.id,
                studentId: student.id,
                nama: student.nama,
                tanggal: formatDateWIB(
                    updatedAttendance.tanggal
                ),
                jamMasuk: formatDateTimeWIB(
                    updatedAttendance.jamMasuk
                ),
                jamPulang: formatDateTimeWIB(
                    updatedAttendance.jamPulang
                ),
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

// =====================================================
// ADMIN: ABSENSI HARI INI
// =====================================================
const getTodayAttendance = async (req, res) => {
    try {
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
                    belumAbsen: Math.max(
                        0,
                        totalStudents - totalAttendance
                    ),
                },
                absensi: attendances.map((item) => ({
                    id: item.id,
                    studentId: item.studentId,
                    tanggal: formatDateWIB(item.tanggal),
                    jamMasuk: formatDateTimeWIB(
                        item.jamMasuk
                    ),
                    jamPulang: formatDateTimeWIB(
                        item.jamPulang
                    ),
                    status: item.status,
                    createdAt: formatDateTimeWIB(
                        item.createdAt
                    ),
                    updatedAt: formatDateTimeWIB(
                        item.updatedAt
                    ),

                    // Riwayat tetap terlihat jika siswa dihapus.
                    student: item.student
                        ? item.student
                        : {
                              id: null,
                              nis: item.studentNis ?? "-",
                              nama:
                                  item.studentNama ??
                                  "Siswa dihapus",
                              kelas: item.studentKelas ?? "-",
                              jurusan: "-",
                          },
                })),
            },
        });
    } catch (error) {
        console.error(
            "Get today attendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil data absensi hari ini",
        });
    }
};

// =====================================================
// ADMIN: STATISTIK DASHBOARD
// =====================================================
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
                parts.map((part) => [
                    part.type,
                    part.value,
                ])
            );

            return `${values.year}-${values.month}-${values.day}`;
        };

        const todayKey = getDateKey(new Date());

        // Tujuh tanggal terakhir, termasuk hari ini.
        const dates = Array.from(
            { length: 7 },
            (_, index) => {
                const date = new Date(
                    `${todayKey}T00:00:00.000Z`
                );

                date.setUTCDate(
                    date.getUTCDate() - (6 - index)
                );

                return date.toISOString().slice(0, 10);
            }
        );

        const startDate = new Date(
            `${dates[0]}T00:00:00.000Z`
        );

        const endDate = new Date(
            `${todayKey}T00:00:00.000Z`
        );

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
            (item) =>
                getDateKey(item.tanggal) === todayKey
        );

        const siswaPerKelas = Object.values(
            students.reduce((result, student) => {
                const kelas =
                    student.kelas || "Belum ada kelas";

                if (!result[kelas]) {
                    result[kelas] = {
                        kelas,
                        jumlah: 0,
                    };
                }

                result[kelas].jumlah += 1;

                return result;
            }, {})
        ).sort((a, b) =>
            a.kelas.localeCompare(b.kelas)
        );

        const absensiPerHari = dates.map((tanggal) => {
            const dataTanggal = attendances.filter(
                (item) =>
                    getDateKey(item.tanggal) === tanggal
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
                    students.length -
                        todayAttendance.length
                ),

                absensiPerHari,
                siswaPerKelas,
            },
        });
    } catch (error) {
        console.error(
            "Get dashboard stats error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil statistik dashboard",
        });
    }
};

module.exports = {
    scanAttendance,
    checkoutAttendance,
    getTodayAttendance,
    getDashboardStats,
};
