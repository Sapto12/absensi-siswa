import { Menu, X } from "lucide-react";
import { useState } from "react";

import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import { getUser } from "../lib/auth.js";

function AdminLayout({ children, title = "Dashboard" }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const user = getUser();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <div className="relative h-full">
                        <AdminSidebar
                            mobile
                            onNavigate={() => setMobileMenuOpen(false)}
                        />

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex h-9 w-9 items-center justify-center text-slate-600 lg:hidden"
                        >
                            <Menu size={21} />
                        </button>

                        <div>
                            <h1 className="text-base font-semibold text-slate-900">
                                {title}
                            </h1>

                            <p className="hidden text-xs text-slate-500 sm:block">
                                Sistem Absensi Siswa
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                            {user?.username || "Admin"}
                        </p>

                        <p className="text-xs text-slate-500">
                            Administrator
                        </p>
                    </div>
                </header>

                <main>{children}</main>
            </div>
        </div>
    );
}

export default AdminLayout;