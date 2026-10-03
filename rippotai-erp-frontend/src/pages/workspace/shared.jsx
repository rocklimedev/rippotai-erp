// Small helpers shared by the workspace pages (Tasks, Calendar, Clients, Notes, Activity).
import React from "react";
import { useGetProjectsQuery } from "@/api/projects/project.api";
import { useGetUsersQuery } from "@/api/users/user.api";
import { useGetClientsQuery } from "@/api/projects/client.api";
import { SelectInput } from "@/components/inos";

export const asList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.rows) ? d.rows : []);

const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const fmtDate = (d, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-IN", opts) : "—";
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "");
export const inr = (n) =>
  n == null || n === "" ? "—" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function relTime(d) {
  if (!d) return "";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
}

/** Days from today to date (negative = past). */
export function daysFromToday(d) {
  if (!d) return null;
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(d);
  b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

export function useProjectsList() {
  const { data, isLoading } = useGetProjectsQuery({});
  return { projects: asList(data), isLoading };
}
export function useUsersList() {
  const { data, isLoading } = useGetUsersQuery({ is_active: true });
  return { users: asList(data), isLoading };
}
export function useClientsList() {
  const { data, isLoading } = useGetClientsQuery({});
  return { clients: asList(data), isLoading };
}

export function ProjectPicker({ value, onChange, placeholder = "No project", ...rest }) {
  const { projects } = useProjectsList();
  return (
    <SelectInput value={value || ""} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} {...rest}>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </SelectInput>
  );
}

export function UserPicker({ value, onChange, placeholder = "Unassigned", ...rest }) {
  const { users } = useUsersList();
  return (
    <SelectInput value={value || ""} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} {...rest}>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
          {u.job_title ? ` — ${u.job_title}` : ""}
        </option>
      ))}
    </SelectInput>
  );
}

export function ClientPicker({ value, onChange, placeholder = "No client", ...rest }) {
  const { clients } = useClientsList();
  return (
    <SelectInput value={value || ""} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} {...rest}>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </SelectInput>
  );
}

/** Small muted line of meta text. */
export const Meta = ({ children, style, ...rest }) => (
  <span {...rest} style={{ fontSize: "var(--fs-sm)", color: "var(--text-3)", ...style }}>{children}</span>
);

export const Loading = ({ label = "Loading…" }) => (
  <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: "var(--fs-sm)" }}>{label}</div>
);
