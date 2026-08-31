import React from "react";
import { Label } from "@/components/ui/label";

export function FormField({
  id,
  label,
  hint,
  error,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}

      {children}

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-4 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default FormField;
