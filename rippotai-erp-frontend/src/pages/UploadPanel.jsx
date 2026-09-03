import { useState, useCallback } from "react";
import {
  CloudUpload,
  Link2,
  Unlink,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderInput,
  FileUp,
  Terminal,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// -- connection status -------------------------------------------------
const STATUS = {
  UNKNOWN: "unknown",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};

function StatusBadge({ status }) {
  if (status === STATUS.CONNECTED) {
    return (
      <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Connected
      </Badge>
    );
  }
  if (status === STATUS.DISCONNECTED) {
    return (
      <Badge className="gap-1.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-100 border border-zinc-200">
        <XCircle className="h-3.5 w-3.5" />
        Not connected
      </Badge>
    );
  }
  return (
    <Badge className="gap-1.5 bg-zinc-50 text-zinc-400 hover:bg-zinc-50 border border-zinc-200">
      Unchecked
    </Badge>
  );
}

// -- request/response log ------------------------------------------------
function LogPanel({ entries, onClear }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
          <Terminal className="h-3.5 w-3.5" />
          request log
        </div>
        <button
          onClick={onClear}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Clear log"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto px-3 py-2 space-y-2.5 font-mono text-[12.5px] leading-relaxed">
        {entries.length === 0 && (
          <p className="text-zinc-600 py-4 text-center">
            Nothing yet — actions will show up here.
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id}>
            <div className="flex items-center gap-2">
              <span
                className={
                  e.ok === null
                    ? "text-amber-400"
                    : e.ok
                      ? "text-emerald-400"
                      : "text-red-400"
                }
              >
                {e.ok === null ? "…" : e.ok ? "200" : "ERR"}
              </span>
              <span className="text-zinc-300">{e.method}</span>
              <span className="text-zinc-500 truncate">{e.path}</span>
              <span className="text-zinc-700 ml-auto shrink-0">{e.time}</span>
            </div>
            {e.detail && (
              <pre className="mt-1 whitespace-pre-wrap break-all text-zinc-500 pl-6">
                {e.detail}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZohoWorkDriveTestPanel() {
  const [apiBase, setApiBase] = useState("http://localhost:5000/api/v1");
  const [ownerKey, setOwnerKey] = useState("test-user-1");
  const [parentId, setParentId] = useState("");
  const [file, setFile] = useState(null);

  const [status, setStatus] = useState(STATUS.UNKNOWN);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [log, setLog] = useState([]);

  const pushLog = useCallback((entry) => {
    const id = crypto.randomUUID();
    setLog((prev) =>
      [{ id, time: new Date().toLocaleTimeString(), ...entry }, ...prev].slice(
        0,
        30,
      ),
    );
    return id;
  }, []);

  const updateLog = useCallback((id, patch) => {
    setLog((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const checkStatus = useCallback(async () => {
    if (!ownerKey) return;
    setChecking(true);
    const id = pushLog({
      method: "GET",
      path: `/zoho/oauth/status/${ownerKey}`,
      ok: null,
    });
    try {
      const res = await fetch(`${apiBase}/zoho/oauth/status/${ownerKey}`);
      const data = await res.json();
      setStatus(data.connected ? STATUS.CONNECTED : STATUS.DISCONNECTED);
      updateLog(id, { ok: res.ok, detail: JSON.stringify(data) });
    } catch (err) {
      setStatus(STATUS.UNKNOWN);
      updateLog(id, { ok: false, detail: String(err) });
    } finally {
      setChecking(false);
    }
  }, [apiBase, ownerKey, pushLog, updateLog]);

  const connect = useCallback(() => {
    if (!ownerKey) return;
    pushLog({
      method: "GET",
      path: `/zoho/oauth/authorize?ownerKey=${ownerKey}`,
      ok: true,
      detail: "Opened in new tab — finish consent, then click Refresh.",
    });
    window.open(
      `${apiBase}/zoho/oauth/authorize?ownerKey=${encodeURIComponent(ownerKey)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [apiBase, ownerKey, pushLog]);

  const disconnect = useCallback(async () => {
    if (!ownerKey) return;
    const id = pushLog({
      method: "DELETE",
      path: `/zoho/oauth/${ownerKey}`,
      ok: null,
    });
    try {
      const res = await fetch(`${apiBase}/zoho/oauth/${ownerKey}`, {
        method: "DELETE",
      });
      const data = await res.json();
      updateLog(id, { ok: res.ok, detail: JSON.stringify(data) });
      setStatus(STATUS.DISCONNECTED);
    } catch (err) {
      updateLog(id, { ok: false, detail: String(err) });
    }
  }, [apiBase, ownerKey, pushLog, updateLog]);

  const handleUpload = useCallback(async () => {
    if (!file || !ownerKey || !parentId) return;
    setUploading(true);
    const id = pushLog({
      method: "POST",
      path: "/zoho/workdrive/upload",
      ok: null,
    });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("ownerKey", ownerKey);
      form.append("parentId", parentId);

      const res = await fetch(`${apiBase}/zoho/workdrive/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      updateLog(id, {
        ok: res.ok,
        detail: JSON.stringify(data, null, 2).slice(0, 800),
      });
    } catch (err) {
      updateLog(id, { ok: false, detail: String(err) });
    } finally {
      setUploading(false);
    }
  }, [apiBase, file, ownerKey, parentId, pushLog, updateLog]);

  const canUpload = Boolean(file && ownerKey && parentId) && !uploading;

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-semibold text-zinc-900">
                WorkDrive integration test
              </CardTitle>
              <CardDescription className="mt-1">
                Exercises your NestJS Zoho endpoints directly from the browser.
              </CardDescription>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* API base + owner key */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="apiBase" className="text-xs text-zinc-500">
                API base URL
              </Label>
              <Input
                id="apiBase"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerKey" className="text-xs text-zinc-500">
                Owner key
              </Label>
              <Input
                id="ownerKey"
                value={ownerKey}
                onChange={(e) => setOwnerKey(e.target.value)}
                placeholder="user_123"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* connection actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={connect} size="sm" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Connect
            </Button>
            <Button
              onClick={checkStatus}
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={checking}
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Refresh status
            </Button>
            <Button
              onClick={disconnect}
              size="sm"
              variant="ghost"
              className="gap-1.5 text-zinc-500"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
          </div>

          {status === STATUS.DISCONNECTED && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTitle className="text-amber-900 text-sm">
                Not connected yet
              </AlertTitle>
              <AlertDescription className="text-amber-800 text-sm">
                Click Connect, finish the Zoho consent screen in the new tab,
                then Refresh status.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              <FileUp className="h-4 w-4 text-zinc-400" />
              Upload a file
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parentId" className="text-xs text-zinc-500">
                WorkDrive folder ID (parentId)
              </Label>
              <div className="relative">
                <FolderInput className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="parentId"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  placeholder="0567s97d5252736c84d2981f138baeb237312"
                  className="pl-8 font-mono text-sm"
                />
              </div>
            </div>

            <label
              htmlFor="fileInput"
              className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-zinc-300 px-3 py-3 text-sm cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              <span className="text-zinc-500 truncate">
                {file ? file.name : "Choose a file to upload"}
              </span>
              <span className="text-zinc-400 text-xs shrink-0">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "browse"}
              </span>
              <input
                id="fileInput"
                type="file"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Button
              onClick={handleUpload}
              disabled={!canUpload}
              className="w-full gap-1.5"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload to WorkDrive"}
            </Button>
          </div>

          <Separator />

          <LogPanel entries={log} onClear={() => setLog([])} />
        </CardContent>
      </Card>
    </div>
  );
}
