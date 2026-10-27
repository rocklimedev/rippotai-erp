import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useDeleteMaterialProcurementMutation } from "@/api/procuerment/material-procurement.api";

export default function DeleteMaterialProcurement({ procurement, onDeleted, iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const [deleteProcurement, { isLoading }] = useDeleteMaterialProcurementMutation();
  const handleDelete = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      await deleteProcurement(procurement.id).unwrap();
      toast.success("Material procurement deleted.");
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to delete material procurement.");
    }
  };
  return <>
    <Button variant={iconOnly ? "ghost" : "destructive"} size={iconOnly ? "icon" : "default"} title="Delete material procurement" aria-label="Delete material procurement" disabled={isLoading} onClick={() => setOpen(true)}>
      <Trash2 className={iconOnly ? "h-4 w-4 text-red-600" : "mr-2 h-4 w-4"} />
      {!iconOnly && "Delete"}
    </Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!isLoading) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete material procurement?</AlertDialogTitle>
          <AlertDialogDescription>{procurement.procurementNo || "This procurement sheet"} and all its items will be permanently deleted. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isLoading ? "Deleting..." : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
