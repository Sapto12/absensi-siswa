
import {
    CalendarCheck,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Users,
    Tags,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { logout } from "../../lib/auth.js";

const menuItems = [
    {
        label: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
    },
    {
        label: "Data Siswa",
        path: "/admin/students",
        icon: Users,
    },
    {
        label: "Absensi",
        path: "/admin/attendance",
        icon: CalendarCheck,
    },
    {
        label: "Kategori",
        path: "/admin/categories",
        icon: Tags,
    },
];

function AdminSidebar({ mobile = false, onNavigate }) {
    const location = useLocation();

    return (
        <aside
            className={`flex h-full flex-col bg-white ${
                mobile
                    ? "w-72 border-r border-slate-200"
                    : "w-64 border-r border-slate-200"
            }`}
        >
            <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <GraduationCap size={20} />
                </div>

                <div>
                    <h1 className="text-sm font-bold text-slate-900">
                        Absensi Siswa
                    </h1>
                    <p className="text-xs text-slate-500">Panel Admin</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    const isActive =
                        item.path === "/admin"
                            ? location.pathname === "/admin"
                            : location.pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 p-3">
                <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                    <LogOut size={18} />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}

export default AdminSidebar;
