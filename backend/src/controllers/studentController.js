const { v4: uuidv4 } = require("uuid");
const prisma = require("../config/prisma");
const QRcode = require("qrcode");

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
const createStudent = async (req, res) => {
    try {
        const {
            nis,
            nama,
            kelas,
            jurusan,
        } = req.body;

        // Validasi
        if (!nis || !nama || !kelas || !jurusan) {
            return res.status(400).json({
                success: false,
                message: "NIS, nama, kelas, dan jurusan wajib diisi",
            });
        }

        // Cek NIS
        const existingStudent = await prisma.student.findUnique({
            where: {
                nis,
            },
        });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: "NIS sudah terdaftar",
            });
        }

        // Buat siswa
        const student = await prisma.student.create({
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
                qrToken: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            message: "Siswa berhasil ditambahkan",
            data: student,
        });
    } catch (error) {
        console.error("Create student error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal menambahkan siswa",
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
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Siswa tidak ditemukan",
            });
        }

        await prisma.student.delete({
            where: {
                id,
            },
        });

        res.json({
            success: true,
            message: "Siswa berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete student error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal menghapus siswa",
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


module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentQR,
};