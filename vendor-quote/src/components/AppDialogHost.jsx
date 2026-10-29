import { useRef, useState, useSyncExternalStore } from "react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDialog, subscribeDialogs, resolveDialog } from "@/lib/app-dialog";

function AppDialog({ request }) {
  const [value, setValue] = useState(request.defaultValue);
  const inputRef = useRef(null);
  const isPrompt = request.type === "prompt";
  const isAlert = request.type === "alert";
  const finish = (result) => resolveDialog(request.id, result);
  const cancel = () => finish(isPrompt ? null : false);

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) cancel(); }}>
      <AlertDialogContent aria-describedby={`app-dialog-message-${request.id}`}
        onOpenAutoFocus={(event) => {
          if (isPrompt) {
            event.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.select();
          }
        }} className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <form onSubmit={(event) => { event.preventDefault(); finish(isPrompt ? value : true); }} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{isPrompt ? "Enter details" : isAlert ? "Notice" : "Confirm action"}</AlertDialogTitle>
            <AlertDialogDescription id={`app-dialog-message-${request.id}`} className="whitespace-pre-wrap break-words">
              {request.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isPrompt && (
            <Input ref={inputRef} aria-label="Your response" aria-describedby={`app-dialog-message-${request.id}`}
              value={value} onChange={(event) => setValue(event.target.value)} />
          )}
          <AlertDialogFooter>
            {!isAlert && <AlertDialogCancel type="button" onClick={cancel}>Cancel</AlertDialogCancel>}
            <Button type="submit">{isAlert || isPrompt ? "OK" : "Continue"}</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AppDialogHost() {
  const request = useSyncExternalStore(subscribeDialogs, getDialog, () => null);
  return request ? <AppDialog key={request.id} request={request} /> : null;
}
