import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useDeleteRateComparisonMutation } from "@/api/procuerment/vendor-rate-comparison.api";

export default function DeleteRateComparison({ sheet, onDeleted, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [deleteSheet, { isLoading }] = useDeleteRateComparisonMutation();
  const handleDelete = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      await deleteSheet(sheet.id).unwrap();
      toast.success("Rate comparison sheet deleted.");
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to delete rate comparison sheet.");
    }
  };
  return <>
    <Button variant="ghost" className="text-red-600" disabled={disabled || isLoading} onClick={() => setOpen(true)}>
      <Trash2 className="mr-2 h-4 w-4" />Delete
    </Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!isLoading) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete rate comparison sheet?</AlertDialogTitle>
          <AlertDialogDescription>{sheet.title || "This sheet"} and its saved vendor rates will be permanently deleted. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isLoading ? "Deleting..." : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
