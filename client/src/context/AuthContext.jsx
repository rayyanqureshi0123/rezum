import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Check both storages
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (savedUser && savedUser !== 'undefined' && token) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error parsing session:', error);
      localStorage.clear();
      sessionStorage.clear();
    }
    
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  const login = (userData, token, rememberMe = false) => {
    setUser(userData);
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('token', token);
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const updateUser = (userData) => {
    setUser(userData);
    const inLocal = localStorage.getItem('user');
    const storage = inLocal ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {loading ? (
        <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 animate-pulse" />
            <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center relative shadow-2xl">
              <Brain className="text-white w-10 h-10 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tighter text-white">REZUM<span className="text-primary-500">.</span></h2>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce" />
            </div>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
