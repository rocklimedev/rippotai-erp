import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, backTo, actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {backTo && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-1 -ml-2 text-[var(--muted)] hover:text-[var(--ink-green)]"
          >
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        )}
        <p className="eyebrow">Site Operations</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink-green)] truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--muted)] max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
