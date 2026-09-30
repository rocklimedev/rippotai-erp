import { useState } from "react";
import {
  useGetQualityItemsQuery,
  useGetProjectQualityChecksQuery,
  useUpsertQualityCheckMutation,
} from "../../api/site-ops/site-ops.api";
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
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const CHECK_STATUSES = ["Pending", "Passed", "Failed", "N/A"];

export default function QualityChecksPage() {
  const [projectId, setProjectId] = useState("");
  const [activeProjectId, setActiveProjectId] = useState(null);

  const { data: items = [] } = useGetQualityItemsQuery();
  const {
    data: checks = [],
    isLoading,
    refetch,
  } = useGetProjectQualityChecksQuery(
    { project_id: activeProjectId },
    { skip: !activeProjectId },
  );
  const [upsert, { isLoading: saving }] = useUpsertQualityCheckMutation();

  const checkMap = new Map(
    (Array.isArray(checks) ? checks : []).map((c) => [c.item_id, c]),
  );

  const handleStatus = async (itemId, status) => {
    if (!activeProjectId) return;
    try {
      await upsert({
        project_id: activeProjectId,
        item_id: itemId,
        status,
      }).unwrap();
      toast.success("Check updated");
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "Update failed");
    }
  };

  const load = () => {
    if (!projectId.trim()) return;
    setActiveProjectId(projectId.trim());
  };

  const list = Array.isArray(items) ? items : [];

  return (
    <div className="bg-page min-h-full p-6">
      <PageHeader
        title="Quality Checks"
        description="Per-project pass/fail against the master quality check heads."
      />

      <div className="bc-card p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted)]">
              Project ID (UUID)
            </label>
            <Input
              className="bc-input w-[280px] h-10"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Project UUID"
            />
          </div>
          <Button className="bc-btn-primary h-10" onClick={load}>
            Load checklist
          </Button>
        </div>
      </div>

      <div className="table-container bc-card">
        <div className="bc-table-scroll">
          <Table className="bc-table">
            <TableHeader>
              <TableRow className="bg-[var(--mist-soft)]">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Check item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="actions">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!activeProjectId ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="bc-empty-state">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-[var(--sage)]" />
                      <p className="text-[var(--muted)]">
                        Enter a project UUID to load quality checks.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-[var(--muted)]"
                  >
                    No quality check heads configured.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item) => {
                  const check = checkMap.get(item.id);
                  const current = check?.status || "Pending";
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-[var(--muted)]">
                        {item.sort_order}
                      </TableCell>
                      <TableCell className="font-medium text-[var(--ink-green)]">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={current} />
                      </TableCell>
                      <TableCell className="actions">
                        <Select
                          value={current}
                          onValueChange={(v) => handleStatus(item.id, v)}
                          disabled={saving}
                        >
                          <SelectTrigger className="bc-input h-9 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHECK_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
