import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Layers, RefreshCw } from "lucide-react";
import { useGetMockupsByProjectQuery } from "../../api/site-ops/site-ops.api";
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

const STATUS_OPTIONS = [
  "all",
  "PROPOSED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

export default function MockupsListPage() {
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("all");
  const [queryId, setQueryId] = useState(null);

  const {
    data: mockups = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetMockupsByProjectQuery(
    {
      projectId: queryId,
      status: status === "all" ? undefined : status,
    },
    { skip: !queryId },
  );

  const load = () => {
    const n = projectId;
    if (!n) return;
    setQueryId(n);
  };

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Mockups"
        description="Propose and review finish / material mockups on site."
        actions={
          <>
            {queryId && (
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
              <Link to="/site-ops/mockups/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Propose mockup
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
              type="text"
              className="bc-input w-[140px] h-10"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="bc-input w-[160px] h-10">
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
            Load mockups
          </Button>
        </div>
      </div>

      <div className="table-container bc-card">
        <div className="bc-table-scroll">
          <Table className="bc-table">
            <TableHeader>
              <TableRow className="bg-[var(--mist-soft)]">
                <TableHead>Name</TableHead>
                <TableHead>Finish / Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proposed by</TableHead>
                <TableHead className="actions">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!queryId ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="bc-empty-state">
                      <Layers className="h-10 w-10 mx-auto mb-3 text-[var(--sage)]" />
                      <p className="text-[var(--muted)]">
                        Enter a project ID to load mockups.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : mockups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    No mockups found.
                  </TableCell>
                </TableRow>
              ) : (
                mockups.map((m) => (
                  <TableRow
                    key={m.id}
                    className="hover:bg-[var(--mist-soft)]/60"
                  >
                    <TableCell className="font-medium text-[var(--ink-green)]">
                      {m.name}
                    </TableCell>
                    <TableCell>
                      {[m.finishType, m.location].filter(Boolean).join(" · ") ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell>{m.proposedBy}</TableCell>
                    <TableCell className="actions">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/site-ops/mockups/${m.id}`}>View</Link>
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
