import { useMemo, useState } from "react";
import { PageTitleContext } from "./page-title";

/* Shell ↔ page state: page name and info line (set through <PageHeader> or
   usePageTitle()), the number of mounted <PageHeader>s, and the current app
   with its sidebar rows for automatic breadcrumbs. */
export function PageTitleProvider({ app, rows, active, activeExact, children }) {
  const [title, setTitle] = useState(null);
  const [info, setInfo] = useState(null);
  const [headers, setHeaders] = useState(0);
  const value = useMemo(
    () => ({ title, setTitle, info, setInfo, headers, setHeaders, app, rows, active, activeExact }),
    [title, info, headers, app, rows, active, activeExact],
  );
  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}
