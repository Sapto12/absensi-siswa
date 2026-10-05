import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <div className="p-10">
                            Dashboard Admin
                        </div>
                    }
                />

                <Route
                    path="/student"
                    element={
                        <div className="p-10">
                            Dashboard Siswa
                        </div>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;