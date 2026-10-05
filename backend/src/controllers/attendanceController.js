const prisma = require("../config/prisma");

const {
    formatDateWIB,
    formatDateTimeWIB,
} = require("../utils/dateUtils");


const scanAttendance = async (req, res)=> {
    try {
        const {studentId, token } = req. body;

        if (!studentId || !token){
            return res.status(400).json({
                success: false,
                message: "student ID dan token qr wajib diisi",
            });
        }

        const student = await prisma. student.findFirst({
            where:{
                id: Number(studentId),
                qrToken: token,
            },
        });

        if(!student){
            return res.status(404).json({
                success: false,
                message: "QR Code tidak valid",

            });

        }
        const now =new Date();

        // mengambil tanggal hari ini

        const tanggal = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        //cek sudah aben/belum

        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                studentId_tanggal:{
                    studentId: student.id,
                    tanggal,
                },
            },
        });


        if (existingAttendance){
            return res.status(409).json({
                success: false,
                message: "siswa sudah melakukan absensi hari ini",
                data: existingAttendance,
            });

        }

        //batas masuk sekolah

        const batasJamMasuk = 7;

        const status = 
                now.getHours() >= batasJamMasuk
                    ? "TERLAMBAT"
                    : "HADIR";

        const attendance = await prisma.attendance.create({
            data:{
                studentId: student.id,
                tanggal,
                jamMasuk: now,
                status,
            },
        });

        return res.status(201).json({
            success: true,
            message: "absensi berhasil",
              data: {
                student: {
                    id: student.id,
                    nis: student.nis,
                    nama: student.nama,
                    kelas: student.kelas,
                    jurusan: student.jurusan,
                },
                attendance,
            },
        });
    }catch(error){
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
                message: "Student ID dan token QR wajib diisi",
            });
        }

        // Validasi siswa dan QR token
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

        // Ambil tanggal hari ini
        const now = new Date();

        const tanggal = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        // Cari absensi siswa hari ini
        const attendance = await prisma.attendance.findUnique({
            where: {
                studentId_tanggal: {
                    studentId: student.id,
                    tanggal,
                },
            },
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Siswa belum melakukan absensi masuk hari ini",
            });
        }

        // Cek apakah sudah checkout
        if (attendance.jamPulang) {
            return res.status(409).json({
                success: false,
                message: "Siswa sudah melakukan absen pulang hari ini",
                data: attendance,
            });
        }

        // Simpan jam pulang
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
                student: {
                    id: student.id,
                    nis: student.nis,
                    nama: student.nama,
                    kelas: student.kelas,
                    jurusan: student.jurusan,
                },
                attendance: updatedAttendance,
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