// On-screen wrapper for a <PrintDocument>: a soft backdrop that scrolls sideways on narrow screens.
import React from "react";

export default function DocumentPreview({ children }) {
  return (
    <div style={{ overflowX: "auto", padding: "8px 0 32px" }}>
      <div style={{ minWidth: "calc(210mm + 16px)" }}>{children}</div>
    </div>
  );
}
