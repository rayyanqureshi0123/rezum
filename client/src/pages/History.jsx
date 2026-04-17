import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Trash2, ArrowRight, Loader2, Calendar, Award, Briefcase, Search, Filter } from 'lucide-react';
import { resumeAPI } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data } = await resumeAPI.getHistory();
      setHistory(data.resumes || []);
    } catch (err) {
      setError('Failed to load history. Please try refreshing or logging in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await resumeAPI.delete(id);
      setHistory(history.filter(item => item._id !== id));
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredHistory = history.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    const fileName = (item.fileName || 'Resume Analysis').toLowerCase();
    const roles = (item.analysis?.jobRoleSuggestions || []).join(' ').toLowerCase();
    const skills = [
      ...(item.analysis?.skills?.technical || []),
      ...(item.analysis?.skills?.soft || [])
    ].join(' ').toLowerCase();
    const insight = (item.analysis?.marketReadinessInsight || '').toLowerCase();

    return fileName.includes(searchStr) || 
           roles.includes(searchStr) || 
           skills.includes(searchStr) || 
           insight.includes(searchStr);
  });

  return (
    <div className="min-h-screen pt-36 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-5xl font-extrabold leading-tight"
            >
              Analysis <span className="gradient-text">History</span>
            </motion.h1>
            <p className="text-slate-400">
              Access all your past resume evaluations and track your improvements over time.
            </p>
          </div>

          <div className="relative group w-full md:w-auto md:min-w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search by file, role, skills, or insights..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-card p-5 flex items-center gap-5 border-primary-500/20 bg-gradient-to-br from-primary-600/10 to-transparent">
             <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
                <FileText className="w-7 h-7" />
             </div>
             <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Evaluated</p>
                <h4 className="text-3xl font-black">{history.length}</h4>
             </div>
           </div>
           
           <div className="glass-card p-5 flex items-center gap-5 border-accent-500/20 bg-gradient-to-br from-accent-600/10 to-transparent">
              <div className="w-14 h-14 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                 <Award className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Best Score</p>
                <h4 className="text-3xl font-black">
                  {history.length > 0 ? Math.max(...history.map(h => h.analysis?.atsScore || 0)) : 0}%
                </h4>
              </div>
            </div>

            <div className="glass-card p-5 flex items-center gap-5 border-emerald-500/20 bg-gradient-to-br from-emerald-600/10 to-transparent">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                 <Briefcase className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Avg. ATS Score</p>
                <h4 className="text-3xl font-black">
                  {history.length > 0 ? Math.round(history.reduce((a, b) => a + (b.analysis?.atsScore || 0), 0) / history.length) : 0}%
                </h4>
              </div>
            </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card border-red-500/30 bg-red-500/10 p-4 text-red-400 flex items-center justify-between">
            <p>{error}</p>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={fetchHistory} 
              className="text-sm font-bold underline"
            >
              Retry
            </motion.button>
          </div>
        )}

        {/* History List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <p className="text-slate-500">Loading your analysis history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="glass-card p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold">No records found</h3>
              <p className="text-slate-500">
                {searchTerm ? `No results for "${searchTerm}"` : "You haven't analyzed any resumes yet."}
              </p>
              {!searchTerm && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')} 
                  className="btn-primary"
                >
                  Analyze New Resume
                </motion.button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHistory.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.3, 
                    delay: Math.min(idx * 0.05, 0.3) 
                  }}
                  whileHover={{ 
                    y: -2,
                    zIndex: 50,
                    backgroundColor: "rgba(30, 41, 59, 0.5)",
                    borderColor: "rgba(14, 165, 233, 0.5)",
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
                    transition: { delay: 0, duration: 0.2 }
                  }}
                  key={item._id} 
                  className="glass-card group transition-colors duration-200 cursor-pointer overflow-hidden p-6 flex flex-col gap-4 relative"
                  onClick={() => navigate(`/analysis/${item._id}`, { state: { result: item.analysis, resume: item } })}
                >
                  {/* Delete Button - Only visible on hover */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({ isOpen: true, id: item._id });
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-30"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Score Badge */}
                  <div className={`absolute top-0 left-0 px-4 py-1.5 rounded-br-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                    (item.analysis?.atsScore || 0) >= 80 ? 'bg-green-500/20 text-green-400' : 
                    (item.analysis?.atsScore || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {item.analysis?.atsScore || 0}% Score
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-primary-400 shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg truncate max-w-[180px] group-hover:text-primary-400 transition-colors">
                        {item.fileName || 'Resume Analysis'}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-400 mb-2">Primary Match:</div>
                    <div className="flex flex-wrap gap-2">
                       {item.analysis?.jobRoleSuggestions?.slice(0, 2).map((role, rIdx) => (
                         <span key={rIdx} className="bg-slate-800/50 text-slate-300 px-2 py-1 rounded text-xs border border-white/5">
                           {role}
                         </span>
                       ))}
                    </div>
                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Delete Record"
        message="This will permanently delete this resume analysis from your history. This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default HistoryPage;
