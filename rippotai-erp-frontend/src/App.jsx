import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { UpgradeModalHost } from "@/lib/planGuards";
import { RootRedirect } from "@/lib/route.helpers";
import { generateRoutes } from "@/router/generate-routes";
import masterRoutes from "@/router";
import { CliqChatProvider } from "@/components/CliqChatWidget";

function App() {
  return (
    <AuthProvider>
      <CliqChatProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
          <UpgradeModalHost />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            {generateRoutes(masterRoutes)}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </CliqChatProvider>
    </AuthProvider>
  );
}

export default App;
