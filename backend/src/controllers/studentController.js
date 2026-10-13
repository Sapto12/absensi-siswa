const { v4: uuidv4 } = require("uuid");
const prisma = require("../config/prisma");
const QRcode = require("qrcode");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const {
    formatDateWIB,
    formatDateTimeWIB,
    getTodayWIB,
} = require("../utils/dateUtils");

const getAuthenticatedStudent = async (userId) => {
    if (!Number.isInteger(userId) || userId <= 0) {
        return { error: "Akun tidak valid", status: 401 };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            role: true,
            studentId: true,
        },
    });

    if (!user) {
        return { error: "Akun tidak ditemukan", status: 401 };
    }

    if (user.role !== "STUDENT") {
        return { error: "Akses hanya untuk siswa", status: 403 };
    }

    if (!user.studentId) {
        return { error: "Akun belum terhubung dengan data siswa", status: 404 };
    }

    const student = await prisma.student.findUnique({
        where: { id: user.studentId },
        select: {
            id: true,
            nis: true,
            nama: true,
            kelas: true,
            jurusan: true,
        },
    });

    if (!student) {
        return { error: "Data siswa tidak ditemukan", status: 404 };
    }

    return { user, student };
};

// GET semua siswa
const getStudents = async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                nis: true,
                nama: true,
                kelas: true,
                jurusan: true,
                qrToken: true,
                createdAt: true,
            },
        });

        res.status(200).json({
            success: true,
            data: students,
        });
    } catch (error) {
        console.error("Get students error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data siswa",
        });
    }
};

// GET siswa berdasarkan ID
const getStudentById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID siswa tidak valid",
            });
        }

        const student = await prisma.student.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                nis: true,
                nama: true,
                kelas: true,
                jurusan: true,
                qrToken: true,
                createdAt: true,
            },
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan",
            });
        }

        res.status(200).json({
            success: true,
            data: student,
        });
    } catch (error) {
        console.error("Get student error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data siswa",
        });
    }
};

// POST tambah siswa
// POST tambah siswa sekaligus membuat akun login
// POST tambah siswa sekaligus membuat akun login
const createStudent = async (req, res) => {
    try {
        const nis = String(req.body.nis ?? "").trim();
        const nama = String(req.body.nama ?? "").trim();
        const kelas = String(req.body.kelas ?? "").trim();
        const jurusan = String(req.body.jurusan ?? "").trim();

        if (!nis || !nama || !kelas || !jurusan) {
            return res.status(400).json({
                success: false,
                message: "NIS, nama, kelas, dan jurusan wajib diisi.",
            });
        }

        // Password awal sama dengan NIS, tetapi tetap di-hash
        const hashedPassword = await bcrypt.hash(nis, 12);

        const result = await prisma.$transaction(async (tx) => {
            const existingStudent = await tx.student.findUnique({
                where: { nis },
            });

            if (existingStudent) {
                const error = new Error("NIS sudah terdaftar.");
                error.statusCode = 409;
                throw error;
            }

            const existingUser = await tx.user.findUnique({
                where: { username: nis },
            });

            if (existingUser) {
                const error = new Error(
                    "NIS sudah digunakan sebagai username akun lain."
                );
                error.statusCode = 409;
                throw error;
            }

            const student = await tx.student.create({
                data: {
                    nis,
                    nama,
                    kelas,
                    jurusan,
                    qrToken: uuidv4(),
                },
                select: {
                    id: true,
                    nis: true,
                    nama: true,
                    kelas: true,
                    jurusan: true,
                    createdAt: true,
                },
            });

            
const user = await tx.user.create({
    data: {
        username: nis,
        password: hashedPassword,
        role: "STUDENT",
        studentId: student.id,
        mustChangePassword: true,
    },
    select: {
        id: true,
        username: true,
        role: true,
        studentId: true,
        mustChangePassword: true,
    },
});

            return { student, user };
        });

        return res.status(201).json({
            success: true,
            message: "Data siswa dan akun login berhasil dibuat.",
            data: {
                student: result.student,
                account: {
                    username: result.user.username,
                    initialPassword: nis,
                    role: result.user.role,
                },
            },
        });
    } catch (error) {
        console.error("Create student error:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "NIS atau username sudah digunakan.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Gagal membuat data siswa dan akun login.",
        });
    }
};

// UPDATE siswa
const updateStudent = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID siswa tidak valid",
            });
        }

        const {
            nis,
            nama,
            kelas,
            jurusan,
        } = req.body;

        if (!nis || !nama || !kelas || !jurusan) {
            return res.status(400).json({
                success: false,
                message: "NIS, nama, kelas, dan jurusan wajib diisi",
            });
        }

        const existingStudent = await prisma.student.findUnique({
            where: {
                id,
            },
        });

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan",
            });
        }

        const duplicateNis = await prisma.student.findFirst({
            where: {
                nis,
                NOT: {
                    id,
                },
            },
        });

        if (duplicateNis) {
            return res.status(409).json({
                success: false,
                message: "NIS sudah digunakan siswa lain",
            });
        }

        const student = await prisma.student.update({
            where: {
                id,
            },
            data: {
                nis,
                nama,
                kelas,
                jurusan,
            },
            select: {
                id: true,
                nis: true,
                nama: true,
                kelas: true,
                jurusan: true,
                qrToken: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            message: "Data siswa berhasil diperbarui",
            data: student,
        });
    } catch (error) {
        console.error("Update student error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal memperbarui data siswa",
        });
    }
};


