import React, { useEffect, useRef } from "react";
import { cleanRichText } from "@/lib/rich-text";
import "./rich-text.css";

export function RichText({ value, className = "", as: Tag = "div" }) {
  return <Tag className={`boq-rich-content ${className}`} dangerouslySetInnerHTML={{ __html: cleanRichText(value) }} />;
}

// DOM-owned while typing: server refreshes must not move the selection or erase a draft.
export function RichTextEditor({ value = "", onChange, onSave, disabled, label = "Notes", testid }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const pending = useRef(null);
  const callbacks = useRef({ onChange, onSave });
  callbacks.current = { onChange, onSave };
  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current !== null) {
      const html = pending.current;
      pending.current = null;
      callbacks.current.onSave?.(html);
    }
  };
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) ref.current.innerHTML = cleanRichText(value);
  }, [value]);
  useEffect(() => () => flush(), []);
  const change = () => {
    const html = cleanRichText(ref.current.innerHTML);
    callbacks.current.onChange?.(html);
    if (callbacks.current.onSave) {
      pending.current = html;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    }
  };
  const bold = () => {
    if (disabled) return;
    ref.current.focus();
    document.execCommand("bold", false);
    change();
  };
  return <div className="boq-rich-editor">
    <div className="boq-rich-toolbar"><button type="button" aria-label={`Bold ${label}`} title="Bold (Ctrl+B)" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={bold}><strong>B</strong></button><span>Bold · Enter for a new line</span></div>
    <div ref={ref} role="textbox" aria-label={label} aria-multiline="true" aria-readonly={disabled || undefined} contentEditable={!disabled} suppressContentEditableWarning className="boq-rich-content boq-rich-input" data-testid={testid} onInput={change} onBlur={flush}
      onPaste={(e) => { e.preventDefault(); if (disabled) return; const text = e.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); change(); }} />
  </div>;
}
