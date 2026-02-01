import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Vaults from "./pages/Vaults";
import Documents from "./pages/Documents";
import NFTGallery from "./pages/NFTGallery";
import Profile from "./pages/Profile";
import AppLayout from "./layouts/AppLayout";

function App() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("spoovault-profile");
      if (stored) {
        const parsed = JSON.parse(stored) as { theme?: string };
        if (parsed.theme) {
          document.documentElement.setAttribute("data-theme", parsed.theme);
        }
      }
    } catch {
      // Ignore profile parse errors
    }
  }, []);

  return (
    <HeroUIProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vaults" element={<Vaults />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/nfts" element={<NFTGallery />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "bg-gray-900 text-white border border-gray-800",
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </Router>
    </HeroUIProvider>
  );
}

export default App;

