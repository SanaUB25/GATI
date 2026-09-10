import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  ['/', '⌂', 'Command overview'], ['/workflow', '◇', 'Planning workflow'], ['/network', '⌘', 'Network overview'], ['/maintenance', '⌁', 'Maintenance demand'],
  ['/plans', '≡', 'Candidate plans'], ['/simulation', '◌', 'Simulation results'],
  ['/risk', '◒', 'Risk dashboard'], ['/gati', '↗', 'GATI dashboard'],
  ['/gemini', '✦', 'Gemini assistant'], ['/reports', '▤', 'Reports'],
  ['/notifications', '●', 'Notifications'], ['/admin', '⌘', 'Administration'],
  ['/profile', '◉', 'Profile'], ['/settings', '⚙', 'Settings'],
];

export function AppShell() {
  const { session, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);

  return <div className="app-shell">
    <aside className={isSidebarOpen ? 'sidebar sidebar-open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark"><i /><i /><i /></span><strong>RAILVISTA</strong></div>
      <p className="sidebar-label">Control platforms</p>
      <nav aria-label="Primary navigation">{links.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={closeSidebar}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span></NavLink>)}</nav>
      <button className="ghost sign-out" onClick={signOut}><span aria-hidden="true">↪</span> Sign out</button>
    </aside>
    {isSidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={closeSidebar} />}
    <section className="route-view">
      <header className="top-navbar">
        <button className="menu-button" aria-label="Open navigation" aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen((open) => !open)}><span /><span /><span /></button>
        <div className="navbar-route"><span className="navbar-signal"><i /><i /><i /></span><span>Network control / live operations</span></div>
        <div className="rail-line" aria-hidden="true"><span className="rail-train">▰</span></div>
        <div className="navbar-status"><span className="signal-dot" />Network stable</div>
        <div className="navbar-user"><span>{session?.role || 'CONTROL_OFFICER'}</span><span className="avatar">{session?.name?.slice(0, 2).toUpperCase() || 'CO'}</span></div>
      </header>
      <Outlet />
    </section>
  </div>;
}
