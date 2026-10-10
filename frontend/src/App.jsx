
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import Students from "./pages/admin/Students.jsx";
import AdminAttendance from "./pages/admin/Attendance.jsx";

import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentAttendance from "./pages/student/Attendance.jsx";
import StudentProfile from "./pages/student/Profile.jsx";

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
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<Students />} />
        <Route
          path="/admin/attendance"
          element={<AdminAttendance />}
        />

        {/* Siswa */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route
          path="/student/attendance"
          element={<StudentAttendance />}
        />
        <Route
          path="/student/profile"
          element={<StudentProfile />}
        />

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;






























