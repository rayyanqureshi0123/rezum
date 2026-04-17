import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, History, LayoutDashboard, Menu, X, User } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { title: 'History', path: '/history', icon: History },
    { title: 'Profile', path: '/profile', icon: User },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Hide navbar on login and register pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-[#030712] border-b border-white/5 px-6 py-3"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-50">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/" className="flex items-center gap-2 group text-white" onClick={() => setIsMenuOpen(false)}>
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary-500/30">
                <Brain className="text-white w-6 h-6" />
              </div>
              <span className="font-display font-bold text-xl tracking-tighter">
                REZUM<span className="text-primary-500">.</span>
              </span>
            </Link>
          </motion.div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                  {navLinks.map((link) => (
                    <motion.div key={link.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link 
                        to={link.path} 
                        className={`hover:text-white transition-colors flex items-center gap-2 ${location.pathname === link.path ? 'text-white' : ''}`}
                      >
                        <link.icon className="w-4 h-4" /> {link.title}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="h-6 w-px bg-white/10 hidden md:block" />
                
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold text-white">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-all duration-200 hidden sm:block"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>

                  {/* Mobile Toggle */}
                  <button 
                    onClick={toggleMenu}
                    className="md:hidden p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                  >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="btn-secondary py-2 px-5 text-sm font-semibold hidden sm:block">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2 px-5 text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 md:hidden bg-[#030712] rounded-3xl p-5 shadow-2xl border border-white/5 overflow-hidden z-[110]"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-white/5 sm:hidden">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === link.path ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'}`}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="font-medium">{link.title}</span>
                    </Link>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to log out of your account? You'll need to sign back in to access your history."
        confirmText="Logout"
      />
    </>
  );
};

export default Navbar;
