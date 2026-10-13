
const prisma = require("../config/prisma");

const VALID_TYPES = ["KELAS", "JURUSAN"];

const getCategories = async (req, res) => {
    try {
        const [categories, students] = await Promise.all([
            prisma.category.findMany({
                orderBy: [{ type: "asc" }, { name: "asc" }],
            }),
            prisma.student.findMany({
                select: {
                    kelas: true,
                    jurusan: true,
                },
            }),
        ]);

        // Gabungkan kategori tersimpan dengan nilai yang sudah
        // digunakan siswa, agar data lama tetap tersedia.
        const data = {
            KELAS: new Set(),
            JURUSAN: new Set(),
        };

        categories.forEach((category) => {
            data[category.type].add(category.name);
        });

        students.forEach((student) => {
            if (student.kelas?.trim()) {
                data.KELAS.add(student.kelas.trim());
            }

            if (student.jurusan?.trim()) {
                data.JURUSAN.add(student.jurusan.trim());
            }
        });

        return res.json({
            success: true,
            data: {
                KELAS: [...data.KELAS].sort((a, b) =>
                    a.localeCompare(b, "id")
                ),
                JURUSAN: [...data.JURUSAN].sort((a, b) =>
                    a.localeCompare(b, "id")
                ),
                categories,
            },
        });
    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data kategori.",
        });
    }
};

const createCategory = async (req, res) => {
    try {
        const name =
            typeof req.body.name === "string" ? req.body.name.trim() : "";
        const type = req.body.type;

        if (!name || !VALID_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Nama dan jenis kategori wajib diisi dengan benar.",
            });
        }

        const category = await prisma.category.create({
            data: { name, type },
        });

        return res.status(201).json({
            success: true,
            message: "Kategori berhasil ditambahkan.",
            data: category,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Kategori dengan nama dan jenis tersebut sudah ada.",
            });
        }

        console.error("Create category error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menambahkan kategori.",
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const name =
            typeof req.body.name === "string" ? req.body.name.trim() : "";

        if (!Number.isInteger(id) || id < 1 || !name) {
            return res.status(400).json({
                success: false,
                message: "ID dan nama kategori tidak valid.",
            });
        }

        const existing = await prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Kategori tidak ditemukan.",
            });
        }

        const studentField =
            existing.type === "KELAS" ? "kelas" : "jurusan";

        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.category.update({
                where: { id },
                data: { name },
            });

            // Perbarui referensi teks pada siswa yang memakai
            // nama kategori lama, agar tidak tertinggal.
            if (existing.name !== name) {
                await tx.student.updateMany({
                    where: { [studentField]: existing.name },
                    data: { [studentField]: name },
                });
            }

            return updated;
        });

        return res.json({
            success: true,
            message: "Kategori berhasil diperbarui.",
            data: result,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Nama kategori tersebut sudah digunakan.",
            });
        }

        console.error("Update category error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui kategori.",
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "ID kategori tidak valid.",
            });
        }

        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Kategori tidak ditemukan.",
            });
        }

        const studentField =
            category.type === "KELAS" ? "kelas" : "jurusan";

        const usedCount = await prisma.student.count({
            where: { [studentField]: category.name },
        });

        if (usedCount > 0) {
            return res.status(409).json({
                success: false,
                message: `Kategori masih digunakan oleh ${usedCount} siswa. Ubah data siswa terlebih dahulu.`,
            });
        }

        await prisma.category.delete({ where: { id } });

        return res.json({
            success: true,
            message: "Kategori berhasil dihapus.",
        });
    } catch (error) {
        console.error("Delete category error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus kategori.",
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
