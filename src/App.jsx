import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotesPage from "./pages/NotesPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-shell">
      {isAuthenticated && <NavBar />}
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/notes" : "/login"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;