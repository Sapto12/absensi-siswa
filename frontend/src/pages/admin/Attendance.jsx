
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@heroui/react";

import AdminLayout from "../../layouts/AdminLayout.jsx";
import api from "@/services/api";

function formatTime(value) {
  if (!value) return "-";

  const match = String(value).match(/(?:T|^)(\d{2}):(\d{2})/);
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

function formatDate(value) {
  if (!value) return "Hari ini";

  const date = String(value).split("T")[0];
  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");

  const fetchAttendance = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await api.get("/attendance/today");
      setData(response.data?.data ?? null);
    } catch (err) {
      console.error("Gagal mengambil absensi:", err);
      setError(
        err.response?.data?.message ||
          "Data absensi gagal dimuat. Periksa koneksi backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const statistics = data?.statistik ?? {};
  const records = Array.isArray(data?.absensi) ? data.absensi : [];

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      const student = record.student ?? {};

      const matchesSearch = [
        student.nama,
        student.nis,
        student.kelas,
        student.jurusan,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

      const matchesStatus =
        statusFilter === "SEMUA" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const cards = [
    {
      label: "Total Siswa",
      value: statistics.totalSiswa ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Sudah Absen",
      value: statistics.sudahAbsen ?? 0,
      icon: CalendarCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Hadir",
      value: statistics.hadir ?? 0,
      icon: Users,
      color: "bg-teal-50 text-teal-600",
    },
    {
      label: "Terlambat",
      value: statistics.terlambat ?? 0,
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <AdminLayout title="Absensi">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Data Absensi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(data?.tanggal)} · Pantau kehadiran siswa.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon size={20} />
                </div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {loading ? "..." : card.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Daftar Kehadiran
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Data absensi siswa pada hari ini.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, NIS, kelas..."
                  className="min-w-0 py-2 text-sm outline-none sm:w-56"
                  aria-label="Cari siswa"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                aria-label="Filter status"
              >
                <option value="SEMUA">Semua status</option>
                <option value="HADIR">Hadir</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="SAKIT">Sakit</option>
                <option value="IZIN">Izin</option>
                <option value="ALPHA">Alpha</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Siswa</th>
                  <th className="px-5 py-4">NIS</th>
                  <th className="px-5 py-4">Kelas</th>
                  <th className="px-5 py-4">Jam Masuk</th>
                  <th className="px-5 py-4">Jam Pulang</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      Memuat data absensi...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      Tidak ada data yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const student = record.student ?? {};

                    return (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                          {student.nama || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {student.nis || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {student.kelas || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatTime(record.jamMasuk)}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Menampilkan {loading ? "..." : filteredRecords.length} catatan.
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}

export default Attendance;
