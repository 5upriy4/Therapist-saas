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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to={isTherapist ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform">
                U
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
                  UNFAZED
                </span>
                <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                  Therapy SaaS
                </span>
              </div>
            </Link>

            {/* Nav links for logged in therapist */}
            {isTherapist && (
              <nav className="hidden md:flex items-center space-x-1 pl-4">
                {therapistNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/15 shadow-xs'
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
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border border-blue-200/80 hover:border-blue-300 transition-all cursor-pointer shadow-xs"
                  title="Click to view subscription tier & limits"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="capitalize">{user.tier || 'Starter'} Plan</span>
                </button>

                {/* View Branded Profile link */}
                {user.slug && (
                  <Link
                    to={`/${user.slug}`}
                    target="_blank"
                    className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                  >
                    <span>Public Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
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
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20 border border-slate-200"
                  />
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
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
                  className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-colors"
                >
                  Client Portal ({user.name})
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dr-sharma"
                  className="text-xs font-medium text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors hidden sm:block"
                >
                  Explore Demo Profile
                </Link>
                <Link
                  to="/portal"
                  className="text-xs font-medium text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Client Portal
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-blue-500/25 hover:shadow-md"
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
