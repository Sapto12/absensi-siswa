const prisma = require("../config/prisma");


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

module.exports = {
    scanAttendance,
}