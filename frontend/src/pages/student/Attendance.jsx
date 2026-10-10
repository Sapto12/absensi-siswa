
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";

import StudentLayout from "../../layouts/StudentLayout";
import api from "@/services/api";

function formatDate(value) {
  if (!value) return "-";

  const date = String(value).split("T")[0];
  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";

  const match = String(value).match(
    /(?:T|^)(\d{2}):(\d{2})/
  );

  if (match) return `${match[1]}:${match[2]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const statusStyles = {
  HADIR: "bg-emerald-100 text-emerald-700",
  TERLAMBAT: "bg-amber-100 text-amber-700",
  SAKIT: "bg-blue-100 text-blue-700",
  IZIN: "bg-violet-100 text-violet-700",
  ALPHA: "bg-red-100 text-red-700",
};

const statusLabels = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPHA: "Alpha",
};

function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("SEMUA");

  const fetchAttendance = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await api.get("/student/attendance");
      const data = response.data?.data;

      setRecords(Array.isArray(data?.riwayat) ? data.riwayat : []);
    } catch (err) {
      console.error("Gagal mengambil riwayat:", err);

      setError(
        err.response?.data?.message ||
          "Riwayat absensi gagal dimuat."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredRecords =
    filter === "SEMUA"
      ? records
      : records.filter((item) => item.status === filter);

  return (
    <StudentLayout activePage="attendance" title="Riwayat Absensi">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Riwayat Absensi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lihat catatan kehadiran yang tersimpan.
            </p>
          </div>

          <Button
            variant="outline"
            disabled={refreshing}
            onPress={() => fetchAttendance(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Catatan</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "..." : records.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Hadir</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {loading
                ? "..."
                : records.filter((r) => r.status === "HADIR").length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Terlambat</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {loading
                ? "..."
                : records.filter((r) => r.status === "TERLAMBAT").length}
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => fetchAttendance(true)}
              className="ml-2 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Catatan Kehadiran
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Data berdasarkan akun siswa yang sedang login.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              aria-label="Filter status absensi"
            >
              <option value="SEMUA">Semua status</option>
              <option value="HADIR">Hadir</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="SAKIT">Sakit</option>
              <option value="IZIN">Izin</option>
              <option value="ALPHA">Alpha</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Jam Masuk</th>
                  <th className="px-5 py-4">Jam Pulang</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      Memuat riwayat absensi...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <CalendarDays className="mx-auto mb-2 text-slate-400" size={24} />
                      <p className="font-medium text-slate-700">
                        Belum ada catatan absensi
                      </p>
                      <p className="mt-1 text-slate-500">
                        Coba ubah filter atau periksa kembali nanti.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                        {formatDate(record.tanggal)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={15} />
                          {formatTime(record.jamMasuk)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatTime(record.jamPulang)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[record.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabels[record.status] || record.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </StudentLayout>
  );
}

export default Attendance;
