import {
    LayoutDashboard,
    QrCode,
    ClipboardList,
    UserRound,
    LogOut,
    GraduationCap,
} from "lucide-react";

import { logout } from "@/lib/auth";

function StudentSidebar({ activePage = "dashboard" }) {
    const menuItems = [
        {
            name: "Dashboard",
            path: "/student",
            icon: LayoutDashboard,
            key: "dashboard",
        },
        {
            name: "Riwayat",
            path: "/student/attendance",
            icon: ClipboardList,
            key: "attendance",
        },
        {
            name: "Profil",
            path: "/student/profile",
            icon: UserRound,
            key: "profile",
        },
    ];

    return (
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-200 px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <GraduationCap size={20} />
                    </div>

                    <div>
                        <h1 className="text-sm font-bold text-slate-900">
                            AbsensiKu
                        </h1>
                        <p className="text-[11px] text-slate-500">
                            Sistem Absensi Siswa
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Menu
                </p>

                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.key;

                    return (
                        <a
                            key={item.key}
                            href={item.path}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <Icon size={19} />
                            <span>{item.name}</span>
                        </a>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-slate-200 p-4">
                <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut size={19} />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}

export default StudentSidebar;