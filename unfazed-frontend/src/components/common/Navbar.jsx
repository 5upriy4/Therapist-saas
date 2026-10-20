import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  Sparkles,
  MessageSquare,
  Compass,
} from 'lucide-react';

const Navbar = ({ onOpenUpgradeModal }) => {
  const { user, isTherapist, isClient, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const therapistNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Clients CRM', path: '/clients', icon: Users },
    { name: 'Clinical Notes', path: '/notes', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to={isTherapist ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                U
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
                  UNFAZED
                </span>
                <span className="text-[10px] font-semibold text-teal-600 tracking-wider uppercase">
                  Therapy SaaS
                </span>
              </div>
            </Link>

            {/* Nav links for logged in therapist */}
            {isTherapist && (
              <nav className="hidden md:flex items-center space-x-1">
                {therapistNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isTherapist && user ? (
              <>
                {/* Entitlement Tier Pill */}
                <button
                  onClick={onOpenUpgradeModal}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-500/10 to-indigo-500/10 text-teal-800 border border-teal-200 hover:border-teal-300 transition-all cursor-pointer"
                  title="Click to view subscription tier & limits"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span className="capitalize">{user.tier || 'Starter'} Plan</span>
                </button>

                {/* View Branded Profile link */}
                {user.slug && (
                  <Link
                    to={`/${user.slug}`}
                    target="_blank"
                    className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-700 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <span>Public Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                {/* User Info & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400">Therapist</span>
                  </div>
                  <img
                    src={user.profileImage || 'https://images.unsplash.com/photo-1594824813511-13c54c340795?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : isClient && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/portal"
                  className="text-sm font-medium text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg"
                >
                  Client Portal ({user.name})
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dr-sharma"
                  className="text-xs font-medium text-slate-600 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 hidden sm:block"
                >
                  Explore Demo Profile
                </Link>
                <Link
                  to="/portal"
                  className="text-xs font-medium text-slate-600 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Client Portal
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  Therapist Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
