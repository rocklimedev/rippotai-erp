import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_META } from '@/config/appNav';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/inos';
import AppSidebar from './AppSidebar';
import GlobalTopBar from './GlobalTopBar';
import { activeItem, sidebarItems } from './nav-items';
import { PageTitleProvider } from './PageTitleContext';
import { usePageTitleState } from './page-title';
import { classifyLocation, codeFromInfo, recordVisit } from './recent';
import { LAST_APP_KEY } from './last-app';
import './shell.css';

const COLLAPSE_KEY = 'inos.sidebar.collapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

function titleFromPath(pathname) {
  const last = pathname.split('/').filter(Boolean).pop() || '';
  if (!last || /^[0-9a-f-]{8,}$/i.test(last) || /^\d+$/.test(last)) return null;
  return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Pages not built on <PageHeader> render their own big <h1> near the top.
   Lift its text into the shell's page header and hide the duplicate. */
function usePageHeading(rootRef, pathname, skip) {
  const [heading, setHeading] = useState(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || skip) return undefined;
    let current = null;
    const pick = () => {
      const top = root.getBoundingClientRect().top;
      const h1 = [...root.querySelectorAll('h1')].find(
        (el) =>
          !el.closest('[role=dialog]') &&
          !el.closest('.inos-page-header') &&
          el.getBoundingClientRect().top - top < 220 &&
          el.textContent.trim(),
      );
      if (current && current !== h1) current.classList.remove('is-lifted-title');
      current = h1 || null;
      if (h1) h1.classList.add('is-lifted-title');
      setHeading(h1 ? h1.textContent.trim() : null);
    };
    pick();
    const obs = new MutationObserver(pick);
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      obs.disconnect();
      if (current) current.classList.remove('is-lifted-title');
    };
  }, [rootRef, pathname, skip]);
  return skip ? null : heading;
}

const PLACEHOLDER = /^(loading|untitled)/i;

/** Automatic header (breadcrumb + title) for pages without <PageHeader>; document title; visit tracking. */
function ShellPage({ app, children }) {
  const location = useLocation();
  const { user } = useAuth();
  const ctx = usePageTitleState();
  const ref = useRef(null);
  const hasHeader = (ctx?.headers || 0) > 0;
  const lifted = usePageHeading(ref, location.pathname, hasHeader);
  const meta = APP_META[app] || { name: 'INOS', base: '/' };
  const explicit = ctx?.title || lifted;
  const fallback =
    ctx?.active?.label ||
    (location.pathname === meta.base ? meta.name : titleFromPath(location.pathname)) ||
    meta.name;
  const pageName = explicit || fallback;

  useEffect(() => {
    document.title = `${pageName} · INOS`;
  }, [pageName]);

  // Remember the last opened project and documents for "Continue working".
  const info = ctx?.info;
  const activeLabel = ctx?.active?.label;
  useEffect(() => {
    const kind = classifyLocation(location.pathname, location.search);
    if (!kind || !explicit || PLACEHOLDER.test(explicit) || !user?.id) return undefined;
    const t = setTimeout(() => {
      const to = `${location.pathname}${location.search}`;
      const code = codeFromInfo(info);
      if (kind.kind === 'project')
        recordVisit(user.id, {
          kind: 'project',
          id: kind.id,
          to: location.pathname,
          label: explicit,
        });
      else recordVisit(user.id, { kind: 'document', to, label: explicit, code, type: activeLabel });
    }, 700);
    return () => clearTimeout(t);
  }, [location.pathname, location.search, explicit, info, activeLabel, user?.id]);

  return (
    <main className="inos-shell__content">
      {!hasHeader && (
        <div className="inos-autohead">
          <PageHeader title={pageName} auto />
        </div>
      )}
      <div ref={ref} className="inos-shell__page">
        {children}
      </div>
    </main>
  );
}

/** INOS app shell: global top bar, app sidebar below it, page content with breadcrumb header. */
export default function AppShell({ app, children }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const rows = useMemo(() => sidebarItems(app, user), [app, user]);
  const active = activeItem(rows, location);
  const activeExact =
    !!active &&
    (active.to.includes('?')
      ? active.to === `${location.pathname}${location.search}`
      : active.to === location.pathname);

  useEffect(() => {
    if (location.pathname === '/approvals') return;
    try {
      sessionStorage.setItem(LAST_APP_KEY, app);
    } catch {
      /* storage unavailable */
    }
  }, [app, location.pathname]);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* storage unavailable */
      }
      return !c;
    });

  return (
    <PageTitleProvider app={app} rows={rows} active={active} activeExact={activeExact}>
      {/* The menu is either fully shown or fully hidden (no squeezed icon rail). */}
      <div className={`inos-shell ${collapsed ? 'is-hidden' : ''}`}>
        <GlobalTopBar
          app={app}
          menuHidden={collapsed}
          onOpenMenu={() =>
            window.innerWidth >= 1024 && collapsed ? toggle() : setMobileOpen(true)
          }
        />
        <AppSidebar
          app={app}
          collapsed={false}
          onToggle={toggle}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="inos-shell__main">
          <ShellPage app={app}>{children}</ShellPage>
        </div>
      </div>
    </PageTitleProvider>
  );
}
