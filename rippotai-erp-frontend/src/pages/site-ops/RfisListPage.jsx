import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MessageSquareWarning, RefreshCw } from "lucide-react";
import { useGetRfisByProjectQuery } from "../../api/site-ops/site-ops.api";
import { PageHeader } from "@/components/site-ops/PageHeader";
import { StatusBadge } from "@/components/site-ops/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS = ["all", "OPEN", "ANSWERED", "CLOSED"];

export default function RfisListPage() {
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("all");
  const [queryProjectId, setQueryProjectId] = useState(null);

  const {
    data: rfis = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetRfisByProjectQuery(
    {
      projectId: queryProjectId,
      status: status === "all" ? undefined : status,
    },
    { skip: !queryProjectId },
  );

  const load = () => {
    const n = Number(projectId);
    if (!n || Number.isNaN(n)) return;
    setQueryProjectId(n);
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="RFIs"
        description="Request for Information — raise, route and close site queries."
        actions={
          <>
            {queryProjectId && (
              <Button
                variant="outline"
                size="sm"
                className="bc-btn-secondary"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
            <Button asChild className="bc-btn-primary">
              <Link to="/site-ops/rfis/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Raise RFI
              </Link>
            </Button>
          </>
        }
      />

      <div className="bc-card p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">Project ID</label>
            <Input
              className="bc-input w-[160px] h-10"
              type="number"
              placeholder="e.g. 12"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="bc-input w-[140px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="bc-btn-primary h-10" onClick={load}>
            Load RFIs
          </Button>
        </div>
      </div>

      <div className="table-container bc-card">
        <div className="bc-table-scroll">
          <Table className="bc-table">
            <TableHeader>
              <TableRow className="bg-[var(--mist-soft)]">
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Raised by</TableHead>
                <TableHead>Raised at</TableHead>
                <TableHead className="actions">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!queryProjectId ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="bc-empty-state">
                      <MessageSquareWarning className="h-10 w-10 mx-auto mb-3 text-[var(--sage)]" />
                      <p className="text-[var(--muted)]">
                        Enter a project ID and load RFIs.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rfis.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    No RFIs for this project.
                  </TableCell>
                </TableRow>
              ) : (
                rfis.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-[var(--mist-soft)]/60"
                  >
                    <TableCell className="font-medium text-[var(--ink-green)] max-w-[260px]">
                      <span className="line-clamp-2">{r.subject}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{r.raisedBy}</TableCell>
                    <TableCell className="nowrap">
                      {r.raisedAt
                        ? new Date(r.raisedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="actions">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/site-ops/rfis/${r.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
