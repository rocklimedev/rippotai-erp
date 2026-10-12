import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Card } from "@/components/inos";
import {
  useGetReminderStatusQuery,
  useSaveReminderSettingsMutation,
  useGetReminderPortalsQuery,
  useGetReminderProjectsQuery,
  useReconcileReminderMutation,
  useGetReminderCalendarsQuery,
  useGetReminderUsersQuery,
  useLazyReminderAuthorizeQuery,
  useSyncRemindersMutation,
} from "@/api/workspace/reminder-sync.api";
import { useAuth } from "@/context/AuthContext";

const errorMessage = (e) =>
  String(e?.data?.message || e?.error || "Could not update Zoho reminders");
const defaults = {
  enabled: false,
  portal_id: "",
  project_id: "",
  tasklist_id: "",
  assignee_id: "",
  calendar_id: "",
  timezone: "Asia/Kolkata",
  task_reminder_time: "09:00",
  reminder_minutes: 30,
  include_undated_tasks: true,
};
export default function ReminderSyncPanel({ kind }) {
  const { user } = useAuth();
  const canManage = user?.permissions?.includes(kind === "tasks" ? "tasks:update" : "calendar-events:update");
  const { data, isLoading, isError, error, refetch } =
    useGetReminderStatusQuery(kind, {
      pollingInterval: 30000,
      refetchOnFocus: true,
    });
  const [draft, setDraft] = useState(null);

  const calendars = useGetReminderCalendarsQuery(undefined, {
    skip: kind !== "calendar" || !data?.connected,
    refetchOnMountOrArgChange: true,
  });
  const [remoteIds, setRemoteIds] = useState({});
  const [save, saving] = useSaveReminderSettingsMutation();
  const [reconcile, reconciling] = useReconcileReminderMutation();
  const [authorize, authorizing] = useLazyReminderAuthorizeQuery();
  const [sync, syncing] = useSyncRemindersMutation();
  const busy = saving.isLoading || reconciling.isLoading || syncing.isLoading || !canManage;
  const form = draft || { ...defaults, ...data?.settings };
  const portals = useGetReminderPortalsQuery(undefined, {
    skip: kind !== "tasks" || !data?.connected,
    refetchOnMountOrArgChange: true,
  });
  const projects = useGetReminderProjectsQuery(form.portal_id, {
    skip: kind !== "tasks" || !form.portal_id || !data?.connected,
    refetchOnMountOrArgChange: true,
  });
  const zohoUsers = useGetReminderUsersQuery({ portalId: form.portal_id, projectId: form.project_id }, {
    skip: kind !== "tasks" || !form.portal_id || !form.project_id || !data?.connected,
    refetchOnMountOrArgChange: true,
  });
  const fields =
    kind === "tasks"
      ? [
          ["portal_id", "Zoho portal"],
          ["project_id", "Zoho project"],
          ["tasklist_id", "Task list ID (optional)"],
          ["assignee_id", "Your Zoho user in this project"],
          ["task_reminder_time", "Reminder time on due date"],
        ]
      : [
          ["calendar_id", "Zoho calendar UID"],
          ["reminder_minutes", "Remind before event (minutes)"],
        ];
  const connect = async () => {
    try {
      const response = await authorize(kind).unwrap();
      if (!response?.authorizationUrl)
        throw new Error("Zoho authorization URL was not returned");
      const link = document.createElement("a");
      link.href = response.authorizationUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    const body = { enabled: form.enabled, timezone: form.timezone };
    if (kind === "tasks") body.include_undated_tasks = Boolean(form.include_undated_tasks);
    for (const [key] of fields)
      body[key] =
        key === "reminder_minutes"
          ? Number(form[key])
          : String(form[key] || "").trim();
    try {
      await save({ kind, body }).unwrap();
      setDraft(null);
      toast.success("Zoho sync settings saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Card>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <strong>
            {kind === "tasks" ? "Tasks → Zoho Projects" : "Calendar → Zoho Calendar"}
          </strong>
          <p style={{ margin: "6px 0" }}>
            Your local{" "}
            {kind === "tasks" ? "tasks" : "calendar events"}{" "}
            are the source for Zoho.{" "}
            {data?.settings?.enabled
              ? "Automatic sync runs every minute."
              : "Automatic sync is paused."}
          </p>
        </div>
      </div>
      {isLoading && <p>Loading reminder status…</p>}
      {isError && (
        <p role="alert">
          {errorMessage(error)} <Button onClick={refetch}>Retry</Button>
        </p>
      )}
      {data && (
        <p role="status">
          {data.synced} mirrored · {data.pending} pending · {data.failed} failed
          · {data.uncertain} need review · Last run:{" "}
          {data.last_sync ? new Date(data.last_sync).toLocaleString() : "Never"}
        </p>
      )}
      <p>{data?.connected ? "Zoho account connected." : "Connect your Zoho account to choose a destination."}{" "}
        <Button variant="ghost" size="sm" onClick={() => {
          refetch();
          if (!portals.isUninitialized) portals.refetch();
          if (!projects.isUninitialized) projects.refetch();
          if (!calendars.isUninitialized) calendars.refetch();
          if (!zohoUsers.isUninitialized) zohoUsers.refetch();
        }}>Refresh connection</Button>
      </p>
      {!canManage && <p>You need permission to update {kind === "tasks" ? "tasks" : "calendar events"} to manage your Zoho sync.</p>}
      {data?.settings?.last_error && (
        <p role="alert">{data.settings.last_error}</p>
      )}
      <div>
        <p>
          {kind === "tasks"
            ? "Syncs tasks assigned to you, plus unassigned tasks you created. Choose your own Zoho user to receive task reminders."
            : "Syncs calendar events you created. Task deadlines use task reminders."}
        </p>
        {(kind === "tasks" ? [portals, projects, zohoUsers] : [calendars]).map(
          (query, index) =>
            query.isError && (
              <p key={index} role="alert">
                {errorMessage(query.error)}{" "}
                <Button onClick={query.refetch}>
                  Retry loading destinations
                </Button>
              </p>
            ),
        )}
        {(kind === "tasks"
          ? portals.isFetching || projects.isFetching
          : calendars.isFetching) && <p>Loading Zoho destinations...</p>}
        {kind === "tasks" && portals.currentData?.length === 0 && (
          <p>No Zoho portals found in this account.</p>
        )}
        {kind === "tasks" &&
          form.portal_id &&
          projects.currentData?.length === 0 && (
            <p>No projects found in this portal.</p>
          )}
        {kind === "calendar" && calendars.data?.length === 0 && (
          <p>No personal calendars found in this account.</p>
        )}
        <Button onClick={connect} disabled={busy || authorizing.isFetching}>
          {data?.connected ? "Reconnect Zoho permissions" : "Connect Zoho"}
        </Button>
        <form
          onSubmit={submit}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "end",
          }}
        >
          {[...fields, ["timezone", "Timezone"]].map(([key, label]) => (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              {label}
              {key === "portal_id" || key === "project_id" ? (
                <select
                  className="inos-input"
                  value={form[key]}
                  required={form.enabled}
                  disabled={
                    busy ||
                    isLoading ||
                    isError ||
                    (key === "portal_id"
                      ? portals.isFetching
                      : projects.isFetching || !form.portal_id)
                  }
                  onChange={(event) =>
                    setDraft({
                      ...form,
                      [key]: event.target.value,
                      ...(key === "portal_id"
                        ? { project_id: "", tasklist_id: "", assignee_id: "" }
                        : { tasklist_id: "", assignee_id: "" }),
                    })
                  }
                >
                  <option value="">
                    {key === "portal_id"
                      ? "Select your Zoho portal"
                      : "Select your Zoho project"}
                  </option>
                  {form[key] &&
                    !(
                      key === "portal_id"
                        ? portals.currentData
                        : projects.currentData
                    )?.some((item) => item.id === form[key]) && (
                      <option value={form[key]}>
                        Saved destination ({form[key]})
                      </option>
                    )}
                  {(key === "portal_id"
                    ? portals.currentData
                    : projects.currentData
                  )?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : key === "assignee_id" ? (
                <select className="inos-input" value={form.assignee_id} required={form.enabled}
                  disabled={busy || !form.project_id || zohoUsers.isFetching || !data?.connected}
                  onChange={(e) => setDraft({ ...form, assignee_id: e.target.value })}>
                  <option value="">Select your Zoho user</option>
                  {form.assignee_id && !zohoUsers.currentData?.some(item => item.id === form.assignee_id) &&
                    <option value={form.assignee_id}>Saved user ({form.assignee_id})</option>}
                  {zohoUsers.currentData?.map(item => <option key={item.id} value={item.id}>{item.name}{item.email ? ` · ${item.email}` : ""}</option>)}
                </select>
              ) : key === "calendar_id" ? (
                <select
                  className="inos-input"
                  value={form.calendar_id}
                  required={form.enabled}
                  disabled={
                    busy || calendars.isFetching || !calendars.data?.length
                  }
                  onChange={(event) =>
                    setDraft({ ...form, calendar_id: event.target.value })
                  }
                >
                  <option value="">Select your Zoho calendar</option>
                  {form.calendar_id &&
                    !calendars.data?.some(
                      (calendar) => calendar.uid === form.calendar_id,
                    ) && (
                      <option value={form.calendar_id} disabled>
                        Saved calendar unavailable — choose another
                      </option>
                    )}
                  {calendars.data?.map((calendar) => (
                    <option key={calendar.uid} value={calendar.uid}>
                      {calendar.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="inos-input"
                  type={
                    key === "reminder_minutes"
                      ? "number"
                      : key === "task_reminder_time"
                        ? "time"
                        : "text"
                  }
                  min={key === "reminder_minutes" ? 0 : undefined}
                  max={key === "reminder_minutes" ? 10080 : undefined}
                  value={form[key]}
                  disabled={busy || isLoading || isError}
                  required={form.enabled && key !== "tasklist_id"}
                  onChange={(e) => setDraft({ ...form, [key]: e.target.value })}
                />
              )}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={form.enabled}
              disabled={busy || isLoading || isError}
              onChange={(e) => setDraft({ ...form, enabled: e.target.checked })}
            />{" "}
            Automatic sync
          </label>
          {kind === "tasks" && <label>
            <input type="checkbox" checked={Boolean(form.include_undated_tasks)} disabled={busy || isLoading || isError}
              onChange={(e) => setDraft({ ...form, include_undated_tasks: e.target.checked })} />{" "}
            Include tasks without a due date
          </label>}
          <Button
            type="submit"
            variant="primary"
            disabled={
              busy ||
              isLoading ||
              isError ||
              (form.enabled && !data?.connected) ||
              (form.enabled &&
                kind === "calendar" &&
                !calendars.data?.some(
                  (calendar) => calendar.uid === form.calendar_id,
                ))
            }
          >
            Save settings
          </Button>
        </form>
        <p>
          Pausing stops future syncs; existing Zoho reminders remain active.
          Changes to your tasks and events sync automatically.
        </p>
        <Button disabled={busy || !data?.connected || !data?.settings?.enabled || !!draft} onClick={async () => {
          try {
            const result = await sync({ kind }).unwrap();
            if (result.success) toast.success(`Synced: ${result.created} created, ${result.updated} updated, ${result.deleted} removed`);
            else toast.warning(`Sync needs attention: ${result.failed} failed, ${result.uncertain} need review`);
          } catch (e) { toast.error(errorMessage(e)); }
        }}>Sync now</Button>{" "}
        <Button disabled={busy || !data?.connected || !data?.failed || !!draft} onClick={async () => {
          try {
            const result = await sync({ kind, retry_failed: true }).unwrap();
            if (result.success) toast.success("Failed records retried");
            else toast.warning("Some records still need attention");
          } catch (e) { toast.error(errorMessage(e)); }
        }}>Retry failed</Button>
        {!!draft && <p>Save your settings before syncing.</p>}
      </div>
      {data?.errors?.length > 0 && (
        <details>
          <summary>Records needing attention ({data.errors.length})</summary>
          {data.errors.map((item) => (
            <div key={item.local_id} style={{ marginTop: 12 }}>
              <Link
                to={kind === "tasks" ? `/tasks/${item.local_id}` : "/calendar"}
              >
                {item.title || item.local_id}
              </Link>
              : {item.message}
              {item.status === "uncertain" && (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    try {
                      await reconcile({
                        kind,
                        local_id: item.local_id,
                        remote_id: remoteIds[item.local_id],
                      }).unwrap();
                      toast.success(
                        "Reminder linked. Changes will sync automatically.",
                      );
                    } catch (e) {
                      toast.error(errorMessage(e));
                    }
                  }}
                >
                  <p>
                    Creation may have reached Zoho. Find that reminder in Zoho
                    and paste its ID to prevent a duplicate.
                  </p>
                  <input
                    aria-label="Existing Zoho reminder ID"
                    required
                    value={remoteIds[item.local_id] || ""}
                    onChange={(e) =>
                      setRemoteIds({
                        ...remoteIds,
                        [item.local_id]: e.target.value,
                      })
                    }
                  />{" "}
                  <Button type="submit" disabled={busy}>
                    Link existing reminder
                  </Button>
                </form>
              )}
            </div>
          ))}
        </details>
      )}
    </Card>
  );
}