// DELETE siswa

const deleteStudent = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID siswa tidak valid.",
      });
    }

    const student = await prisma.$transaction(async (tx) => {
      const existingStudent = await tx.student.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        return null;
      }

      // Pertahankan identitas siswa pada setiap riwayat absensi.
      await tx.attendance.updateMany({
        where: { studentId: existingStudent.id },
        data: {
          studentNis: existingStudent.nis,
          studentNama: existingStudent.nama,
          studentKelas: existingStudent.kelas,
          studentId: null,
        },
      });

      // Hapus akun yang terhubung ke siswa.
      // Kondisi username menangani akun lama yang relasinya kosong.
      await tx.user.deleteMany({
        where: {
          OR: [
            { studentId: existingStudent.id },
            {
              username: existingStudent.nis,
              role: "STUDENT",
            },
          ],
        },
      });

      await tx.student.delete({
        where: { id: existingStudent.id },
      });

      return existingStudent;
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Data siswa tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Data siswa dan akun login dihapus. Riwayat absensi tetap tersimpan.",
    });
  } catch (error) {
    console.error("Gagal menghapus siswa:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus siswa.",
    });
  }
};

const getStudentQR = async (req, res) => {
    try {
        // Ambil ID dari URL
        const id = Number(req.params.id);

        // Validasi ID
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID siswa tidak valid",
            });
        }

        // Cari siswa berdasarkan ID
        const student = await prisma.student.findUnique({
            where: {
                id: id,
            },
            select: {
                id: true,
                nis: true,
                nama: true,
                kelas: true,
                jurusan: true,
                qrToken: true,
            },
        });

        // Jika siswa tidak ditemukan
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan",
            });
        }

        // Data yang akan dimasukkan ke QR
        const qrData = JSON.stringify({
            type: "ATTENDANCE",
            studentId: student.id,
            token: student.qrToken,
        });

        // Generate QR menjadi Data URL
        const qrCode = await QRcode.toDataURL(qrData);

        // Response
        res.status(200).json({
            success: true,
            message: "QR Code berhasil dibuat",
            data: {
                student: {
                    id: student.id,
                    nis: student.nis,
                    nama: student.nama,
                    kelas: student.kelas,
                    jurusan: student.jurusan,
                },
                qrToken: student.qrToken,
                qrCode: qrCode,
            },
        });

    } catch (error) {
        console.error("Get student QR error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal membuat QR Code",
        });
    }
};



// GET PROFILE SISWA


const getStudentProfile = async (req, res) => {
    try {
        const result = await getAuthenticatedStudent(req.user.userId);

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error,
            });
        }

        const { user, student } = result;

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
                student,
            },
        });
    } catch (error) {
        console.error("Get student profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil profil siswa",
        });
    }
};


// GET ABSENSI SISWA


const getStudentAttendance = async (req, res) => {
    try {
        const result = await getAuthenticatedStudent(req.user.userId);

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error,
            });
        }

        const { student } = result;
        const today = getTodayWIB();

        const [attendances, attendanceHariIni] = await Promise.all([
            prisma.attendance.findMany({
                where: { studentId: student.id },
                orderBy: [
                    { tanggal: "desc" },
                    { id: "desc" },
                ],
                select: {
                    id: true,
                    tanggal: true,
                    jamMasuk: true,
                    jamPulang: true,
                    status: true,
                },
            }),

            prisma.attendance.findUnique({
                where: {
                    studentId_tanggal: {
                        studentId: student.id,
                        tanggal: today,
                    },
                },
                select: {
                    id: true,
                    tanggal: true,
                    jamMasuk: true,
                    jamPulang: true,
                    status: true,
                },
            }),
        ]);

        const formatAttendance = (item) => ({
            id: item.id,
            tanggal: formatDateWIB(item.tanggal),
            jamMasuk: formatDateTimeWIB(item.jamMasuk),
            jamPulang: formatDateTimeWIB(item.jamPulang),
            status: item.status,
        });

        return res.status(200).json({
            success: true,
            data: {
                student,
                hariIni: attendanceHariIni
                    ? formatAttendance(attendanceHariIni)
                    : null,
                riwayat: attendances.map(formatAttendance),
            },
        });
    } catch (error) {
        console.error("Get student attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data absensi siswa",
        });
    }
};


// GET ABSENSI HARI INI SISWA

const getStudentTodayAttendance = async (req, res) => {
    try {
        const result = await getAuthenticatedStudent(req.user.userId);

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error,
            });
        }

        const today = getTodayWIB();

        const attendance = await prisma.attendance.findUnique({
            where: {
                studentId_tanggal: {
                    studentId: result.student.id,
                    tanggal: today,
                },
            },
            select: {
                id: true,
                tanggal: true,
                jamMasuk: true,
                jamPulang: true,
                status: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                tanggal: formatDateWIB(today),
                sudahAbsen: Boolean(attendance),
                absensi: attendance
                    ? {
                        id: attendance.id,
                        tanggal: formatDateWIB(attendance.tanggal),
                        jamMasuk: formatDateTimeWIB(attendance.jamMasuk),
                        jamPulang: formatDateTimeWIB(attendance.jamPulang),
                        status: attendance.status,
                    }
                    : null,
            },
        });
    } catch (error) {
        console.error("Get student today attendance error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil absensi hari ini",
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentQR,
    getStudentProfile,
    getStudentAttendance,
    getStudentTodayAttendance,
};