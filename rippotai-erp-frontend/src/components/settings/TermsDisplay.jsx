import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Pill } from "@/components/inos";
import "@/pages/settings/_admin-ui.css";

/**
 * Parses HTML terms and extracts individual items
 * Handles <ol><li>, <ul><li>, and newline-separated formats
 */
function parseTermsFromHtml(htmlString) {
  if (!htmlString) return [];

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = htmlString;

  const items = [];

  // Try to find ordered or unordered lists
  const listItems = temp.querySelectorAll("li");
  if (listItems.length > 0) {
    listItems.forEach((li) => {
      const text = li.textContent.trim();
      if (text) items.push(text);
    });
  }

  // Fallback: if no list items found, try splitting by newlines
  if (items.length === 0) {
    const lines = htmlString
      .split(/<br\s*\/?>|\n/gi)
      .map((line) => line.replace(/<[^>]+>/g, "").trim())
      .filter((line) => line.length > 0);
    return lines;
  }

  return items;
}

const Empty = () => (
  <p style={{ margin: 0, fontSize: 13, color: "var(--text-3)" }}>No terms written yet.</p>
);

/**
 * TermsPreview - Display terms in a clean, easy-to-read format
 * Shows first 3 items by default, expandable
 */
export function TermsPreview({ htmlContent, maxPreview = 3 }) {
  const [expanded, setExpanded] = useState(false);
  const items = parseTermsFromHtml(htmlContent);

  if (items.length === 0) {
    return <Empty />;
  }

  const displayItems = expanded ? items : items.slice(0, maxPreview);
  const hasMore = items.length > maxPreview;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <ol className="adm-terms-list">
        {displayItems.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ol>

      {hasMore && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="adm-link-btn" style={{ justifySelf: "start" }}>
          {expanded ? (
            <>
              <ChevronUp aria-hidden /> Show less
            </>
          ) : (
            <>
              <ChevronDown aria-hidden /> Show {items.length - maxPreview} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * TermsFullDisplay - Full expandable terms display with sections
 * Use in modals or detailed views
 */
export function TermsFullDisplay({ htmlContent }) {
  const items = parseTermsFromHtml(htmlContent);

  if (items.length === 0) {
    return <Empty />;
  }

  return (
    <ol className="adm-terms-list" style={{ gap: 10 }}>
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ol>
  );
}

/**
 * TermsSection - Displays terms grouped by category with visual separation
 * Useful for detailed views showing different term sections
 */
export function TermsSection({
  title,
  htmlContent,
  icon: Icon,
  collapsible = true,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const items = parseTermsFromHtml(htmlContent);

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
      <button
        type="button"
        onClick={() => collapsible && setCollapsed(!collapsed)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "var(--surface-2)",
          borderBottom: collapsed ? 0 : "1px solid var(--line)",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Icon && (
            <span className="inos-icon-tile inos-icon-tile--sm">
              <Icon aria-hidden />
            </span>
          )}
          <span style={{ fontWeight: 650, color: "var(--text)" }}>{title}</span>
          <Pill dot={false} size="sm">
            {items.length} {items.length === 1 ? "term" : "terms"}
          </Pill>
        </span>
        {collapsible && (
          <ChevronDown
            size={18}
            style={{ color: "var(--text-3)", transition: "transform .15s ease", transform: collapsed ? "rotate(-90deg)" : "none" }}
          />
        )}
      </button>

      {!collapsed && (
        <div style={{ padding: 16 }}>
          {items.length === 0 ? <Empty /> : <TermsFullDisplay htmlContent={htmlContent} />}
        </div>
      )}
    </div>
  );
}
