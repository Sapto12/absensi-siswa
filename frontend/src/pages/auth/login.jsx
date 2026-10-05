import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";

import api from "../../services/api";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

export default function Login() {
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
        setLoading(true);

        try {
            const response = await api.post("/auth/login", form);

            const { token, user } = response.data.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "ADMIN") {
                navigate("/admin");
            } else {
                navigate("/student");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Username atau password salah"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
                        <ShieldCheck size={30} />
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Absensi Siswa
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Sistem absensi berbasis QR Code
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Masuk</CardTitle>

                        <CardDescription>
                            Masukkan username dan password Anda
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="username">
                                    Username
                                </Label>

                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="Masukkan username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password
                                </Label>

                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Masukkan password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    "Memproses..."
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        Masuk
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Sistem Absensi Siswa © 2026
                </p>
            </div>
        </div>
    );
}