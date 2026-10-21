import { HardDrive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function NasConnector({ status }) {
  const { data, isFetching, isError, error, refetch } = status;
  const label = isFetching ? "Checking…" : isError ? "Status unavailable" : ({
    disabled: "Disabled", not_configured: "Configuration required",
    connected: "Connected", unavailable: "Unavailable",
  }[data?.status] || "Unchecked");
  const connected = data?.connected && !isFetching && !isError;

  return (
    <section aria-label="Synology NAS connector" className="rounded-2xl border border-[#E4EAE7] bg-white transition-colors hover:border-[#D3DEDA]">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF]">
            <HardDrive size={22} className="text-[#3F6D5F]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-[15px] font-medium text-[#22302D]">Synology NAS</h3>
              <span role="status" aria-live="polite" className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${connected ? "bg-[#EAF3EE] text-[#3F6D5F]" : "bg-[#F3F5F4] text-[#6B7B7C]"}`}>{label}</span>
            </div>
            <p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-[#6B7B7C]">
              Store large project files on your NAS, with temporary CDN storage while a transfer is waiting.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()} className="w-full shrink-0 sm:w-auto">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Checking status" : "Check connection"}
        </Button>
      </div>
      <Separator className="bg-[#EEF2F0]" />
      <div className="space-y-2 px-6 py-3.5 text-[13px] text-[#6B7B7C]">
        <p>Connection and storage settings are managed by your server administrator.</p>
        {!isError && !isFetching && data?.staging && <>
          <p>CDN staging: {data.staging.status.replaceAll("_", " ")}. Pending: {data.staging.pendingUploads ?? "Unknown"} uploads; {data.staging.pendingDeletes ?? "Unknown"} deletions.</p>
          <p>Transfers: {data.transfers?.enabled ? data.transfers.running ? "Running" : "Enabled" : "Disabled"}.
            {data.transfers?.lastResult === "retry_pending" && " Waiting for a retry."}</p>
        </>}
        {isError && <p role="alert">{error?.status === 403 ? "You need permission to view integration settings." : "Could not check NAS status. Try again shortly."}</p>}
        {!isError && data?.checkedAt && <p className="text-[12px] text-[#9AA6A3]">Last checked: {new Date(data.checkedAt).toLocaleString()}</p>}
      </div>
    </section>
  );
}
