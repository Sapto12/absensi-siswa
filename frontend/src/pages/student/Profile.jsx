
import { useCallback, useEffect, useState } from "react";
import { GraduationCap, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@heroui/react";

import StudentLayout from "../../layouts/StudentLayout";
import api from "@/services/api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student/profile");
      setProfile(response.data?.data ?? null);
    } catch (err) {
      console.error("Gagal mengambil profil:", err);
      setError(
        err.response?.data?.message || "Data profil gagal dimuat."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const student = profile?.student;
  const user = profile?.user;

  const fields = [
    { label: "Nama Lengkap", value: student?.nama },
    { label: "Nomor Induk Siswa", value: student?.nis },
    { label: "Kelas", value: student?.kelas },
    { label: "Jurusan", value: student?.jurusan },
    { label: "Username", value: user?.username },
    { label: "Role Akun", value: user?.role },
  ];

  return (
    <StudentLayout activePage="profile" title="Profil Siswa">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Profil Siswa
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informasi akun dan identitas siswa.
            </p>
          </div>

          <Button
            variant="outline"
            disabled={loading}
            onPress={fetchProfile}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
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
              onClick={fetchProfile}
              className="ml-2 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-blue-600 px-6 py-8 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <UserRound size={32} />
              </div>

              <div>
                <p className="text-sm text-blue-100">Profil akun siswa</p>
                <h3 className="mt-1 text-xl font-bold">
                  {loading ? "Memuat profil..." : student?.nama || "Siswa"}
                </h3>
                <p className="mt-1 text-sm text-blue-100">
                  {student?.nis || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <GraduationCap size={20} className="text-blue-600" />
              <h4 className="font-semibold text-slate-900">
                Informasi Identitas
              </h4>
            </div>

            {loading ? (
              <p className="py-5 text-sm text-slate-500">
                Memuat data profil...
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {field.label}
                    </p>
                    <p className="mt-2 break-words font-semibold text-slate-900">
                      {field.value || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Data identitas pada halaman ini bersifat informatif. Perubahan
              data siswa dilakukan melalui administrator agar data tetap
              konsisten dengan catatan absensi.
            </p>
          </div>
        </section>
      </main>
    </StudentLayout>
  );
}

export default Profile;
