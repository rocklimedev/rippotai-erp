import { createElement, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Check, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MODULE_ICONS } from '@/components/icons/ModuleIcons';
import { APP_META } from '@/config/appNav';
import { useAuth } from '@/context/AuthContext';
import { useMyApprovalsCount } from '@/api/doc-flow/approvals.api';
import { activeItem, sidebarItems } from './nav-items';
import { useRecent } from './recent';
import { navIcon } from './sidebar-icons';

function Shortcuts({ collapsed }) {
  const { user } = useAuth();
  const { project } = useRecent();
  const count = useMyApprovalsCount(!user?.id);
  const location = useLocation();
  const onApprovals = location.pathname === '/approvals';
  return (
    <div className="inos-side__foot" data-testid="sidebar-shortcuts">
      {!collapsed && <div className="inos-side__section">Shortcuts</div>}
      <Link
        to={project?.to || '/projects'}
        className={`inos-side__shortcut ${project && location.pathname === project.to ? 'is-active' : ''}`}
        title={project ? `Current project: ${project.label}` : 'Current project'}
        data-testid="shortcut-current-project"
      >
        <ArrowUpRight size={15} aria-hidden />
        {!collapsed && (
          <span className="inos-side__shortcut-text">
            <span>Current project</span>
            {project && (
              <small>{project.code ? `${project.code} · ${project.label}` : project.label}</small>
            )}
          </span>
        )}
      </Link>
      <Link
        to="/approvals"
        className={`inos-side__shortcut ${onApprovals ? 'is-active' : ''}`}
        title="My approvals"
        data-testid="shortcut-my-approvals"
      >
        <Check size={15} aria-hidden />
        {!collapsed && (
          <span className="inos-side__shortcut-text">
            <span>My approvals{count != null ? ` (${count})` : ''}</span>
          </span>
        )}
      </Link>
    </div>
  );
}

function ItemIcon({ label }) {
  return (
    <span className="inos-side__icon" aria-label={label}>
      {createElement(navIcon(label), { size: 17, strokeWidth: 1.8, 'aria-hidden': true })}
    </span>
  );
}

function SectionMark({ name }) {
  return (
    <div className="inos-side__section-mark" title={name} aria-label={name}>
      {createElement(navIcon(name), { size: 14, strokeWidth: 2, 'aria-hidden': true })}
    </div>
  );
}

export default function AppSidebar({ app, collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { user } = useAuth();
  const meta = APP_META[app] || { name: 'INOS', base: '/' };
  const Icon = MODULE_ICONS[app];
  const rows = useMemo(() => sidebarItems(app, user), [app, user]);
  const active = activeItem(rows, location);
  const onHome = location.pathname === meta.base && !location.search;
  const groups = useMemo(() => {
    const out = [];
    for (const r of rows) {
      if (r.section || !out.length) out.push({ section: r.section || null, rows: [] });
      out[out.length - 1].rows.push(r);
    }
    return out;
  }, [rows]);
  const storeKey = `inos.sidebar.closed.${app}`;
  const [closed, setClosed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storeKey) || '{}');
    } catch {
      return {};
    }
  });
  const toggleSection = (name) =>
    setClosed((c) => {
      const nextState = { ...c, [name]: !c[name] };
      try {
        localStorage.setItem(storeKey, JSON.stringify(nextState));
      } catch {
        /* storage unavailable */
      }
      return nextState;
    });

  return (
    <>
      {mobileOpen && <div className="inos-side__scrim" onClick={onCloseMobile} />}
      <aside
        className={`inos-side ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
        data-testid={`sidebar-${app}`}
        aria-label={`${meta.name} menu`}
      >
        <nav
          className="inos-side__body"
          onClick={(e) => e.target.closest('a') && onCloseMobile?.()}
        >
          <div className="inos-side__head">
            <Link
              to={meta.base}
              className={`inos-side__app ${onHome ? 'is-active' : ''}`}
              title={`${meta.name} home`}
            >
              <span className="inos-side__app-icon">{Icon && <Icon />}</span>
              {!collapsed && <span className="inos-side__app-name">{meta.name}</span>}
            </Link>
            <button
              type="button"
              className="inos-side__collapse"
              onClick={onToggle}
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
              title={collapsed ? 'Expand menu' : 'Collapse menu'}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>

          <ul className="inos-side__menu">
            {groups.map((g) => {
              const open = collapsed || !g.section || !closed[g.section] || g.rows.includes(active);
              return (
                <li key={g.section || '_top'}>
                  {g.section && !collapsed && (
                    <button
                      type="button"
                      className="inos-side__section inos-side__section--toggle"
                      aria-expanded={open}
                      onClick={() => toggleSection(g.section)}
                    >
                      <span>{g.section}</span>
                      <ChevronDown size={14} className={open ? '' : 'is-closed'} />
                    </button>
                  )}
                  {g.section && collapsed && <SectionMark name={g.section} />}
                  {open && (
                    <ul>
                      {g.rows.map((r) => (
                        <li key={`${r.to}|${r.label}`}>
                          <Link
                            to={r.to}
                            className={`inos-side__item ${active === r ? 'is-active' : ''}`}
                            title={collapsed ? r.label : undefined}
                          >
                            {collapsed ? <ItemIcon label={r.label} /> : <span>{r.label}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <Shortcuts collapsed={collapsed} />
      </aside>
    </>
  );
}
