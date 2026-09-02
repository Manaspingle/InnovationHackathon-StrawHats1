import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Heart, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const getDashboardLink = () => {
    if (profile?.role === 'hospital') return '/hospital-dashboard';
    return '/dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-lg transform group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-2xl bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                LifeLink
              </h1>
              <p className="text-xs text-gray-600 -mt-1">Connecting Lives</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!session ? (
              <>
                <Link
                  to="/auth?mode=signup&role=individual"
                  className="px-4 py-2.5 rounded-lg font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Register Donor
                </Link>
                <Link
                  to="/auth?mode=signup&role=hospital"
                  className="px-4 py-2.5 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Hospital Login
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-3">
                {!session ? (
                  <>
                    <Link
                      to="/auth?mode=signup&role=individual"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-2.5 rounded-lg font-semibold text-primary-600 hover:bg-primary-50 transition-colors text-center"
                    >
                      Register Donor
                    </Link>
                    <Link
                      to="/auth?mode=signup&role=hospital"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors text-center"
                    >
                      Hospital Login
                    </Link>
                    <Link
                      to="/auth?mode=login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-center"
                    >
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-center"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors text-center"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
