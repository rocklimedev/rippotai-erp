import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext"; // adjust if your auth export differs
import { Toaster } from "sonner";
import { UpgradeModalHost } from "@/lib/planGuards";
import { RootRedirect } from "@/lib/route.helpers";
import { generateRoutes } from "@/router/generate-routes";
import masterRoutes from "@/router";

import { CliqChatProvider } from "./components/cliq/context";

/** Inner shell so we can read auth and pass currentCliqUserId */
function AppShell() {
  const { user } = useAuth(); // or however you expose the logged-in user
  // Prefer the Cliq-specific id if you store it; fall back to email / id
  const currentCliqUserId = user?.cliqUserId || user?.email || user?.id || null;

  return (
    <CliqChatProvider currentCliqUserId={currentCliqUserId}>
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
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
