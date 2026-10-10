import { useEffect, useState } from "react";
import {
    Download,
    Edit,
    LoaderCircle,
    Plus,
    Printer,
    QrCode,
    Search,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { Button } from "@heroui/react";
import { jsPDF } from "jspdf";

import AdminLayout from "../../layouts/AdminLayout.jsx";
import api from "../../services/api.js";

function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [qrCode, setQrCode] = useState("");
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
const [editingStudent, setEditingStudent] = useState(null);
const [saving, setSaving] = useState(false);
const [formError, setFormError] = useState("");
const [formSuccess, setFormSuccess] = useState("");
const [deleteStudentData, setDeleteStudentData] = useState(null);
const [deleting, setDeleting] = useState(false);

const [formData, setFormData] = useState({
    nis: "",
    nama: "",
    kelas: "",
    jurusan: "",
});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/students");

            const data = response.data?.data ?? response.data ?? [];

            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Gagal mengambil data siswa."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleShowQR = async (student) => {
        try {
            setSelectedStudent(student);
            setQrCode("");
            setQrError("");
            setQrLoading(true);

            const response = await api.get(
                `/students/${student.id}/qr`
            );

            const data = response.data?.data ?? response.data;

            const qr =
                data?.qrCode ||
                data?.qr ||
                data?.dataUrl ||
                data;

            if (!qr || typeof qr !== "string") {
                throw new Error("QR Code tidak ditemukan.");
            }

            setQrCode(qr);
        } catch (err) {
            console.error(err);

            setQrError(
                err.response?.data?.message ||
                    err.message ||
                    "Gagal mengambil QR Code."
            );
        } finally {
            setQrLoading(false);
        }
    };

    const closeQRModal = () => {
        setSelectedStudent(null);
        setQrCode("");
        setQrError("");
    };

    const handleDownloadPNG = () => {
        if (!qrCode || !selectedStudent) return;

        const link = document.createElement("a");

        link.href = qrCode;
        link.download = `QR-${selectedStudent.nis}-${selectedStudent.nama}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintPDF = () => {
        if (!qrCode || !selectedStudent) return;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();

        // Header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text("QR CODE ABSENSI SISWA", pageWidth / 2, 25, {
            align: "center",
        });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(
            "Sistem Absensi Siswa",
            pageWidth / 2,
            32,
            { align: "center" }
        );

        // Student information
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Data Siswa", 25, 52);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        pdf.text(
            `Nama     : ${selectedStudent.nama}`,
            25,
            62
        );

        pdf.text(
            `NIS      : ${selectedStudent.nis}`,
            25,
            70
        );

        pdf.text(
            `Kelas    : ${selectedStudent.kelas}`,
            25,
            78
        );

        pdf.text(
            `Jurusan  : ${selectedStudent.jurusan}`,
            25,
            86
        );

        // QR Code
        const qrSize = 90;
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = 100;

        pdf.addImage(
            qrCode,
            "PNG",
            qrX,
            qrY,
            qrSize,
            qrSize
        );

        // Instruction
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);

        pdf.text(
            "Scan QR Code ini untuk melakukan absensi",
            pageWidth / 2,
            205,
            {
                align: "center",
            }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        pdf.text(
            "QR Code ini bersifat unik dan terhubung dengan data siswa.",
            pageWidth / 2,
            214,
            {
                align: "center",
            }
        );

        pdf.save(
            `QR-Absensi-${selectedStudent.nis}-${selectedStudent.nama}.pdf`
        );
    };

    const openCreateForm = () => {
    setEditingStudent(null);
    setFormData({
        nis: "",
        nama: "",
        kelas: "",
        jurusan: "",
    });
    setFormError("");
    setFormSuccess("");
    setFormOpen(true);
};

const openEditForm = (student) => {
    setEditingStudent(student);
    setFormData({
        nis: student.nis ?? "",
        nama: student.nama ?? "",
        kelas: student.kelas ?? "",
        jurusan: student.jurusan ?? "",
    });
    setFormError("");
    setFormSuccess("");
    setFormOpen(true);
};

const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingStudent(null);
    setFormError("");
};

const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
};

const handleSubmitStudent = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    const payload = {
        nis: formData.nis.trim(),
        nama: formData.nama.trim(),
        kelas: formData.kelas.trim(),
        jurusan: formData.jurusan.trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
        setFormError("Semua kolom wajib diisi.");
        return;
    }

    try {
        setSaving(true);

        if (editingStudent) {
            await api.put(
                `/students/${editingStudent.id}`,
                payload
            );
        } else {
            await api.post("/students", payload);
        }

        setFormSuccess(
            editingStudent
                ? "Data siswa berhasil diperbarui."
                : "Siswa berhasil ditambahkan."
        );

        setFormOpen(false);
        setEditingStudent(null);

        await fetchStudents();
    } catch (err) {
        console.error("Gagal menyimpan siswa:", err);

        setFormError(
            err.response?.data?.message ||
                "Terjadi kesalahan saat menyimpan data siswa."
        );
    } finally {
        setSaving(false);
    }
};

const handleDeleteStudent = async () => {
    if (!deleteStudentData) return;

    try {
        setDeleting(true);
        setError("");
        setFormSuccess("");

        await api.delete(`/students/${deleteStudentData.id}`);

        setDeleteStudentData(null);
        setFormSuccess("Siswa berhasil dihapus.");

        await fetchStudents();
    } catch (err) {
        console.error("Gagal menghapus siswa:", err);

        setError(
            err.response?.data?.message ||
                "Siswa gagal dihapus. Periksa apakah siswa masih memiliki akun atau riwayat absensi."
        );

        setDeleteStudentData(null);
    } finally {
        setDeleting(false);
    }
};

    const filteredStudents = students.filter((student) => {
        const keyword = search.toLowerCase();

        return (
            student.nama?.toLowerCase().includes(keyword) ||
            student.nis?.toLowerCase().includes(keyword) ||
            student.kelas?.toLowerCase().includes(keyword) ||
            student.jurusan?.toLowerCase().includes(keyword)
        );
    });

    return (
        <AdminLayout title="Data Siswa">
            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                        <Users size={17} />
                        <span>Manajemen Siswa</span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900">
                        Data Siswa
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Kelola data siswa dan QR Code untuk absensi.
                    </p>
                </div>

                {/* Toolbar */}
                {/* Toolbar */}
<div className="mb-5 flex flex-col gap-4 border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="w-full sm:max-w-sm">
        <div className="relative">
            <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
                type="text"
                placeholder="Cari nama, NIS, kelas..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>

        <p className="mt-2 text-sm text-slate-500">
            Total:{" "}
            <span className="font-semibold text-slate-900">
                {students.length}
            </span>{" "}
            siswa
        </p>
    </div>

    <Button
        className="bg-blue-600 text-white"
        onPress={openCreateForm}
    >
        <Plus size={18} />
        Tambah Siswa
    </Button>
</div>

{/* Pesan sukses */}
{formSuccess && (
    <div className="mb-5 flex items-center justify-between border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <span>{formSuccess}</span>

        <button
            type="button"
            onClick={() => setFormSuccess("")}
            aria-label="Tutup pesan"
        >
            <X size={17} />
        </button>
    </div>
)}

                {/* Error */}
                {error && (
                    <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <LoaderCircle
                                    size={18}
                                    className="animate-spin"
                                />
                                Memuat data siswa...
                            </div>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400">
                                <Users size={22} />
                            </div>

                            <h3 className="font-semibold text-slate-900">
                                Data siswa tidak ditemukan
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Belum ada data siswa yang sesuai.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            No
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            NIS
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Nama
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Kelas
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Jurusan
                                        </th>

                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Aksi
                                        </th>
                                    </tr>
                                    
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.map(
                                        (student, index) => (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 text-sm text-slate-500">
                                                    {index + 1}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                                    {student.nis}
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                    {student.nama}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {student.kelas}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {student.jurusan}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
    <Button
        size="sm"
        variant="flat"
        className="bg-blue-50 text-blue-600"
        onPress={() => handleShowQR(student)}
    >
        <QrCode size={16} />
        Lihat QR
    </Button>

    <Button
        size="sm"
        variant="flat"
        className="bg-amber-50 text-amber-700"
        onPress={() => openEditForm(student)}
    >
        <Edit size={16} />
        Edit
    </Button>

    <Button
        size="sm"
        variant="flat"
        className="bg-red-50 text-red-600"
        onPress={() => setDeleteStudentData(student)}
    >
        <Trash2 size={16} />
        Hapus
    </Button>
</div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* QR Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="relative w-full max-w-md border border-slate-200 bg-white shadow-xl">
                        {/* Close */}
                        <button
                            type="button"
                            onClick={closeQRModal}
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6">
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-blue-50 text-blue-600">
                                    <QrCode size={24} />
                                </div>

                                <h3 className="text-lg font-bold text-slate-900">
                                    QR Code Absensi
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedStudent.nama}
                                </p>
                            </div>

                            {qrLoading ? (
                                <div className="flex h-72 items-center justify-center">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <LoaderCircle
                                            size={20}
                                            className="animate-spin"
                                        />
                                        Membuat QR Code...
                                    </div>
                                </div>
                            ) : qrError ? (
                                <div className="border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                                    {qrError}
                                </div>
                            ) : qrCode ? (
                                <>
                                    <div className="flex justify-center border border-slate-200 bg-white p-5">
                                        <img
                                            src={qrCode}
                                            alt={`QR Code ${selectedStudent.nama}`}
                                            className="h-64 w-64"
                                        />
                                    </div>

                                    <div className="mt-5 space-y-1 text-center">
                                        <p className="font-semibold text-slate-900">
                                            {selectedStudent.nama}
                                        </p>

                                        <p className="text-sm text-slate-500">
                                            NIS {selectedStudent.nis} •{" "}
                                            {selectedStudent.kelas}
                                        </p>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <Button
                                            variant="flat"
                                            className="bg-slate-100 text-slate-700"
                                            onPress={handleDownloadPNG}
                                        >
                                            <Download size={17} />
                                            PNG
                                        </Button>

                                        <Button
                                            className="bg-blue-600 text-white"
                                            onPress={handlePrintPDF}
                                        >
                                            <Printer size={17} />
                                            Cetak PDF
                                        </Button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Tambah / Edit Siswa */}
{formOpen && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
        <div className="my-auto w-full max-w-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {editingStudent
                            ? "Edit Data Siswa"
                            : "Tambah Siswa"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Lengkapi informasi siswa di bawah ini.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    aria-label="Tutup form"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmitStudent} className="p-5">
                <div className="space-y-4">
                    {[
                        {
                            name: "nis",
                            label: "Nomor Induk Siswa (NIS)",
                            placeholder: "Contoh: 2026001",
                        },
                        {
                            name: "nama",
                            label: "Nama Lengkap",
                            placeholder: "Masukkan nama lengkap",
                        },
                        {
                            name: "kelas",
                            label: "Kelas",
                            placeholder: "Contoh: XII RPL 1",
                        },
                        {
                            name: "jurusan",
                            label: "Jurusan",
                            placeholder: "Contoh: Rekayasa Perangkat Lunak",
                        },
                    ].map((field) => (
                        <div key={field.name}>
                            <label
                                htmlFor={`student-${field.name}`}
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                {field.label}
                            </label>

                            <input
                                id={`student-${field.name}`}
                                name={field.name}
                                type="text"
                                value={formData[field.name]}
                                onChange={handleFormChange}
                                placeholder={field.placeholder}
                                required
                                maxLength={100}
                                disabled={saving}
                                autoComplete="off"
                                className="h-11 w-full border border-slate-200 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            />
                        </div>
                    ))}
                </div>

                {formError && (
                    <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                        {formError}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        variant="flat"
                        className="bg-slate-100 text-slate-700"
                        onPress={closeForm}
                        isDisabled={saving}
                    >
                        Batal
                    </Button>

                    <Button
                        type="submit"
                        className="bg-blue-600 text-white"
                        isDisabled={saving}
                    >
                        {saving ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <Plus size={17} />
                        )}

                        {saving
                            ? "Menyimpan..."
                            : editingStudent
                              ? "Simpan Perubahan"
                              : "Tambah Siswa"}
                    </Button>
                </div>
            </form>
        </div>
    </div>
)}

{/* Modal Konfirmasi Hapus */}
{deleteStudentData && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
        <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center bg-red-50 text-red-600">
                <Trash2 size={23} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
                Hapus Data Siswa?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
                Kamu akan menghapus data{" "}
                <strong>{deleteStudentData.nama}</strong> dengan NIS{" "}
                <strong>{deleteStudentData.nis}</strong>. Tindakan ini
                tidak dapat dibatalkan.
            </p>

            <p className="mt-2 text-sm text-red-600">
                Jika siswa memiliki riwayat absensi atau akun terkait,
                penghapusan mungkin ditolak oleh database.
            </p>

            <div className="mt-6 flex justify-end gap-3">
                <Button
                    variant="flat"
                    className="bg-slate-100 text-slate-700"
                    onPress={() => setDeleteStudentData(null)}
                    isDisabled={deleting}
                >
                    Batal
                </Button>

                <Button
                    className="bg-red-600 text-white"
                    onPress={handleDeleteStudent}
                    isDisabled={deleting}
                >
                    {deleting && (
                        <LoaderCircle
                            size={17}
                            className="animate-spin"
                        />
                    )}

                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                </Button>
            </div>
        </div>
    </div>
)}
        </AdminLayout>
    );
}

export default Students;