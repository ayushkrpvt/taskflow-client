import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api/auth';

const navItems = [
  { to: '/',          label: 'Dashboard',  roles: ['super_admin','admin','hod','employee'] },
  { to: '/projects',  label: 'Projects',   roles: ['super_admin','admin','hod','employee'] },
  { to: '/tasks',     label: 'Tasks',      roles: ['super_admin','admin','hod','employee'] },
  { to: '/templates', label: 'Templates',  roles: ['super_admin'] },
  { to: '/users',     label: 'Users',      roles: ['super_admin'] },
];

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  hod:         'HOD',
  employee:    'Employee',
};

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout(localStorage.getItem('refreshToken')).catch(() => {});
    logoutUser();
    navigate('/login');
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="w-56 flex flex-col" style={{ backgroundColor: '#1A141F' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#94ECBE' }}>
            <span className="text-xs font-black" style={{ color: '#1A141F' }}>T</span>
          </div>
          <h1 className="text-base font-bold text-white tracking-wide">TaskFlow</h1>
        </div>

        {/* User chip */}
        <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#003A26' }}>
          <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs mt-0.5" style={{ color: '#94ECBE' }}>{ROLE_LABEL[user?.role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-brand-dark'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: '#94ECBE', color: '#1A141F' } : {}}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-sm px-3 py-2.5 rounded-lg text-left transition-all text-white/40 hover:text-white hover:bg-white/5"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
