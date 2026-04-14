import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.login(formData);
      login(data, data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.google(response.credential);
      login(data, data.token);
    } catch (err) {
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#020617] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 glass-morphism p-10 rounded-3xl relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/20">
            <Brain className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back</h1>
          <p className="text-slate-400">Continue your career journey with AI insights</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center w-full">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError('Google login failed')} 
              theme="filled_black"
              shape="pill"
              width="320px"
              text="continue_with"
            />
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-widest">or email</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="input-field pl-12"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-field pl-12"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm font-medium text-center">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 group"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm">
          Don't have an account? {' '}
          <Link to="/register" className="text-primary-400 font-bold hover:underline">Register Now</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
