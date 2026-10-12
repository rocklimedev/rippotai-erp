import { useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button, Pill } from "@/components/inos";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useGetReminderStatusQuery, useSyncRemindersMutation } from "@/api/workspace/reminder-sync.api";
import ReminderSyncPanel from "./ReminderSyncPanel";

const STATES = {
  synced: { label: "Synced to Zoho", tone: "ok" },
  pending: { label: "Zoho sync pending", tone: "warn" },
  failed: { label: "Zoho sync failed", tone: "bad" },
  uncertain: { label: "Zoho sync needs review", tone: "warn" },
};

export function ZohoSyncBadge({ kind, entityId }) {
  const { user } = useAuth();
  const canRead = user?.permissions?.includes(kind === "tasks" ? "tasks:read" : "calendar-events:read");
  const { data } = useGetReminderStatusQuery(kind, { skip: !canRead, pollingInterval: 30000, refetchOnFocus: true });
  if (!data?.connected || !data?.settings?.enabled) return null;
  const record = data.records?.find(row => row.local_id === entityId);
  const state = STATES[record?.status];
  return state ? <span title={record.error || (record.synced_at ? `Last sync: ${new Date(record.synced_at).toLocaleString()}` : "Automatic sync runs every minute")}>
    <Pill tone={state.tone} size="sm">{state.label}</Pill>
  </span> : null;
}

export default function ZohoSyncControl({ kind, entityId }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const canRead = permissions.includes(kind === "tasks" ? "tasks:read" : "calendar-events:read");
  const canManage = permissions.includes(kind === "tasks" ? "tasks:update" : "calendar-events:update");
  const { data, isError, isLoading } = useGetReminderStatusQuery(kind, { skip: !canRead, pollingInterval: 30000, refetchOnFocus: true });
  const [sync, syncing] = useSyncRemindersMutation();
  if (!canRead) return null;
  const enabled = data?.connected && data?.settings?.enabled;
  const record = data?.records?.find(row => row.local_id === entityId);
  const attention = data?.failed || data?.uncertain || data?.settings?.last_error;
  const label = isLoading ? "Zoho sync" : isError ? "Zoho sync unavailable" : !data?.connected
    ? "Connect Zoho" : attention ? "Zoho sync needs attention" : enabled ? "Zoho sync active" : "Set up Zoho sync";
  return <>
    <Button icon={Link2} onClick={() => setOpen(true)} data-testid={`zoho-${kind}-sync`}>{label}</Button>
    {entityId && <ZohoSyncBadge kind={kind} entityId={entityId} />}
    {entityId && enabled && record && canManage && <Button size="sm" icon={RefreshCw} loading={syncing.isLoading}
      disabled={record.status === "uncertain"} onClick={async () => {
        try {
          const result = await sync({ kind, entity_id: entityId, force_full_sync: true }).unwrap();
          if (result.success) toast.success("Synced to Zoho");
          else toast.warning("Open Zoho sync to review this item");
        } catch (e) { toast.error(e?.data?.message || "Couldn't sync to Zoho"); }
      }}>Sync this item</Button>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kind === "tasks" ? "Connect Tasks to Zoho Projects" : "Connect Calendar to Zoho Calendar"}</DialogTitle>
          <DialogDescription>Manage work locally. Enabled connections send your changes to Zoho automatically every minute.</DialogDescription>
        </DialogHeader>
        {entityId && data && !record && <p>This item is outside your personal sync selection. Tasks must be assigned to you, or unassigned and created by you. Calendar events must be created by you.</p>}
        {open && <ReminderSyncPanel kind={kind} />}
      </DialogContent>
    </Dialog>
  </>;
}
