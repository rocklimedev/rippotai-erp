import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SignUp from "@/pages/SignUp";
import LandingPage from "@/pages/LandingPage";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ComingSoon from "@/pages/ComingSoon";
import BoqDashboard from "@/pages/boq/BoqDashboard";
import BoqWorkspace from "@/pages/boq/BoqWorkspace";
import BoqNew from "@/pages/boq/BoqNew";
import BoqVersions from "@/pages/boq/BoqVersions";
import BoqPreview from "@/pages/boq/BoqPreview";
import VendorsDashboard from "@/pages/vendors/VendorsDashboard";
import VendorNew from "@/pages/vendors/VendorNew";
import VendorProfile from "@/pages/vendors/VendorProfile";
import ShortlistsIndex from "@/pages/vendors/ShortlistsIndex";
import ShortlistDetail from "@/pages/vendors/ShortlistDetail";
import QuotationsDashboard from "@/pages/quotations/QuotationsDashboard";
import QuotationNew from "@/pages/quotations/QuotationNew";
import QuotationUpload from "@/pages/quotations/QuotationUpload";
import QuotationDetail from "@/pages/quotations/QuotationDetail";
import QuotationCompare from "@/pages/quotations/QuotationCompare";

import ProjectsDashboard from "@/pages/projects/ProjectsDashboard";
import ProjectNew from "@/pages/projects/ProjectNew";
import ProjectWorkspace from "@/pages/projects/ProjectWorkspace";
import ProjectHandover from "@/pages/projects/ProjectHandover";
import ClientPortalRoutes from "@/pages/client/ClientPortal";
import ClientHome from "@/pages/client/ClientHome";
import { allSlugsFor } from "@/config/appNav";
import AppDashboard from "@/components/dashboard/AppDashboard";
import SectionPage from "@/pages/SectionPage";

