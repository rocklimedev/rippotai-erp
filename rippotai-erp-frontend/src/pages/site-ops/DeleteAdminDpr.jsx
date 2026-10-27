import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useDeleteAdminDprDocumentMutation } from "@/api/site-ops/admin-dpr.api";

export default function DeleteAdminDpr({ document, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [remove, { isLoading }] = useDeleteAdminDprDocumentMutation();
  const handleDelete = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    try {
      await remove(document.id).unwrap();
      toast.success("Admin DPR deleted.");
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to delete Admin DPR.");
    }
  };
  return <>
    <Button variant="ghost" className="text-red-600" disabled={isLoading} onClick={() => setOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!isLoading) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Admin DPR?</AlertDialogTitle>
          <AlertDialogDescription>{document.title || "This saved DPR"} and its saved Excel workbook will be permanently deleted. Source progress and coordination entries remain available in the workspace. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isLoading ? "Deleting..." : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
