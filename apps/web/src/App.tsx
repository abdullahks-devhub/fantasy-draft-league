import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Standings from './pages/Standings';
import AdminDashboard from './pages/AdminDashboard';
import HotWrestlers from './pages/HotWrestlers';
import Rosters from './pages/Rosters';
import WeeklyScores from './pages/WeeklyScores';
import FreeAgents from './pages/FreeAgents';
import TradeHistory from './pages/TradeHistory';
import AdminWrestlers from './pages/AdminWrestlers';
import AdminRules from './pages/AdminRules';
import Login from './pages/Login';
import HistoryArchive from './pages/HistoryArchive';
import { useAuthStore } from './store/authStore';

import { Trophy, Settings, Users, Flame, LayoutTemplate, CalendarDays, UserSearch, ArrowRightLeft, User, LogOut, History } from 'lucide-react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore(state => state.isAuthenticated);
  const isAuthenticated = checkAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

const NAV_LINKS = [
  { to: '/',              label: 'Standings',    icon: <Users className="w-4 h-4" /> },
  { to: '/rosters',      label: 'Rosters',      icon: <LayoutTemplate className="w-4 h-4" /> },
  { to: '/weekly-scores',label: 'Scores',        icon: <CalendarDays className="w-4 h-4" /> },
  { to: '/free-agents',  label: 'Free Agents',   icon: <UserSearch className="w-4 h-4" /> },
  { to: '/hot-wrestlers', label: 'Hot List',     icon: <Flame className="w-4 h-4 text-orange-500" /> },
  { to: '/trades',       label: 'Trades',        icon: <ArrowRightLeft className="w-4 h-4" /> },
  { to: '/history',      label: 'History',       icon: <History className="w-4 h-4" /> },
  { to: '/admin/wrestlers', label: 'Wrestlers', icon: <User className="w-4 h-4" /> },
];

import { useIsFetching } from '@tanstack/react-query';

function App() {
  const location = useLocation();
  const isFetching = useIsFetching();
  const checkAuth = useAuthStore(state => state.isAuthenticated);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const isAuthenticated = checkAuth();

  const isActive = (path: string) =>
    location.pathname === path
      ? 'border-indigo-500 text-white bg-indigo-500/10'
      : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/40';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* Global Loading Bar */}
      <div className={`fixed top-0 left-0 right-0 h-0.5 bg-indigo-500 z-[100] transition-transform duration-500 origin-left ${isFetching ? 'scale-x-100' : 'scale-x-0'}`} />

      <nav className="border-b border-gray-800/60 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-black tracking-tight text-white hover:text-indigo-400 transition-colors shrink-0"
              >
                <Trophy className="w-6 h-6 text-indigo-500" />
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Wrestling Fantasy
                </span>
              </Link>

              {/* Nav links — hidden on mobile */}
              <div className="hidden md:flex space-x-1">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                      location.pathname === link.to
                        ? 'text-white bg-gray-800/80 shadow-sm border border-gray-700'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin icon and Logout */}
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className={`p-2 rounded-full transition-all shadow-sm ${
                  location.pathname === '/admin'
                    ? 'text-white bg-gray-800/80 shadow-sm border border-gray-700'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent'
                }`}
                aria-label="Admin Dashboard"
              >
                <Settings className="w-5 h-5" />
              </Link>
              {isAuthenticated && (
                <button
                  onClick={() => clearAuth()}
                  className="p-2 rounded-full text-gray-500 hover:text-red-400 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Mobile nav — scrollable pills */}
        <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2 scrollbar-none">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 border ${isActive(link.to)}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Routes>
          <Route path="/"               element={<Standings />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/admin"          element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/hot-wrestlers"  element={<HotWrestlers />} />
          <Route path="/rosters"        element={<Rosters />} />
          <Route path="/weekly-scores"  element={<WeeklyScores />} />
          <Route path="/free-agents"    element={<FreeAgents />} />
          <Route path="/trades"         element={<TradeHistory />} />
          <Route path="/history"        element={<HistoryArchive />} />
          <Route path="/admin/wrestlers" element={<PrivateRoute><AdminWrestlers /></PrivateRoute>} />
          <Route path="/admin/rules"     element={<PrivateRoute><AdminRules /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
