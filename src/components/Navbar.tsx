import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, LayoutDashboard, HeartPulse, FileText, BarChart3, MapPin, Bell, LogOut, Siren, Brain, ShieldCheck, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

export default function Navbar() {
  const { profile, donor, hospital, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNototOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isHospital = profile?.role === 'hospital' || (!!hospital && !donor);
  const isIndividual = profile?.role === 'individual' || (!!donor && !hospital);

  useEffect(() => {
    if (donor) {
      supabase
        .from('notifications')
        .select('*')
        .eq('donor_id', donor.id)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) {
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter((n) => !n.read).length);
          }
        });
    }
  }, [donor]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function markAllRead() {
    if (!donor) return;
    notifications.forEach((n) => {
      if (!n.read) {
        supabase.from('notifications').update({ read: true }).eq('id', n.id).then();
      }
    });
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const individualLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/organ-pledge', label: 'Organ Pledge', icon: HeartPulse },
    { to: '/recommendations', label: 'AI Insights', icon: Brain },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/transparency', label: 'Transparency', icon: ShieldCheck },
  ];

  const hospitalLinks = [
    { to: '/hospital-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/create-request', label: 'Emergency Request', icon: Siren },
    { to: '/nearby-hospitals', label: 'Nearby Hospitals', icon: MapPin },
    { to: '/recommendations', label: 'AI Insights', icon: Brain },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/transparency', label: 'Transparency', icon: ShieldCheck },
  ];

  const links = isHospital ? hospitalLinks : isIndividual ? individualLinks : [];

  if (!donor && !hospital && !profile) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-600/20">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold text-slate-800 hidden sm:block">LifeLink</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Emergency pulse for hospitals */}
            {isHospital && (
              <Link
                to="/create-request"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                />
                <Siren className="w-4 h-4" />
              </Link>
            )}

            {/* Notifications for individuals */}
            {isIndividual && (
              <div className="relative">
                <button
                  onClick={() => { setNototOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
                  className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 max-h-96 overflow-y-auto z-50"
                  >
                    <div className="p-3 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-slate-50">
                          <p className="text-sm text-slate-600">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {(donor?.full_name?.[0] || hospital?.hospital_name?.[0] || 'U').toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-700 max-w-32 truncate">
                  {donor?.full_name || hospital?.hospital_name}
                </p>
                <p className="text-xs text-slate-400">
                  {isHospital ? 'Hospital' : 'Donor'}
                  {donor && ` · ${donor.donor_level}`}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
