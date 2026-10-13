
import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  RefreshCw,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@heroui/react";

import StudentLayout from "../../layouts/StudentLayout";
import api from "@/services/api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError("Semua kolom password wajib diisi.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword.length > 128) {
      setPasswordError("Password baru maksimal 128 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "Konfirmasi password baru tidak cocok."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Password baru harus berbeda dari password lama."
      );
      return;
    }

    try {
      setChangingPassword(true);

      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(
        "Password berhasil diubah. Silakan login kembali menggunakan password baru."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Sesuaikan key ini dengan mekanisme penyimpanan sesi aplikasi.
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Beri waktu agar pesan keberhasilan terbaca.
      window.setTimeout(() => {
        window.location.assign("/login");
      }, 1500);
    } catch (err) {
      console.error("Gagal mengganti password:", err);

      setPasswordError(
        err.response?.data?.message ||
          "Password gagal diubah. Silakan coba kembali."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordFields = [
    {
      key: "current",
      label: "Password Lama",
      value: currentPassword,
      setter: setCurrentPassword,
      placeholder: "Masukkan password saat ini",
      autoComplete: "current-password",
    },
    {
      key: "new",
      label: "Password Baru",
      value: newPassword,
      setter: setNewPassword,
      placeholder: "Minimal 8 karakter",
      autoComplete: "new-password",
    },
    {
      key: "confirm",
      label: "Konfirmasi Password Baru",
      value: confirmPassword,
      setter: setConfirmPassword,
      placeholder: "Ulangi password baru",
      autoComplete: "new-password",
    },
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
              Informasi akun, identitas, dan keamanan akun siswa.
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

        {/* Informasi identitas siswa */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-blue-600 px-6 py-8 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <UserRound size={32} />
              </div>

              <div>
                <p className="text-sm text-blue-100">
                  Profil akun siswa
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  {loading
                    ? "Memuat profil..."
                    : student?.nama || "Siswa"}
                </h3>
                <p className="mt-1 text-sm text-blue-100">
                  {student?.nis || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <GraduationCap
                size={20}
                className="text-blue-600"
              />
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
              Data identitas pada halaman ini bersifat informatif.
              Perubahan data siswa dilakukan melalui administrator
              agar data tetap konsisten dengan catatan absensi.
            </p>
          </div>
        </section>

        {/* Ganti password */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <LockKeyhole size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Keamanan Akun
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Ganti password untuk menjaga keamanan akunmu.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0 text-blue-600"
              />
              <p className="text-sm leading-6 text-blue-800">
                Gunakan password yang kuat dan tidak mudah
                ditebak. Setelah password berhasil diubah,
                kamu akan diminta login kembali.
              </p>
            </div>

            {passwordSuccess && (
              <div
                role="status"
                className="mb-5 flex gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
              >
                <CheckCircle2
                  size={20}
                  className="shrink-0"
                />
                <p>{passwordSuccess}</p>
              </div>
            )}

            {passwordError && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {passwordError}
              </div>
            )}

            <form
              onSubmit={handleChangePassword}
              className="space-y-5"
            >
              {passwordFields.map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`password-${field.key}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {field.label}
                  </label>

                  <div className="relative">
                    <input
                      id={`password-${field.key}`}
                      type={
                        showPasswords[field.key]
                          ? "text"
                          : "password"
                      }
                      autoComplete={field.autoComplete}
                      value={field.value}
                      onChange={(event) =>
                        field.setter(event.target.value)
                      }
                      placeholder={field.placeholder}
                      minLength={
                        field.key === "current" ? undefined : 8
                      }
                      maxLength={128}
                      required
                      disabled={changingPassword}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        togglePasswordVisibility(field.key)
                      }
                      aria-label={
                        showPasswords[field.key]
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-700"
                    >
                      {showPasswords[field.key] ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  Password baru harus terdiri dari 8–128
                  karakter.
                </p>

                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LockKeyhole size={16} />
                  {changingPassword
                    ? "Menyimpan..."
                    : "Simpan Password"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </StudentLayout>
  );
}

export default Profile;
