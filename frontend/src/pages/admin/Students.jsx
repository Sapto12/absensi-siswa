
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

  const [categories, setCategories] = useState({
    KELAS: [],
    JURUSAN: [],
  });

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
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
  const [createdAccount, setCreatedAccount] = useState(null);

  const [deleteStudentData, setDeleteStudentData] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [formData, setFormData] = useState({
    nis: "",
    nama: "",
    kelas: "",
    jurusan: "",
  });

  useEffect(() => {
    fetchStudents();
    fetchCategories();
  }, []);

  // Mengambil daftar siswa
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/students");
      const data = response.data?.data ?? response.data ?? [];

      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data siswa:", err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data siswa."
      );
    } finally {
      setLoading(false);
    }
  };

  // Mengambil daftar kategori kelas dan jurusan
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoryError("");

      const response = await api.get("/categories");
      const data = response.data?.data ?? response.data;

      setCategories({
        KELAS: Array.isArray(data?.KELAS)
          ? data.KELAS
          : [],
        JURUSAN: Array.isArray(data?.JURUSAN)
          ? data.JURUSAN
          : [],
      });
    } catch (err) {
      console.error("Gagal mengambil kategori:", err);

      setCategoryError(
        err.response?.data?.message ||
          "Gagal mengambil kategori kelas dan jurusan."
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  // Menampilkan QR Code siswa
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
      console.error("Gagal mengambil QR Code:", err);

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

  // Mengunduh QR Code dalam format PNG
  const handleDownloadPNG = () => {
    if (!qrCode || !selectedStudent) return;

    const link = document.createElement("a");

    link.href = qrCode;
    link.download =
      `QR-${selectedStudent.nis}-${selectedStudent.nama}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mencetak QR Code dalam format PDF
  const handlePrintPDF = () => {
    if (!qrCode || !selectedStudent) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("QR CODE ABSENSI SISWA", pageWidth / 2, 25, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Sistem Absensi Siswa", pageWidth / 2, 32, {
      align: "center",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Data Siswa", 25, 52);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    pdf.text(`Nama     : ${selectedStudent.nama}`, 25, 62);
    pdf.text(`NIS      : ${selectedStudent.nis}`, 25, 70);
    pdf.text(`Kelas    : ${selectedStudent.kelas}`, 25, 78);
    pdf.text(`Jurusan  : ${selectedStudent.jurusan}`, 25, 86);

    const qrSize = 90;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 100;

    try {
      pdf.addImage(qrCode, "PNG", qrX, qrY, qrSize, qrSize);
    } catch (err) {
      console.error("Gagal memasukkan QR Code ke PDF:", err);
      setQrError(
        "QR Code tidak dapat dimasukkan ke PDF. Pastikan backend mengirimkan data gambar QR Code yang valid."
      );
      return;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(
      "Scan QR Code ini untuk melakukan absensi",
      pageWidth / 2,
      205,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      "QR Code ini bersifat unik dan terhubung dengan data siswa.",
      pageWidth / 2,
      214,
      { align: "center" }
    );

    pdf.save(
      `QR-Absensi-${selectedStudent.nis}-${selectedStudent.nama}.pdf`
    );
  };

  // Membuka form tambah siswa
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
    setCreatedAccount(null);

    fetchCategories();
    setFormOpen(true);
  };

  // Membuka form edit siswa
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
    setCategoryError("");
    setFormOpen(true);

    fetchCategories();
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

  // Menyimpan siswa baru atau perubahan data siswa
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

        setCreatedAccount(null);
        setFormSuccess("Data siswa berhasil diperbarui.");
      } else {
        const response = await api.post("/students", payload);
        const result = response.data?.data;

        setCreatedAccount(result?.account ?? null);
        setFormSuccess("Siswa dan akun login berhasil dibuat.");
      }

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

  // Membuka modal konfirmasi hapus
  const openDeleteModal = (student) => {
    setDeleteStudentData(student);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteStudentData(null);
    setDeleteError("");
  };

  // Menghapus siswa dan akun login melalui backend
  const handleDeleteStudent = async () => {
    if (!deleteStudentData || deleting) return;

    const studentId = Number(deleteStudentData.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      setDeleteError(
        "ID siswa tidak valid. Silakan muat ulang halaman."
      );
      console.error("Data siswa tidak valid:", deleteStudentData);
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");
      setError("");
      setFormSuccess("");

      await api.delete(`/students/${studentId}`);

      setDeleteStudentData(null);
      setFormSuccess(
        "Data siswa dan akun login berhasil dihapus. Riwayat absensi tetap disimpan."
      );

      await fetchStudents();
    } catch (err) {
      console.error(
        "Gagal menghapus siswa:",
        err.response?.data ?? err
      );

      setDeleteError(
        err.response?.data?.message ||
          "Gagal menghapus siswa. Periksa koneksi atau log backend."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Menyalin informasi akun baru
  const handleCopyCredentials = async () => {
    if (!createdAccount) return;

    const password =
      createdAccount.initialPassword ??
      createdAccount.temporaryPassword;

    const text =
      `Username: ${createdAccount.username}\n` +
      `Password awal: ${password ?? ""}`;

    try {
      await navigator.clipboard.writeText(text);
      setFormSuccess("Kredensial akun berhasil disalin.");
    } catch {
      setFormError(
        "Gagal menyalin. Silakan salin username dan password secara manual."
      );
    }
  };

  // Pencarian siswa
  const filteredStudents = students.filter((student) => {
    const keyword = search.toLowerCase();

    return (
      student.nama?.toLowerCase().includes(keyword) ||
      String(student.nis ?? "").toLowerCase().includes(keyword) ||
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

        {/* Toolbar pencarian */}
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

        {/* Informasi akun baru */}
        {createdAccount && (
          <div className="mb-5 border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-blue-900">
                  Akun siswa berhasil dibuat
                </h3>

                <p className="mt-1 text-sm text-blue-800">
                  Simpan informasi login berikut dan sampaikan
                  kepada siswa secara aman.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreatedAccount(null)}
                className="text-blue-700 hover:text-blue-900"
                aria-label="Tutup informasi akun"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-blue-200 bg-white p-3">
                <p className="text-xs text-slate-500">Username</p>
                <p className="mt-1 break-all font-semibold text-slate-900">
                  {createdAccount.username}
                </p>
              </div>

              <div className="border border-blue-200 bg-white p-3">
                <p className="text-xs text-slate-500">
                  Password awal
                </p>
                <p className="mt-1 break-all font-semibold text-slate-900">
                  {createdAccount.initialPassword ??
                    createdAccount.temporaryPassword ??
                    "Tidak tersedia"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-blue-600 text-white"
                onPress={handleCopyCredentials}
              >
                Salin kredensial
              </Button>

              <Button
                size="sm"
                variant="flat"
                className="bg-white text-slate-700"
                onPress={() => setCreatedAccount(null)}
              >
                Selesai
              </Button>
            </div>

            <p className="mt-3 text-xs leading-5 text-blue-800">
              Password awal hanya ditampilkan pada sesi ini. Jika
              halaman dimuat ulang, password tidak dapat ditampilkan
              kembali dari database karena sudah di-hash.
            </p>
          </div>
        )}

        {/* Error pengambilan data */}
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Tabel siswa */}
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
                    {["No", "NIS", "Nama", "Kelas", "Jurusan"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      )
                    )}

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, index) => (
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
                            onPress={() => openDeleteModal(student)}
                          >
                            <Trash2 size={16} />
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal QR Code */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="relative w-full max-w-md border border-slate-200 bg-white shadow-xl">
            <button
              type="button"
              onClick={closeQRModal}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Tutup QR Code"
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
                    Memuat QR Code...
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
                      className="h-64 w-64 object-contain"
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

      {/* Modal Tambah/Edit Siswa */}
      {formOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingStudent ? "Edit Data Siswa" : "Tambah Siswa"}
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
                {/* NIS */}
                <div>
                  <label
                    htmlFor="student-nis"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nomor Induk Siswa (NIS)
                  </label>

                  <input
                    id="student-nis"
                    name="nis"
                    type="text"
                    value={formData.nis}
                    onChange={handleFormChange}
                    placeholder="Contoh: 2026001"
                    required
                    maxLength={100}
                    disabled={saving}
                    autoComplete="off"
                    className="h-11 w-full border border-slate-200 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {/* Nama siswa */}
                <div>
                  <label
                    htmlFor="student-nama"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nama Lengkap
                  </label>

                  <input
                    id="student-nama"
                    name="nama"
                    type="text"
                    value={formData.nama}
                    onChange={handleFormChange}
                    placeholder="Masukkan nama lengkap"
                    required
                    maxLength={100}
                    disabled={saving}
                    autoComplete="off"
                    className="h-11 w-full border border-slate-200 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {/* Dropdown kelas */}
                <div>
                  <label
                    htmlFor="student-kelas"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Kelas
                  </label>

                  <select
                    id="student-kelas"
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleFormChange}
                    required
                    disabled={saving || loadingCategories}
                    className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingCategories
                        ? "Memuat daftar kelas..."
                        : categories.KELAS.length === 0
                          ? "Belum ada kategori kelas"
                          : "Pilih kelas"}
                    </option>

                    {formData.kelas &&
                      !categories.KELAS.includes(formData.kelas) && (
                        <option value={formData.kelas}>
                          {formData.kelas} (data saat ini)
                        </option>
                      )}

                    {categories.KELAS.map((kelas) => (
                      <option key={kelas} value={kelas}>
                        {kelas}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown jurusan */}
                <div>
                  <label
                    htmlFor="student-jurusan"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Jurusan
                  </label>

                  <select
                    id="student-jurusan"
                    name="jurusan"
                    value={formData.jurusan}
                    onChange={handleFormChange}
                    required
                    disabled={saving || loadingCategories}
                    className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingCategories
                        ? "Memuat daftar jurusan..."
                        : categories.JURUSAN.length === 0
                          ? "Belum ada kategori jurusan"
                          : "Pilih jurusan"}
                    </option>

                    {formData.jurusan &&
                      !categories.JURUSAN.includes(formData.jurusan) && (
                        <option value={formData.jurusan}>
                          {formData.jurusan} (data saat ini)
                        </option>
                      )}

                    {categories.JURUSAN.map((jurusan) => (
                      <option key={jurusan} value={jurusan}>
                        {jurusan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error kategori */}
              {categoryError && (
                <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  <p>{categoryError}</p>

                  <button
                    type="button"
                    onClick={fetchCategories}
                    disabled={loadingCategories}
                    className="mt-2 font-medium underline disabled:opacity-50"
                  >
                    {loadingCategories
                      ? "Memuat..."
                      : "Muat ulang kategori"}
                  </button>
                </div>
              )}

              {/* Error form */}
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
                  disabled={saving}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  className="bg-blue-600 text-white"
                  disabled={saving || loadingCategories}
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
              <strong>{deleteStudentData.nis}</strong>, beserta akun
              login yang terkait. Riwayat absensi tetap disimpan.
            </p>

            <p className="mt-2 text-sm text-red-600">
              Tindakan ini tidak dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="flat"
                className="bg-slate-100 text-slate-700"
                onPress={closeDeleteModal}
                disabled={deleting}
              >
                Batal
              </Button>

              <Button
                className="bg-red-600 text-white"
                onPress={handleDeleteStudent}
                disabled={deleting}
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
