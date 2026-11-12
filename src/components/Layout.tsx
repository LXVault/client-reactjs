import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Shared application shell: persistent navbar + routed page content.
export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
