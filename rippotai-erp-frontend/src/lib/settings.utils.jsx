export const ROLES = [
  "admin",
  "project_manager",
  "architect",
  "estimator",
  "site_supervisor",
  "client",
  "member",
];

export const ROLE_LABEL = {
  admin: "Admin",
  project_manager: "Project Manager",
  architect: "Architect",
  estimator: "Estimator",
  site_supervisor: "Site Supervisor",
  client: "Client",
  member: "Member",
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export const fmtDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// Small reusable "you don't have access" block used by several tabs
export function AccessDenied({
  title = "Access denied",
  message = "You need admin privileges.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
        <span style={{ color: "#7A2E1A" }}>⚠</span>
      </div>
      <div className="text-xl font-semibold mb-2">{title}</div>
      <p className="text-[#6B7B7C]">{message}</p>
    </div>
  );
}
