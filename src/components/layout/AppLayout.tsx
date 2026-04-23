import { Outlet, NavLink } from 'react-router-dom';
import { Users, UserCircle, Shield, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  isAdmin?: boolean;
}

export function AppLayout({ isAdmin = false }: AppLayoutProps) {
  const { logout, logoutAdmin } = useAuth();

  const userNav = [
    { to: '/', label: 'Groups', icon: Users, end: true },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ];

  const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/moderation', label: 'Moderation', icon: Shield },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-brand">
            {isAdmin ? 'Foorest Admin' : 'Foorest'}
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={isAdmin ? logoutAdmin : logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
