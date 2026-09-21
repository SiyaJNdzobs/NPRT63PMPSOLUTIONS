import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { AppFooter } from "@/components/AppFooter";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import ChangeSecret from "@/pages/ChangeSecret";
import Dashboard from "@/pages/Dashboard";
import Scan from "@/pages/Scan";
import PublicShare from "@/pages/PublicShare";

function App() {
  return (
    <div className="App min-h-screen bg-[#0A0D14]">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" theme="dark" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/change-secret" element={<ChangeSecret />} />
            <Route
              path="/dashboard"
              element={
                <RoleGuard>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route path="/scan" element={<Scan />} />
            <Route path="/t/:registration" element={<PublicShare />} />
          </Routes>
          <AppFooter />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
