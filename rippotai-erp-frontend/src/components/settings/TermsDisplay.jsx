import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
      .split(/<br\s*\/?>/gi)
      .map((line) => line.replace(/<[^>]+>/g, "").trim())
      .filter((line) => line.length > 0);
    return lines;
  }

  return items;
}

/**
 * TermsPreview - Display terms in a clean, easy-to-read format
 * Shows first 3 items by default, expandable
 */
export function TermsPreview({ htmlContent, maxPreview = 3 }) {
  const [expanded, setExpanded] = useState(false);
  const items = parseTermsFromHtml(htmlContent);

  if (items.length === 0) {
    return <p className="text-sm text-[#6B7B7C] italic">No terms defined</p>;
  }

  const displayItems = expanded ? items : items.slice(0, maxPreview);
  const hasMore = items.length > maxPreview;

  return (
    <div className="space-y-2">
      <ol className="space-y-2 list-decimal list-inside">
        {displayItems.map((item, idx) => (
          <li key={idx} className="text-sm text-[#2D3A3A] leading-relaxed">
            {item}
          </li>
        ))}
      </ol>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Show {items.length - maxPreview} more
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
    return <p className="text-sm text-[#6B7B7C] italic">No terms defined</p>;
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-3 list-decimal list-inside">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-[#2D3A3A] leading-relaxed">
            <span className="ml-1">{item}</span>
          </li>
        ))}
      </ol>
    </div>
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
    <div className="rounded-lg border border-[#E2E8E6] overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-3 bg-[#F5F9F8] hover:bg-[#EDF4F2] flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-[#6B7B7C]" />}
          <span className="font-semibold text-[#2D3A3A]">{title}</span>
          <span className="text-xs text-[#6B7B7C] bg-white px-2 py-1 rounded">
            {items.length} {items.length === 1 ? "term" : "terms"}
          </span>
        </div>
        {collapsible && (
          <ChevronDown
            size={18}
            className={`text-[#6B7B7C] transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-[#6B7B7C] italic">No terms defined</p>
          ) : (
            <ol className="space-y-3 list-decimal list-inside">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className="text-sm text-[#2D3A3A] leading-relaxed"
                >
                  <span className="ml-1">{item}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