import { DrawingUpload } from "./pages/documents/DocumentsRoutes";
import { DrawingsAll } from "./pages/documents/DocumentsRoutes";
import { SiteRekiView } from "./pages/documents/SiteRekiView";
import { BriefForm } from "./pages/documents/BriefForm";
import { SiteRekiForm } from "./pages/documents/SiteRekiForm";
import { ProjectDocuments } from "./pages/documents/ProjectDocument";
import { DocumentsAll } from "./pages/documents/DocumentsAll";
import { DocumentUpload } from "./pages/documents/DocumentUpload";
import DocumentsDashboard from "@/pages/documents/DocumentsDashboard";
import CalendarPage from "@/pages/phasef/CalendarPage";
import TasksBoard from "@/pages/phasef/TasksBoard";
import { TasksAll } from "./pages/phasef/Tasks";
import { CalendarMine } from "./pages/phasef/Calendar";
import { CalendarTeam } from "./pages/phasef/Calendar";
import { NotesAll } from "./pages/phasef/Notes";
import { NoteNew } from "./pages/phasef/Notes";
import { TasksMine } from "./pages/phasef/Tasks";
import { TaskNew } from "./pages/phasef/Tasks";
import RolesPermissions from "@/pages/settings/RolesPermissions";
import SuperAdmin from "@/pages/settings/SuperAdmin";
import { UpgradeModalHost } from "@/lib/planGuards";
import EstimateSignature from "@/pages/settings/EstimateSignature";
import BoqTemplatesList from "./pages/boq/BoqTemplatesList";
import BoqLibraryPage from "./pages/boq/BoqLibraryPage";
import BoqActivityPage from "./pages/boq/BoqActivitypage";
import BoqTemplateNew from "./pages/boq/BoqTemplateNew";
import BoqTemplateEditor from "./pages/boq/BoqTemplateEditor";
import AccountSettings from "./pages/settings/AccountSettings";
import SettingsLayout from "./layouts/SettingsLayout";
import LeadsPage from "./pages/leads/LeadsPage";
import NewLeadPage from "./components/leads/NewLeadPage";
import ContactsView from "./components/leads/ContactsView";
import ReviewView from "./components/leads/ReviewView";
import BoardView from "./components/leads/BoardView";
import LeadsActivity from "./pages/leads/LeadsActivity";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import NotificationSettings from "@/pages/settings/NotificationSettings";
import BillingSettings from "@/pages/settings/BillingSettings";
import UsersSettings from "@/pages/settings/UserSettings";
import ProjectActivity from "./pages/projects/ProjectActivity";
import QuotationsActivity from "./pages/quotations/QuotationActivity";
import VendorActivity from "./pages/vendors/VendorActivity";
import DocumentActivity from "./pages/documents/DocumentActivity";
import TaskActivity from "./pages/phasef/TaskActivity";
import CalendarActivity from "./pages/phasef/CalendarActivity";
import ProjectBriefList from "./pages/documents/ProjectBriefList";
import SiteRecceList from "./pages/documents/SiteRecceList";
import DrawingsView from "./pages/documents/DrawingsView";
import { ProjectBriefView } from "./pages/documents/ProjectBriefView";
function Protected({ children, blockRoles }) {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-sm" style={{ color: "#6B7B7C" }}>
          Loading INOS…
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (blockRoles && blockRoles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return children;
}
function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
function RootRedirect() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}
// Any menu slug we haven't specialised opens a real functional SectionPage (not ComingSoon)
function sectionRoutes(appKey, realSlugs = []) {
  const set = new Set([...realSlugs, "edit-dashboard"]);
  return allSlugsFor(appKey)
    .filter((it) => it.slug && !it.slug.startsWith("/") && !set.has(it.slug))
    .map((it) => (
      <Route
        key={it.slug}
        path={it.slug}
        element={<SectionPage appKey={appKey} slugOverride={it.slug} />}
      />
    ));
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <UpgradeModalHost />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <SignUp />
              </PublicOnly>
            }
          />

          <Route path="/" element={<RootRedirect />} />
          {/* App Dashboard (protected) */}
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />

          {/* BOQ App */}
          <Route
            path="/boq"
            element={
              <Protected>
                <AppLayout app="boq" />
              </Protected>
            }
          >
            <Route index element={<AppDashboard appKey="boq" />} />
            <Route path="all" element={<BoqDashboard />} />
            <Route path="new" element={<BoqNew />} />
            <Route path="templates" element={<BoqTemplatesList />} />

            <Route path="/boq/template/new" element={<BoqTemplateNew />} />
            <Route
              path="/boq/template/:id/editor"
              element={<BoqTemplateEditor />}
            />
            <Route path="rate-and-item-library" element={<BoqLibraryPage />} />
            <Route path="activity" element={<BoqActivityPage />} />
            {sectionRoutes("boq", [
              "new",
              "all",
              "templates",
              "rate-and-item-library",
              "activity",
            ])}
            <Route path=":id/versions" element={<BoqVersions />} />
          </Route>
          <Route
            path="/boq/:id"
            element={
              <Protected>
                <BoqWorkspace />
              </Protected>
            }
          />
          <Route
            path="/boq/:id/preview"
            element={
              <Protected>
                <BoqPreview />
              </Protected>
            }
          />
          {/* Leads App */}
          <Route
            path="/leads"
            element={
              <Protected>
                <AppLayout app="leads" />
              </Protected>
            }
          >
            <Route index element={<AppDashboard appKey="leads" />} />
            <Route path="new" element={<NewLeadPage />} />
            <Route path="sources" element={<ContactsView />} />
            <Route path="activity" element={<LeadsActivity />} />
            <Route path="pipeline" element={<BoardView />} />
            {sectionRoutes("leads", [])}
          </Route>
          {/* Vendors App */}
          <Route
            path="/vendors"
            element={
              <Protected blockRoles={["client"]}>
                <AppLayout app="vendors" />
              </Protected>
            }
          >
            <Route index element={<AppDashboard appKey="vendors" />} />
            <Route path="directory" element={<VendorsDashboard />} />
            <Route path="new" element={<VendorNew />} />
            <Route path="shortlists" element={<ShortlistsIndex />} />
            <Route path="shortlists/:id" element={<ShortlistDetail />} />
            <Route path="activity" element={<VendorActivity />} />
            {sectionRoutes("vendors", ["new", "shortlists", "directory"])}
            <Route path=":id/edit" element={<VendorNew/>}/>
            <Route path=":id" element={<VendorProfile />} />
          </Route>

          {/* Quotations App */}
          <Route
            path="/quotations"
            element={
              <Protected blockRoles={["client"]}>
                <AppLayout app="quotations" />
              </Protected>
            }
          >
            <Route index element={<AppDashboard appKey="quotations" />} />
            <Route path="all" element={<QuotationsDashboard />} />
            <Route path="new" element={<QuotationNew />} />
            <Route path=":id/edit" element={<QuotationNew/>}/>
            <Route path="upload" element={<QuotationUpload />} />
            <Route path="activity" element={<QuotationsActivity />} />
            <Route path="compare" element={<QuotationCompare />} />
            {sectionRoutes("quotations", ["new", "upload", "compare", "all"])}
            <Route path=":id" element={<QuotationDetail />} />
          </Route>

          {/* Projects App */}
          <Route
            path="/projects"
            element={
              <Protected blockRoles={["client"]}>
                <AppLayout app="projects" />
              </Protected>
            }
          >
            <Route index element={<AppDashboard appKey="projects" />} />
            <Route path="all" element={<ProjectsDashboard />} />
            <Route path="activity" element={<ProjectActivity />} />
            <Route path="new" element={<ProjectNew />} />
            {sectionRoutes("projects", ["new", "all"])}
            <Route path=":id/handover" element={<ProjectHandover />} />
            <Route path=":id/edit" element={<ProjectNew/>}/>
            <Route path=":id" element={<ProjectWorkspace />} />
          </Route>

          {/* Documents / Tasks / Calendar */}
          <Route
            path="/documents"
            element={
              <Protected>
                <AppLayout app="documents" />
              </Protected>
            }
          >
            <Route index element={<DocumentsDashboard />} />
            <Route path="all" element={<DocumentsAll />} />
            <Route path="upload" element={<DocumentUpload />} />
            <Route path="project-documents" element={<ProjectDocuments />} />
            <Route path="brief/all" element={<ProjectBriefList/>}/>
            <Route path="recce/all" element={<SiteRecceList/>}/>
            <Route path="activity" element={<DocumentActivity />} />
            <Route path="forms/project-brief" element={<BriefForm />} />
            <Route path="forms/site-reki" element={<SiteRekiForm />} />
            <Route path="site-recce/:id" element={<SiteRekiView />} />
            <Route path="brief/:id" element={<ProjectBriefView/>}/>
            <Route path="drawings" element={<DrawingsAll />} />
            <Route path="drawings/:id" element={<DrawingsView/>}/>
            <Route path="drawings/upload" element={<DrawingUpload />} />
            {sectionRoutes("documents", [
              "all",
              "upload",
              "project-documents",
              "forms/project-brief",
              "forms/site-reki",
              "drawings",
              "drawings/upload",
            ])}
          </Route>

          {/* Calendar / Tasks (Phase F) */}
          <Route
            path="/calendar"
            element={
              <Protected>
                <AppLayout app="calendar" />
              </Protected>
            }
          >
            <Route index element={<CalendarPage />} />
            <Route path="mine" element={<CalendarMine />} />
            <Route path="activity" element={<CalendarActivity />} />
            <Route path="team" element={<CalendarTeam />} />
            {sectionRoutes("calendar", ["mine", "team"])}
          </Route>
          <Route
            path="/tasks"
            element={
              <Protected>
                <AppLayout app="tasks" />
              </Protected>
            }
          >
            <Route index element={<TasksBoard />} />
            <Route path="mine" element={<TasksMine />} />
            <Route path="activity" element={<TaskActivity />} />
            <Route path="all" element={<TasksAll />} />
            <Route path="new" element={<TaskNew />} />
            {sectionRoutes("tasks", ["mine", "all", "new"])}
          </Route>

          {/* Redirect removed / obsolete apps → landing */}
          <Route
            path="/inventory/*"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/chats/*"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/clients/*"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/notes/*"
            element={<Navigate to="/dashboard" replace />}
          />
          {/* Estimate = Quotation (UI rename only; API + routes preserved for data safety) */}
          <Route
            path="/estimates"
            element={<Navigate to="/quotations" replace />}
          />
          <Route
            path="/estimates/*"
            element={<Navigate to="/quotations" replace />}
          />
          <Route
            path="/activity/*"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Settings App - Uses Same Top Header/Navbar */}

          <Route
            path="/settings"
            element={
              <Protected>
                <SettingsLayout />
              </Protected>
            }
          >
            <Route index element={<ProfileSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="billing" element={<BillingSettings />} />
            <Route path="estimate-signature" element={<EstimateSignature />} />
            <Route path="users" element={<UsersSettings />} />
            <Route path="roles-permissions" element={<RolesPermissions />} />
            <Route path="super-admin" element={<SuperAdmin />} />
          </Route>

          <Route path="/client/*" element={<ClientPortalRoutes />} />
          <Route
            path="/client-home"
            element={
              <Protected>
                <ClientHome />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
