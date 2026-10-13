import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn } from "lucide-react";
import { Button, Input } from "@heroui/react";
import { apiRequest } from "../../lib/api";

export async function login(username, password) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const { token, user } = result.data;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  if (user.mustChangePassword) {
  window.location.assign("/student/profile");
  return;
}

  window.location.assign(
    user.role === "ADMIN" ? "/admin" : "/student"
  );
}
import api from "@/services/api";

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!form.username || !form.password) {
            setError("Username dan password wajib diisi.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/login", form);

            const { token, user } = response.data.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "ADMIN") {
                navigate("/admin", { replace: true });
            } else {
                navigate("/student", { replace: true });
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Username atau password salah."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-blue-600">
            <div className="grid min-h-screen lg:grid-cols-2">

                {/* LEFT */}
                <section className="hidden bg-blue-600 lg:flex">
                    <div className="flex w-full flex-col justify-between p-12 text-white">

                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600">
                                <ShieldCheck size={23} />
                            </div>

                            <div>
                                <p className="font-semibold">
                                   absensi Siswa
                                </p>

                                <p className="text-sm text-blue-100">
                                    Sistem Kehadiran Digital
                                </p>
                            </div>
                        </div>

                        <div className="max-w-lg">
                            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-100">
                                Sistem Absensi
                            </p>

                            <h1 className="text-5xl font-bold leading-tight">
                                Kelola kehadiran siswa dengan lebih mudah.
                            </h1>

                            <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
                                Kelola data siswa, absensi, QR Code, dan
                                riwayat kehadiran dalam satu sistem
                                terintegrasi.
                            </p>
                        </div>

                        <p className="text-sm text-blue-100">
                            © 2026 Absensi Siswa
                        </p>
                    </div>
                </section>

                {/* RIGHT */}
                <section className="flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-md">

                        <div className="mb-8 lg:hidden">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                                    <ShieldCheck size={23} />
                                </div>

                                <div>
                                    <p className="font-semibold text-slate-900">
                                        absen
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        Sistem Kehadiran Digital
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

                            <div className="mb-8">
                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <LogIn size={21} />
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900">
                                    Selamat datang
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Masuk untuk mengakses sistem absensi.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >
                                <Input
                                    name="username"
                                    label="Username"
                                    placeholder="Masukkan username"
                                    value={form.username}
                                    onChange={handleChange}
                                    variant="bordered"
                                    isDisabled={loading}
                                />

                                <Input
                                    name="password"
                                    label="Password"
                                    placeholder="Masukkan password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    variant="bordered"
                                    isDisabled={loading}
                                />

                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    color="primary"
                                    size="lg"
                                    className="w-full font-medium"
                                    isLoading={loading}
                                >
                                    {loading
                                        ? "Memproses..."
                                        : "Masuk"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Login;