import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useDeleteDailySiteReportMutation } from "@/api/procuerment/site-ops.api";

export default function DeleteDailyReport({ report, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [remove, { isLoading }] = useDeleteDailySiteReportMutation();
  const handleDelete = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      await remove(report.id).unwrap();
      toast.success("Daily site report deleted.");
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to delete daily site report.");
    }
  };
  return <span onClick={(event) => event.stopPropagation()}>
    <Button variant="ghost" size="sm" className="text-red-600" disabled={isLoading} onClick={() => setOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!isLoading) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete daily site report?</AlertDialogTitle>
          <AlertDialogDescription>The report for {report.reportDate} and its manpower entries will be permanently deleted. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isLoading ? "Deleting..." : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </span>;
}
