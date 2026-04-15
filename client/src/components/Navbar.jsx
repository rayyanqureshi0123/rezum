import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, History, LayoutDashboard, User } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto glass-morphism rounded-2xl px-6 py-3 flex items-center justify-between">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary-500/30">
            <Brain className="text-white w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tighter">
            REZUM<span className="text-primary-500">.</span>
          </span>
          </Link>
        </motion.div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/history" className="hover:text-white transition-colors flex items-center gap-2">
                    <History className="w-4 h-4" /> History
                  </Link>
                </motion.div>
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
                  className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/login" className="btn-secondary py-2 px-5 text-sm font-semibold bg-white/5 border border-white/5">
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="btn-primary py-2 px-5 text-sm">
                  Get Started
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to log out of your account? You'll need to sign back in to access your history."
        confirmText="Logout"
      />
    </motion.nav>
  );
};

export default Navbar;
