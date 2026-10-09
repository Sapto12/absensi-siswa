import {
    CalendarCheck,
    GraduationCap,
    Users,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout.jsx";

function Dashboard() {
    return (
        <AdminLayout title="Dashboard">
            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                        <GraduationCap size={17} />
                        <span>Panel Administrator</span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Dashboard
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Kelola data siswa dan aktivitas absensi.
                    </p>
                </div>

                {/* Statistics */}
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-600">
                            <Users size={20} />
                        </div>

                        <p className="text-sm text-slate-500">
                            Data Siswa
                        </p>

                        <p className="mt-1 text-3xl font-bold text-slate-900">
                            0
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Total siswa terdaftar
                        </p>
                    </div>

                    <div className="border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-600">
                            <CalendarCheck size={20} />
                        </div>

                        <p className="text-sm text-slate-500">
                            Absensi Hari Ini
                        </p>

                        <p className="mt-1 text-3xl font-bold text-slate-900">
                            0
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Siswa sudah melakukan absensi
                        </p>
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}

export default Dashboard;