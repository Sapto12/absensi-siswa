import { Button } from "@heroui/react";

function App() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-blue-600">
                    Sistem Absensi Digital
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                    Absensi Siswa
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    Sistem absensi siswa berbasis QR Code untuk pengelolaan
                    kehadiran yang lebih cepat dan terintegrasi.
                </p>

                <Button
                    className="mt-6"
                    color="primary"
                >
                    Mulai
                </Button>
            </div>
        </main>
    );
}

export default App;