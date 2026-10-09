import { useEffect, useState } from "react";
import {
    CalendarCheck,
    Clock3,
    LogIn,
    LogOut,
    QrCode,
    UserRound,
} from "lucide-react";
import { Button } from "@heroui/react";

import StudentLayout from "../../layouts/StudentLayout";
import QRScannerModal from "../../components/student/QRScannerModal.jsx";
import api from "@/services/api";
import { getUser } from "@/lib/auth";

function Dashboard() {
    const user = getUser();

    const [profile, setProfile] = useState(null);
    const [today, setToday] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [profileResponse, todayResponse] =
                    await Promise.all([
                        api.get("/student/profile"),
                        api.get("/student/today"),
                    ]);

                setProfile(profileResponse.data.data);
                setToday(todayResponse.data.data);
            } catch (error) {
                console.error("Gagal mengambil data dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const student = profile?.student;

    const getStatus = () => {
        if (!today) return "Belum Absen";

        return today.status === "HADIR"
            ? "Hadir"
            : today.status === "TERLAMBAT"
              ? "Terlambat"
              : today.status;
    };

    return (
        <StudentLayout
            activePage="dashboard"
            title="Dashboard"
        >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Welcome */}
                <section className="mb-6">
                    <p className="text-sm text-slate-500">
                        Selamat datang kembali,
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {loading
                            ? "Memuat..."
                            : student?.nama || user?.username}
                    </h2>

                    {!loading && student && (
                        <p className="mt-1 text-sm text-slate-500">
                            {student.kelas} • {student.jurusan}
                        </p>
                    )}
                </section>

                {/* Quick Action */}
                <section className="mb-6">
                    <div className="flex flex-col justify-between gap-5 rounded-2xl bg-blue-600 p-6 text-white shadow-sm sm:flex-row sm:items-center">
                        <div>
                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                                <QrCode size={21} />
                            </div>

                            <h3 className="text-lg font-semibold">
                                Sudah siap untuk absen?
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-blue-100">
                                Scan QR Code yang tersedia untuk mencatat
                                kehadiran kamu hari ini.
                            </p>
                        </div>

                        <Button
                            className="w-full bg-white font-semibold text-blue-600 sm:w-auto"
                            onPress={() => setScannerOpen(true)}
                        >
                            <QrCode size={18} />
                            Scan QR Sekarang
                        </Button>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Status */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Status Hari Ini
                                </p>

                                <p className="mt-2 text-xl font-bold text-slate-900">
                                    {loading ? "..." : getStatus()}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CalendarCheck size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Jam Masuk */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Jam Masuk
                                </p>

                                <p className="mt-2 text-xl font-bold text-slate-900">
                                    {loading
                                        ? "..."
                                        : today?.jamMasuk || "--:--"}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <LogIn size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Jam Pulang */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Jam Pulang
                                </p>

                                <p className="mt-2 text-xl font-bold text-slate-900">
                                    {loading
                                        ? "..."
                                        : today?.jamPulang || "--:--"}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <LogOut size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Identitas */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    NIS
                                </p>

                                <p className="mt-2 text-xl font-bold text-slate-900">
                                    {loading
                                        ? "..."
                                        : student?.nis || "-"}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <UserRound size={20} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Today Detail */}
                <section className="mt-6">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="font-semibold text-slate-900">
                                Absensi Hari Ini
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Detail kehadiran kamu hari ini.
                            </p>
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <Clock3
                                        size={18}
                                        className="animate-pulse"
                                    />
                                    Memuat data absensi...
                                </div>
                            ) : today ? (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Status
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-900">
                                            {getStatus()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Jam Masuk
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-900">
                                            {today.jamMasuk || "--:--"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Jam Pulang
                                        </p>

                                        <p className="mt-1 font-semibold text-slate-900">
                                            {today.jamPulang || "--:--"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                        <QrCode size={22} />
                                    </div>

                                    <h4 className="mt-3 font-semibold text-slate-900">
                                        Belum melakukan absensi
                                    </h4>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Silakan lakukan scan QR untuk mencatat
                                        kehadiran.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
           <QRScannerModal
    isOpen={scannerOpen}
    onClose={() => setScannerOpen(false)}
    onSuccess={(attendance) => {
        setToday(attendance);
    }}
/>
            </div>
        </StudentLayout>
    );
}

export default Dashboard;