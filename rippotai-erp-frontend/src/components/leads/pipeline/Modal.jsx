import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/inos";

/** Centered modal in Quiet Studio style (title, body, footer). */
export function Modal({ open, onOpenChange, title, description, children, footer, size, testId }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="crm-overlay" />
        <DialogPrimitive.Content
          className={`crm-modal ${size === "sm" ? "crm-modal--sm" : ""}`}
          data-testid={testId}
          aria-describedby={undefined}
        >
          <div className="crm-modal__head">
            <div style={{ minWidth: 0 }}>
              <DialogPrimitive.Title className="crm-modal__title">{title}</DialogPrimitive.Title>
              {description && <p className="crm-modal__desc">{description}</p>}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm" icon={X} aria-label="Close" style={{ marginLeft: "auto" }} />
            </DialogPrimitive.Close>
          </div>
          <div className="crm-modal__body">{children}</div>
          {footer && <div className="crm-modal__foot">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Right-side drawer. */
export function Drawer({ open, onOpenChange, children, label = "Deal", testId }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="crm-overlay" />
        <DialogPrimitive.Content className="crm-drawer" data-testid={testId} aria-describedby={undefined}>
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DrawerClose = DialogPrimitive.Close;
