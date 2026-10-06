import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import api from "@/services/api";


const login = () =>{
    const navigate = useNavigate();

    const [form, setform] = useState({
        username: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) =>{
        setform({
            ...form,
            [e.target.name]: e.target.value,
        });
    };


    const handleSubmit = async(e) => {
        e.preverntDefault();


        setError("");

        if(!form.username || !form.password){
            setError("Username dan Password wajib diisi");
            return;
        }
        try{
            setLoading(true);

            const response = await api.post("/auth/login", form);

            const { token, user } = response.data.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            
            if (user.role === "ADMIN"){
                navigate("/admin", { replace: true});
            }else{
                navigate("/student", { replace:true});
            }

        }catch(error){
            const message =
                error.response?.data?.message ||
                "Username atau password salah";

            setError(message);

        }finally{
            setError(false);
        }
        
    };
    return(
        <main className="min-h-screen bg-slate-50">
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* left side */}


                <section className="hidden bg-blue-600 lg:flex">
                    <div className="flex"></div>
                    <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg white text-blue-600">
                        <ShieldCheck size={22}/>
                    </div>
                    <div className="">
                        <p className="text-lg font-bold">
                            Absensi siswa
                        </p>
                        <p className="text-sm text-blue-100">
                            Absensi siswa
                        </p>
                    </div>
                    </div>
                </section>
            </div>
        </main>
    )
}