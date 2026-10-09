import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

import StudentSidebar from "../components/student/StudentSidebar";
import { logout } from "@/lib/auth";

function StudentLayout({ children, activePage = "dashboard", title }) {
    const [mobileMenu, setMobileMenu] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex min-h-screen">
                {/* Desktop Sidebar */}
                <StudentSidebar activePage={activePage} />

                {/* Mobile Sidebar */}
                {mobileMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
                            onClick={() => setMobileMenu(false)}
                        />

                        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white lg:hidden">
                            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
                                <div>
                                    <h1 className="font-bold text-slate-900">
                                        AbsensiKu
                                    </h1>
                                    <p className="text-xs text-slate-500">
                                        Sistem Absensi Siswa
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setMobileMenu(false)}
                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-1 p-4">
                                <a
                                    href="/student"
                                    className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-600"
                                >
                                    Dashboard
                                </a>

                                <a
                                    href="/student/scan"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Scan QR
                                </a>

                                <a
                                    href="/student/attendance"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Riwayat
                                </a>

                                <a
                                    href="/student/profile"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Profil
                                </a>
                            </nav>

                            <div className="border-t border-slate-200 p-4">
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut size={18} />
                                    Keluar
                                </button>
                            </div>
                        </aside>
                    </>
                )}

                {/* Main */}
                <div className="min-w-0 flex-1">
                    {/* Header */}
                    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileMenu(true)}
                                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
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
                        </div>
                    </header>

                    {/* Page Content */}
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
}

export default StudentLayout;