import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useDeleteQualityChecklistMutation } from "@/api/site-ops/site-ops.api";

export default function DeleteChecklist({ checklist, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [remove, { isLoading }] = useDeleteQualityChecklistMutation();
  const handleDelete = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      await remove(checklist.id).unwrap();
      toast.success("Checklist deleted.");
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to delete checklist.");
    }
  };
  return <>
    <Button variant="ghost" className="text-red-600" disabled={isLoading} onClick={() => setOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!isLoading) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete checklist?</AlertDialogTitle>
          <AlertDialogDescription>{checklist.checklist_name || "This checklist"} and its checkpoints will be removed from saved checklists.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isLoading ? "Deleting..." : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
