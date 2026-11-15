import { createContext, useContext, useEffect, useLayoutEffect } from "react";

// Shell state shared with the page: the page name (PageHeader / usePageTitle),
// the one info line, whether the page renders its own <PageHeader>, and the
// current app with its sidebar rows (for automatic breadcrumbs).
export const PageTitleContext = createContext(null);

export function usePageTitleState() {
  return useContext(PageTitleContext);
}

/** Register the current page's name (and info line) with the shell. Returns true inside the app shell. */
export function usePageTitle(title, info) {
  const ctx = useContext(PageTitleContext);
  const setTitle = ctx?.setTitle;
  const setInfo = ctx?.setInfo;
  useEffect(() => {
    if (!setTitle || !title) return undefined;
    setTitle(title);
    return () => setTitle((t) => (t === title ? null : t));
  }, [setTitle, title]);
  useEffect(() => {
    if (!setInfo || !info) return undefined;
    setInfo(info);
    return () => setInfo((t) => (t === info ? null : t));
  }, [setInfo, info]);
  return Boolean(ctx);
}

/** A <PageHeader> is on the page: the shell's automatic header steps aside. */
export function useHeaderPresence(enabled = true) {
  const ctx = useContext(PageTitleContext);
  const setHeaders = ctx?.setHeaders;
  useLayoutEffect(() => {
    if (!setHeaders || !enabled) return undefined;
    setHeaders((n) => n + 1);
    return () => setHeaders((n) => n - 1);
  }, [setHeaders, enabled]);
}
