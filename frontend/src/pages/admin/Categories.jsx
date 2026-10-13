
import { useCallback, useEffect, useState } from "react";
import {
    Tags,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    GraduationCap,
    BookOpen,
    LoaderCircle,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout.jsx";
import api from "../../services/api.js";

const EMPTY_FORM = { name: "", type: "KELAS" };

function Categories() {
    const [categories, setCategories] = useState({
        KELAS: [],
        JURUSAN: [],
        categories: [],
    });

    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchCategories = useCallback(async () => {
        try {
            setError("");

            const response = await api.get("/categories");
            const data = response.data?.data;

            setCategories({
                KELAS: data?.KELAS ?? [],
                JURUSAN: data?.JURUSAN ?? [],
                categories: data?.categories ?? [],
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Gagal mengambil data kategori."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const name = form.name.trim();

        if (!name) {
            setError("Nama kategori wajib diisi.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            if (editingId !== null) {
                await api.put(`/categories/${editingId}`, {
                    name,
                });

                setMessage("Kategori berhasil diperbarui.");
            } else {
                await api.post("/categories", {
                    name,
                    type: form.type,
                });

                setMessage("Kategori berhasil ditambahkan.");
            }

            setForm(EMPTY_FORM);
            setEditingId(null);

            await fetchCategories();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Gagal menyimpan kategori."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        if (category.isLegacy) {
            setError(
                "Kategori data lama belum tersimpan sebagai kategori. Tambahkan kategori tersebut terlebih dahulu."
            );
            return;
        }

        setEditingId(category.id);

        setForm({
            name: category.name,
            type: category.type,
        });

        setError("");
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (category) => {
        if (category.isLegacy) {
            setError(
                "Kategori data lama tidak dapat dihapus sebelum disimpan sebagai kategori."
            );
            return;
        }

        const confirmed = window.confirm(
            `Apakah kamu yakin ingin menghapus kategori "${category.name}"?\n\n` +
                "Kategori yang masih digunakan siswa tidak dapat dihapus."
        );

        if (!confirmed) return;

        try {
            setDeletingId(category.id);
            setError("");
            setMessage("");

            await api.delete(`/categories/${category.id}`);

            setMessage("Kategori berhasil dihapus.");

            if (editingId === category.id) {
                setForm(EMPTY_FORM);
                setEditingId(null);
            }

            await fetchCategories();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Gagal menghapus kategori."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const renderCategoryList = (type, title, Icon) => {
        const savedItems = categories.categories.filter(
            (item) => item.type === type
        );

        // Gabungkan kategori tersimpan dengan nilai kelas/jurusan
        // dari data siswa lama agar tidak ada data yang hilang.
        const savedNames = new Set(
            savedItems.map((item) => item.name.toLowerCase())
        );

        const legacyItems = categories[type]
            .filter((name) => !savedNames.has(name.toLowerCase()))
            .map((name) => ({
                id: `legacy-${type}-${name}`,
                name,
                type,
                isLegacy: true,
            }));

        const items = [
            ...savedItems,
            ...legacyItems,
        ].sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon size={20} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900">
                            {title}
                        </h3>

                        <p className="text-sm text-slate-500">
                            {items.length} pilihan tersedia
                        </p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {items.map((category) => (
                        <div
                            key={`${type}-${category.id}`}
                            className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                        >
                            <div className="min-w-0">
                                <p className="break-words text-sm font-medium text-slate-700">
                                    {category.name}
                                </p>

                                {category.isLegacy && (
                                    <span className="mt-1 inline-block text-xs text-amber-600">
                                        Data siswa lama
                                    </span>
                                )}
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    title="Edit kategori"
                                    aria-label={`Edit ${category.name}`}
                                    disabled={
                                        category.isLegacy ||
                                        saving ||
                                        deletingId !== null
                                    }
                                    onClick={() => handleEdit(category)}
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    type="button"
                                    title="Hapus kategori"
                                    aria-label={`Hapus ${category.name}`}
                                    disabled={
                                        category.isLegacy ||
                                        saving ||
                                        deletingId !== null
                                    }
                                    onClick={() => handleDelete(category)}
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {deletingId === category.id ? (
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <p className="p-5 text-sm text-slate-500">
                            Belum ada kategori. Tambahkan kategori baru.
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title="Kategori">
            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                        <GraduationCap size={17} />
                        <span>Panel Administrator</span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Kategori Kelas dan Jurusan
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Kelola pilihan kategori untuk data siswa.
                    </p>
                </div>

                {/* Notifikasi */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Tutup pesan error"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {message && (
                    <div
                        role="status"
                        className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                    >
                        <p>{message}</p>

                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            aria-label="Tutup pesan sukses"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Form tambah dan edit */}
                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            {editingId !== null ? (
                                <Pencil size={19} />
                            ) : (
                                <Plus size={20} />
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-900">
                                {editingId !== null
                                    ? "Edit Kategori"
                                    : "Tambah Kategori"}
                            </h3>

                            <p className="text-sm text-slate-500">
                                {editingId !== null
                                    ? "Perubahan nama akan diterapkan pada siswa terkait."
                                    : "Masukkan nama kelas atau jurusan baru."}
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <div>
                            <label
                                htmlFor="category-type"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Jenis Kategori
                            </label>

                            <select
                                id="category-type"
                                value={form.type}
                                disabled={
                                    editingId !== null || saving
                                }
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        type: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            >
                                <option value="KELAS">Kelas</option>
                                <option value="JURUSAN">Jurusan</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="category-name"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Nama Kategori
                            </label>

                            <input
                                id="category-name"
                                type="text"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder={
                                    form.type === "KELAS"
                                        ? "Contoh: X RPL 1"
                                        : "Contoh: Rekayasa Perangkat Lunak"
                                }
                                maxLength={100}
                                required
                                disabled={saving}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                disabled={saving || !form.name.trim()}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? (
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={16} />
                                )}

                                {saving
                                    ? "Menyimpan..."
                                    : editingId !== null
                                      ? "Simpan Perubahan"
                                      : "Tambah"}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={resetForm}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <X size={16} />
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Daftar kategori */}
                {loading ? (
                    <div className="py-12 text-center">
                        <LoaderCircle
                            size={28}
                            className="mx-auto animate-spin text-blue-600"
                        />

                        <p className="mt-3 text-sm text-slate-500">
                            Memuat kategori...
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-2">
                        {renderCategoryList(
                            "KELAS",
                            "Daftar Kelas",
                            GraduationCap
                        )}

                        {renderCategoryList(
                            "JURUSAN",
                            "Daftar Jurusan",
                            BookOpen
                        )}
                    </div>
                )}

                {/* Informasi */}
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    <Tags
                        size={18}
                        className="mt-1 shrink-0"
                    />

                    <p>
                        Kategori yang berasal dari data siswa lama tetap
                        ditampilkan. Kategori tersebut belum dapat diedit
                        atau dihapus sampai tersimpan dalam tabel kategori.
                        Kategori tersimpan yang masih digunakan oleh siswa
                        juga dapat ditolak saat dihapus oleh backend.
                    </p>
                </div>
            </section>
        </AdminLayout>
    );
}

export default Categories;
