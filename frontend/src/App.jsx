import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";
import Login from "./pages/auth/login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import Students from "./pages/admin/Students.jsx";

function Placeholder({ title }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                    {title}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Halaman sedang dalam pengembangan.
                </p>

                <a
                    href="/student"
                    className="mt-5 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    Kembali ke Dashboard
                </a>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/student"
                    element={<StudentDashboard />}
                />

                

                <Route
                    path="/student/attendance"
                    element={<Placeholder title="Riwayat Absensi" />}
                />

                <Route
                    path="/student/profile"
                    element={<Placeholder title="Profil Siswa" />}
                />

                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route
                    path="*"    
                    element={<Navigate to="/login" replace />}
                />
                <Route path="/admin/students" element={<Students />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;