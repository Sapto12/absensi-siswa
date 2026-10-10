
import { useEffect, useState } from "react";
import {
    CalendarCheck,
    GraduationCap,
    Users,
    Clock3,
    RefreshCw,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout.jsx";
import api from "../../services/api.js";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        try {
            setError("");

            const response = await api.get("/attendance/dashboard");
            setStats(response.data.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Gagal mengambil statistik dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const cards = [
        {
            title: "Data Siswa",
            value: stats?.totalSiswa ?? 0,
            description: "Total siswa terdaftar",
            icon: Users,
            iconStyle: "bg-blue-50 text-blue-600",
        },
        {
            title: "Absensi Hari Ini",
            value: stats?.absensiHariIni ?? 0,
            description: "Siswa yang sudah tercatat absen",
            icon: CalendarCheck,
            iconStyle: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Terlambat Hari Ini",
            value: stats?.terlambat ?? 0,
            description: "Siswa dengan status terlambat",
            icon: Clock3,
            iconStyle: "bg-amber-50 text-amber-600",
        },
    ];

    const formatTanggal = (tanggal) => {
        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
        }).format(new Date(`${tanggal}T00:00:00`));
    };

    return (
        <AdminLayout title="Dashboard">
            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                            <GraduationCap size={17} />
                            <span>Panel Administrator</span>
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Dashboard
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Ringkasan data siswa dan aktivitas absensi.
                        </p>
                    </div>

                    <button
                        onClick={fetchDashboard}
                        disabled={loading}
                        className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Perbarui
                    </button>
                </div>

                {error && (
                    <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                className="border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div
                                    className={`mb-5 flex h-10 w-10 items-center justify-center ${card.iconStyle}`}
                                >
                                    <Icon size={20} />
                                </div>

                                <p className="text-sm text-slate-500">
                                    {card.title}
                                </p>

                                <p className="mt-1 text-3xl font-bold text-slate-900">
                                    {loading ? "..." : card.value}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    {card.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    {/* Grafik absensi */}
                    <div className="border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900">
                            Aktivitas Absensi
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Jumlah catatan absensi selama 7 hari terakhir.
                        </p>

                        <div className="mt-6 space-y-4">
                            {(stats?.absensiPerHari ?? []).map((item) => {
                                const max = Math.max(
                                    1,
                                    ...(stats?.absensiPerHari ?? []).map(
                                        (row) => row.jumlah
                                    )
                                );

                                return (
                                    <div key={item.tanggal}>
                                        <div className="mb-1 flex justify-between gap-3 text-xs">
                                            <span className="text-slate-600">
                                                {formatTanggal(item.tanggal)}
                                            </span>
                                            <span className="font-semibold text-slate-800">
                                                {item.jumlah} siswa
                                            </span>
                                        </div>

                                        <div className="h-3 overflow-hidden bg-slate-100">
                                            <div
                                                className="h-full bg-blue-600 transition-all"
                                                style={{
                                                    width: `${(item.jumlah / max) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {!loading &&
                                !error &&
                                stats?.absensiPerHari?.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        Belum ada data absensi.
                                    </p>
                                )}
                        </div>
                    </div>

                    {/* Grafik siswa per kelas */}
                    <div className="border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900">
                            Jumlah Siswa per Kelas
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Distribusi siswa berdasarkan kelas.
                        </p>

                        <div className="mt-6 space-y-4">
                            {(stats?.siswaPerKelas ?? []).map((item) => {
                                const max = Math.max(
                                    1,
                                    ...(stats?.siswaPerKelas ?? []).map(
                                        (row) => row.jumlah
                                    )
                                );

                                return (
                                    <div key={item.kelas}>
                                        <div className="mb-1 flex justify-between gap-3 text-xs">
                                            <span className="font-medium text-slate-700">
                                                {item.kelas}
                                            </span>
                                            <span className="text-slate-500">
                                                {item.jumlah} siswa
                                            </span>
                                        </div>

                                        <div className="h-3 overflow-hidden bg-slate-100">
                                            <div
                                                className="h-full bg-emerald-500 transition-all"
                                                style={{
                                                    width: `${(item.jumlah / max) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {!loading &&
                                !error &&
                                stats?.siswaPerKelas?.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        Belum ada data siswa.
                                    </p>
                                )}
                        </div>
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}

export default Dashboard;
