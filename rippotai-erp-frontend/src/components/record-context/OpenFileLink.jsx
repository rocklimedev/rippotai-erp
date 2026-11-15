// "Open ↗" — opens an uploaded file in a new tab (see openFile.js).
import { ArrowUpRight } from "lucide-react";
import { openInNewTab } from "./openFile";
import "./record-context.css";

export default function OpenFileLink({ source, title, children = "Open", className, button, testId = "open-file" }) {
  if (!source) return null;
  return (
    <a
      href={/^https?:\/\//.test(source) ? source : "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={button ? `inos-btn inos-btn--secondary inos-btn--sm ${className || ""}` : `rc-link ${className || ""}`}
      onClick={(e) => {
        e.preventDefault();
        openInNewTab(source, { title });
      }}
      data-testid={testId}
    >
      {children}
      <ArrowUpRight aria-hidden size={14} />
    </a>
  );
}
