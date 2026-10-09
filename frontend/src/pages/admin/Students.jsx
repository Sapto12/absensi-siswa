import { useEffect, useState } from "react";

import{
    Download,
    Eye,
    LoaderCircle,
    Printer,
    QrCode,
    Search,
    Users,
    x,
} from "lucide-react";
import { Button, Input } from "@heroui/react";
import { jsPDF} from "jspdf";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api.js";

function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [qrCode, setQrCode] = useState("");
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState("");

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async() => {
        try{
            setLoading(true);
            setError("");

            const response = await api.get("/students");
            const data = response.data?.data ?? response.data ?? [];
            setStudents(Array.isArray(data) ? data : []);

            
        }catch(err){
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Gagal mengambil data siswa."

            );

           }
    }