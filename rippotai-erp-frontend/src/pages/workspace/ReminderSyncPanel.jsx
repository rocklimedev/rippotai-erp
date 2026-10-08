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

  const calendars = useGetReminderCalendarsQuery(undefined, {
    skip: kind !== "calendar",
    refetchOnMountOrArgChange: true,
  });
  const [remoteIds, setRemoteIds] = useState({});
  const [save, saving] = useSaveReminderSettingsMutation();
  const [reconcile, reconciling] = useReconcileReminderMutation();
  const [authorize, authorizing] = useLazyZohoAuthorizeUrlQuery();
  const busy = saving.isLoading || reconciling.isLoading;
  const form = draft || { ...defaults, ...data?.settings };
  const portals = useGetReminderPortalsQuery(undefined, {
    skip: kind !== "tasks",
    refetchOnMountOrArgChange: true,
  });
  const projects = useGetReminderProjectsQuery(form.portal_id, {
    skip: kind !== "tasks" || !form.portal_id,
    refetchOnMountOrArgChange: true,
  });
  const fields =
    kind === "tasks"
      ? [
          ["portal_id", "Zoho portal"],
          ["project_id", "Zoho project"],
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
            {kind === "tasks" ? "Task reminders" : "Calendar reminders"}
          </strong>
          <p style={{ margin: "6px 0" }}>
            Your local{" "}
            {kind === "tasks" ? "tasks with due dates" : "calendar events"}{" "}
            drive Zoho reminders.{" "}
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
      {data?.settings?.last_error && (
        <p role="alert">{data.settings.last_error}</p>
      )}
      <div>
        <p>
          {kind === "tasks"
            ? "Syncs tasks assigned to you, plus unassigned tasks you created. Enter your Zoho Projects user ID so Zoho sends reminders to you."
            : "Syncs calendar events you created. Task deadlines use task reminders."}
        </p>
        {(kind === "tasks" ? [portals, projects] : [calendars]).map(
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
          Connect Zoho reminders
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
                        ? { project_id: "", tasklist_id: "" }
                        : { tasklist_id: "" }),
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
            Automatic reminders
          </label>
          <Button
            type="submit"
            variant="primary"
            disabled={
              busy ||
              isLoading ||
              isError ||
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
      </div>
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
