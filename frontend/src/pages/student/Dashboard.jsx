import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Button } from "@heroui/react";

import StudentLayout from "../../layouts/StudentLayout";
import QRScannerModal from "../../components/student/QRScannerModal.jsx";
import api from "@/services/api";
import { getUser } from "@/lib/auth";

function formatTime(value) {
  if (!value) return "--:--";

  // Backend dapat mengirim waktu dalam format HH:mm atau HH:mm:ss.
  if (typeof value === "string") {
    const timeMatch = value.match(/^(\d{2}:\d{2})(?::\d{2})?$/);

    if (timeMatch) return timeMatch[1];

    // Jika nilai berupa tanggal dan waktu ISO.
    const isoMatch = value.match(/T(\d{2}:\d{2})/);

    if (isoMatch) return isoMatch[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function Dashboard() {
  const user = getUser();

  const [profile, setProfile] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState("checkin");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const [profileResponse, todayResponse] = await Promise.all([
        api.get("/student/profile"),
        api.get("/student/today"),
      ]);

      // Data profil: response.data.data.student
      // Data absensi: response.data.data.absensi
      setProfile(profileResponse.data?.data ?? null);
      setToday(todayResponse.data?.data ?? null);
    } catch (error) {
      console.error(
        "Gagal mengambil data dashboard:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Gagal mengambil data dashboard. Periksa koneksi backend dan login kamu."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const student = profile?.student;
  const attendance = today?.absensi ?? null;

  const hasCheckedIn = Boolean(attendance?.jamMasuk);
  const hasCheckedOut = Boolean(attendance?.jamPulang);

  const getStatus = () => {
    if (!attendance) return "Belum Absen";

    const statusMap = {
      HADIR: "Hadir",
      TERLAMBAT: "Terlambat",
      SAKIT: "Sakit",
      IZIN: "Izin",
      ALPHA: "Alpha",
    };

    return statusMap[attendance.status] || "Belum Absen";
  };

  const getStatusClass = () => {
    const statusMap = {
      HADIR: "bg-emerald-100 text-emerald-700",
      TERLAMBAT: "bg-amber-100 text-amber-700",
      SAKIT: "bg-blue-100 text-blue-700",
      IZIN: "bg-violet-100 text-violet-700",
      ALPHA: "bg-red-100 text-red-700",
    };

    return (
      statusMap[attendance?.status] ||
      "bg-slate-100 text-slate-600"
    );
  };

  const openScanner = (mode) => {
    setAttendanceMode(mode);
    setScannerOpen(true);
  };

  const handleScanSuccess = async () => {
    setScannerOpen(false);
    await fetchDashboard(true);
  };

  return (
    <StudentLayout activePage="dashboard" title="Dashboard">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">
              Selamat datang kembali,
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {loading
                ? "Memuat..."
                : student?.nama || user?.username || "Siswa"}
            </h2>

            {!loading && student && (
              <p className="mt-1 text-sm text-slate-500">
                {student.kelas || "-"} • {student.jurusan || "-"}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            isDisabled={refreshing}
            onPress={() => fetchDashboard(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Memuat..." : "Refresh"}
          </Button>
        </section>

        {/* ERROR */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              className="mt-2 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* BANNER ABSENSI */}
        <section className="flex flex-col justify-between gap-5 rounded-2xl bg-blue-600 p-6 text-white shadow-sm sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <QrCode size={21} />
            </div>

            <h3 className="text-lg font-semibold">
              {hasCheckedIn
                ? hasCheckedOut
                  ? "Absensi hari ini selesai"
                  : "Jangan lupa absen pulang"
                : "Sudah siap untuk absen?"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-blue-100">
              {hasCheckedIn
                ? hasCheckedOut
                  ? "Kamu sudah menyelesaikan absensi masuk dan pulang hari ini."
                  : "Absensi masuk berhasil. Lakukan scan QR kembali saat pulang."
                : "Scan QR Code yang tersedia untuk mencatat kehadiran kamu hari ini."}
            </p>
          </div>

          {!hasCheckedIn ? (
            <Button
              onPress={() => openScanner("checkin")}
              isDisabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50 sm:w-auto"
            >
              <LogIn size={18} />
              Scan QR Masuk
            </Button>
          ) : !hasCheckedOut ? (
            <Button
              onPress={() => openScanner("checkout")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50 sm:w-auto"
            >
              <LogOut size={18} />
              Scan QR Pulang
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 self-start rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold sm:self-auto">
              <CalendarCheck size={18} />
              Absensi Selesai
            </div>
          )}
        </section>

        {/* STATISTIK */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* STATUS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Status Hari Ini
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {loading ? "..." : getStatus()}
                </p>

                {!loading && (
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass()}`}
                  >
                    {getStatus()}
                  </span>
                )}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarCheck size={20} />
              </div>
            </div>
          </div>

          {/* JAM MASUK */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Jam Masuk</p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : formatTime(attendance?.jamMasuk)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Waktu kedatangan
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <LogIn size={20} />
              </div>
            </div>
          </div>

          {/* JAM PULANG */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Jam Pulang</p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : formatTime(attendance?.jamPulang)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Waktu kepulangan
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <LogOut size={20} />
              </div>
            </div>
          </div>

          {/* NIS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">NIS</p>

                <p className="mt-2 break-words text-xl font-bold text-slate-900">
                  {loading ? "..." : student?.nis || "-"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Nomor induk siswa
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <UserRound size={20} />
              </div>
            </div>
          </div>
        </section>

        {/* DETAIL ABSENSI HARI INI */}
        <section>
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
                  <Clock3 size={18} className="animate-pulse" />
                  Memuat data absensi...
                </div>
              ) : attendance ? (
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass()}`}
                    >
                      {getStatus()}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Jam Masuk
                    </p>

                    <p className="mt-2 font-semibold text-slate-900">
                      {formatTime(attendance.jamMasuk)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Jam Pulang
                    </p>

                    <p className="mt-2 font-semibold text-slate-900">
                      {formatTime(attendance.jamPulang)}
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
                    Silakan scan QR Code untuk mencatat kehadiran.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* INFORMASI SISWA */}
        <section>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Informasi Siswa
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Informasi akun yang sedang login.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Nama Lengkap
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {loading ? "..." : student?.nama || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  NIS
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {loading ? "..." : student?.nis || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Kelas
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {loading ? "..." : student?.kelas || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Jurusan
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {loading ? "..." : student?.jurusan || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL SCAN QR */}
      <QRScannerModal
        isOpen={scannerOpen}
        mode={attendanceMode}
        onClose={() => setScannerOpen(false)}
        onSuccess={handleScanSuccess}
        onConflict={handleScanSuccess}
      />
    </StudentLayout>
  );
}

export default Dashboard;