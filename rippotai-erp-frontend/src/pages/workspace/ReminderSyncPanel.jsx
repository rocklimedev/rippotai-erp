import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@/components/inos";
import {
  useGetReminderStatusQuery,
  useSaveReminderSettingsMutation,
  useSyncRemindersMutation,
  useReconcileReminderMutation,
  useGetReminderCalendarsQuery,
} from "@/api/workspace/reminder-sync.api";
import { useLazyZohoAuthorizeUrlQuery } from "@/api/auth/authConnectors.api";

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
};
export default function ReminderSyncPanel({ kind }) {
  const { data, isLoading, isError, error, refetch } =
    useGetReminderStatusQuery(kind, {
      pollingInterval: 30000,
      refetchOnFocus: true,
    });
  const [draft, setDraft] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const calendars = useGetReminderCalendarsQuery(undefined, { skip: kind !== 'calendar' || !settingsOpen });
  const [remoteIds, setRemoteIds] = useState({});
  const [save, saving] = useSaveReminderSettingsMutation();
  const [sync, syncing] = useSyncRemindersMutation();
  const [reconcile, reconciling] = useReconcileReminderMutation();
  const [authorize, authorizing] = useLazyZohoAuthorizeUrlQuery();
  const busy = saving.isLoading || syncing.isLoading || reconciling.isLoading;
  const form = draft || { ...defaults, ...data?.settings };
  const fields =
    kind === "tasks"
      ? [
          ["portal_id", "Zoho portal ID"],
          ["project_id", "Zoho project ID"],
          ["tasklist_id", "Task list ID (optional)"],
          ["assignee_id", "Your Zoho Projects user ID"],
          ["task_reminder_time", "Reminder time on due date"],
        ]
      : [
          ["calendar_id", "Zoho calendar UID"],
          ["reminder_minutes", "Remind before event (minutes)"],
        ];
  const connect = async () => {
    try {
      const scopes =
        "ZohoProjects.tasks.ALL,ZohoProjects.portals.READ,ZohoProjects.projects.READ,ZohoCalendar.calendar.READ,ZohoCalendar.event.ALL";
      const response = await authorize(scopes).unwrap();
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
    for (const [key] of fields)
      body[key] =
        key === "reminder_minutes"
          ? Number(form[key])
          : String(form[key] || "").trim();
    try {
      await save({ kind, body }).unwrap();
      setDraft(null);
      toast.success("Reminder settings saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const run = async (retry_failed = false) => {
    try {
      const result = await sync({ kind, retry_failed }).unwrap();
      const message = `${result.created} created, ${result.updated} updated, ${result.deleted} removed, ${result.failed} failed, ${result.uncertain} need review`;
      if (result.success) toast.success(message);
      else toast.error(message);
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
          <strong>Zoho reminders</strong>
          <p style={{ margin: "6px 0" }}>
            Your local{" "}
            {kind === "tasks" ? "tasks with due dates" : "calendar events"}{" "}
            drive Zoho reminders.{" "}
            {data?.settings?.enabled
              ? "Automatic sync runs every minute."
              : "Automatic sync is paused."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            disabled={busy || isLoading || isError || Boolean(draft)}
            icon={RefreshCw}
            onClick={() => run()}
          >
            Sync now
          </Button>
          {data?.failed > 0 && (
            <Button disabled={busy || Boolean(draft)} onClick={() => run(true)}>
              Retry failed
            </Button>
          )}
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
      {data?.settings?.last_error && (
        <p role="alert">{data.settings.last_error}</p>
      )}
      <details onToggle={(event) => setSettingsOpen(event.currentTarget.open)}>
        <summary style={{ cursor: "pointer" }}>Reminder settings</summary>
        <p>
          {kind === "tasks"
            ? "Syncs tasks assigned to you, plus unassigned tasks you created. Enter your Zoho Projects user ID so Zoho sends reminders to you."
            : "Syncs calendar events you created. Task deadlines use task reminders."}
        </p>
        {kind === 'calendar' && <div>
          {calendars.isFetching && <p>Loading your Zoho calendars…</p>}
          {calendars.isError && <p role="alert">{errorMessage(calendars.error)}</p>}
          <Button disabled={calendars.isFetching} onClick={() => calendars.refetch()}>Refresh calendars</Button>
          {calendars.data && !calendars.data.length && <p>No personal calendars found. Create a calendar in Zoho, then refresh this list.</p>}
        </div>}
        <Button onClick={connect} disabled={busy || authorizing.isFetching}>
          Connect Zoho reminders
        </Button>
        <p>
          <Link to={kind === "tasks" ? "/tasks/zoho" : "/calendar/connected"}>
            Find your Zoho destination
          </Link>{" "}
          · <Link to="/settings/connectors">Manage connection</Link>
        </p>
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
              {key === 'calendar_id' ? <select className="inos-input" value={form.calendar_id} required
                disabled={busy || calendars.isFetching || !calendars.data?.length}
                onChange={(event) => setDraft({ ...form, calendar_id: event.target.value })}>
                <option value="">Select your Zoho calendar</option>
                {form.calendar_id && !calendars.data?.some((calendar) => calendar.uid === form.calendar_id) && <option value={form.calendar_id} disabled>Saved calendar unavailable — choose another</option>}
                {calendars.data?.map((calendar) => <option key={calendar.uid} value={calendar.uid}>{calendar.name}</option>)}
              </select> : <input
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
              />}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={form.enabled}
              disabled={busy || isLoading || isError}
              onChange={(e) => setDraft({ ...form, enabled: e.target.checked })}
            />{" "}
            Automatic reminders
          </label>
          <Button
            type="submit"
            variant="primary"
            disabled={busy || isLoading || isError || (kind === 'calendar' && !calendars.data?.some((calendar) => calendar.uid === form.calendar_id))}
          >
            Save settings
          </Button>
        </form>
        <p>
          Pausing stops future syncs; existing Zoho reminders remain active.
          Edit records here to update them in Zoho.
        </p>
      </details>
      {data?.errors?.length > 0 && (
        <details>
          <summary>Records needing attention ({data.errors.length})</summary>
          {data.errors.map((item) => (
            <div key={item.local_id} style={{ marginTop: 12 }}>
              <Link
                to={kind === "tasks" ? `/tasks/${item.local_id}` : "/calendar"}
              >
                {item.local_id}
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
                        "Reminder linked. Sync now to apply local data.",
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
