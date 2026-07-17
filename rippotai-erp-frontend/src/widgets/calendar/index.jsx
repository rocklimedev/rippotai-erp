import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase F: Calendar / Notes / Tasks / Documents widgets -------- */

export const CalendarTodayW = () => {
  const d = useEndpoint("/calendar/dashboard");
  return (
    <WidgetShell title="Today">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#333333] leading-none">
          {d?.today?.length ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">events today</div>
      </div>
    </WidgetShell>
  );
};

export const CalendarUpcomingW = () => {
  const nav = useNavigate();
  const d = useEndpoint("/calendar/dashboard");
  const rows = (d?.upcoming || []).slice(0, 5).map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: `${e.type.replace(/_/g, " ")} · ${e.project_name || "General"}`,
    right: (e.starts_at || "").slice(5, 10),
  }));
  return (
    <WidgetShell title="Upcoming Events">
      <RowList
        rows={rows}
        onClick={() => nav("/calendar/team")}
        empty="No events in the next 7 days"
      />
    </WidgetShell>
  );
};

export const NotesRecentW = () => {
  const nav = useNavigate();
  const d = useEndpoint("/notes-dashboard");
  const rows = (d?.recent || []).slice(0, 5).map((n) => ({
    id: n.id,
    title: n.title,
    subtitle: `${n.kind} · ${n.author}`,
    right: n.pinned ? "📌" : "",
  }));
  return (
    <WidgetShell title="Recent Notes">
      <RowList
        rows={rows}
        onClick={() => nav("/notes/all")}
        empty="No notes yet"
      />
    </WidgetShell>
  );
};

export const NotesPinnedW = () => {
  const d = useEndpoint("/notes-dashboard");
  return (
    <WidgetShell title="Pinned">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#333333] leading-none">
          {d?.pinned?.length ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">pinned notes</div>
      </div>
    </WidgetShell>
  );
};

export const TasksDueTodayW = () => {
  const d = useEndpoint("/tasks/dashboard");
  return (
    <WidgetShell title="Due Today">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#333333] leading-none">
          {d?.due_today ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">tasks due today</div>
      </div>
    </WidgetShell>
  );
};

export const TasksOverdueW = () => {
  const d = useEndpoint("/tasks/dashboard");
  return (
    <WidgetShell title="Overdue">
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#B04D26] leading-none">
          {d?.overdue ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">need attention</div>
      </div>
    </WidgetShell>
  );
};

export const TasksMineW = () => {
  const nav = useNavigate();
  const d = useEndpoint("/tasks/dashboard");
  const rows = (d?.mine || []).slice(0, 6).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: `${t.priority} · ${t.project_name || "General"}`,
    right: (t.due_date || "").slice(5, 10),
  }));
  return (
    <WidgetShell title="My Tasks">
      <RowList
        rows={rows}
        onClick={() => nav("/tasks/mine")}
        empty="No open tasks assigned to you"
      />
    </WidgetShell>
  );
};

export const DocumentsRecent = () => {
  const nav = useNavigate();
  const d = useEndpoint("/documents?limit=6");
  const rows = (d || []).slice(0, 6).map((x) => ({
    id: x.id,
    title: x.title || x.filename,
    subtitle: `${x.category || "—"} · ${x.uploaded_by_name || x.uploaded_by || "unknown"}`,
    right: (x.document_date || x.created_at || "").slice(5, 10),
  }));
  return (
    <WidgetShell title="Recent Documents">
      <RowList
        rows={rows}
        empty="No documents yet"
        onClick={() => nav("/documents/all")}
      />
    </WidgetShell>
  );
};

export const DocumentsPending = () => {
  const d = useEndpoint("/documents?status=pending&limit=100");
  const count = Array.isArray(d) ? d.length : 0;
  return (
    <WidgetShell title="Pending Uploads">
      <Stat value={count} />
    </WidgetShell>
  );
};
