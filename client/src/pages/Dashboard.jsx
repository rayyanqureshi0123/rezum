import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, ArrowRight, Loader2, Plus, Sparkles, CheckCircle, Eye } from 'lucide-react';
import { resumeAPI } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ConfirmModal from '../components/ConfirmModal';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // JD Match Feature States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  const navigate = useNavigate();

  const loadingSteps = [
    "Extracting text from document...",
    "Scanning formatting & structure...",
    "Consulting AI on tech skills...",
    "Calculating ATS benchmarks...",
    "Finalizing analysis report..."
  ];

  useEffect(() => {
    let interval;
    if (uploading) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await resumeAPI.getHistory();
      setHistory(data.resumes || []);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a resume file first.");
      return;
    }

    const formData = new FormData();
    formData.append('resume', selectedFile);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }

    setUploading(true);
    setIsModalOpen(false); // Close modal during upload
    try {
      const { data } = await resumeAPI.analyze(formData);
      if (data.success) {
        // Reset states
        setSelectedFile(null);
        setJobDescription("");
        navigate(`/analysis/${data.resume._id}`, { state: { result: data.resume.analysis, resume: data.resume } });
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await resumeAPI.delete(id);
      setHistory(history.filter(item => item._id !== id));
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      setError('Delete failed');
    }
  };

  const chartData = history.slice().reverse().map(item => ({
    name: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date(item.createdAt).toLocaleDateString(),
    score: item.analysis?.atsScore || 0
  }));

  return (
    <>
      <AnimatePresence>
        {uploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="flex flex-col items-center max-w-md w-full p-8 glass-morphism rounded-3xl border border-white/10 mx-4"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 rounded-full animate-pulse" />
                <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center relative border border-white/10 shadow-2xl">
                  <Sparkles className="w-10 h-10 text-primary-400 absolute animate-pulse" />
                  <Loader2 className="w-10 h-10 text-white animate-spin opacity-20" />
                </div>
              </div>
              
              <div className="h-8 relative w-full flex justify-center mt-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-bold text-white absolute text-center w-full"
                  >
                    {loadingSteps[currentStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
              
              <div className="w-full bg-slate-800/50 h-2 rounded-full mt-6 overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-4 font-medium uppercase tracking-widest">
                AI Analysis in Progress
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Upload Modal */}
        {isModalOpen && !uploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-xl p-8 md:p-10 border border-white/10 relative shadow-[0_0_80px_rgba(14,165,233,0.15)] bg-[#0B1121] overflow-hidden"
            >
              {/* Background Accent glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px]" />
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-2">Analyze Resume</h2>
              <p className="text-slate-400 mb-6 text-sm">Upload your resume and optionally provide a target Job Description to see how well you match.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">1. Paste Job Description (Optional)</label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description here..."
                    className="input-field w-full h-32 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">2. Upload Resume (PDF, DOCX)</label>
                  <label className={`w-full flex-col flex items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${selectedFile ? 'border-primary-500 bg-primary-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    <Upload className={`w-8 h-8 mb-3 ${selectedFile ? 'text-primary-500' : 'text-slate-400'}`} />
                    <p className={`font-bold ${selectedFile ? 'text-primary-400' : 'text-slate-300'}`}>
                      {selectedFile ? selectedFile.name : 'Click to select resume file'}
                    </p>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-slate-300 hover:text-white font-bold transition-colors">
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAnalyze} 
                    disabled={!selectedFile}
                    className={`btn-primary flex items-center gap-2 ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Analyze Now <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pt-36 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-extrabold leading-tight"
            >
              Your <span className="gradient-text">Resume Portfolio</span>
            </motion.h1>
            <p className="text-slate-400 max-w-xl">
              Track your career progression, visualize skill improvements, and gain AI-powered insights for every application.
            </p>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className={`btn-primary w-full md:w-auto flex items-center justify-center gap-2 pr-4 pl-5 ${uploading ? 'pointer-events-none opacity-70' : ''}`}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
            {uploading ? 'Analyzing...' : 'Analyze New Resume'}
          </motion.button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-card border-red-500/30 bg-red-500/10 p-4 text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchHistory} className="text-sm font-bold underline hover:text-red-300 transition-colors">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analytics Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chart Area */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 h-[400px] relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-bold leading-tight">Score Progression</h3>
                  <p className="text-sm text-slate-500">Visualization of your resume scores over time</p>
                </div>
                <div className="bg-primary-500/10 text-primary-400 px-4 py-2 sm:py-1 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-primary-500/20 self-start sm:self-center whitespace-nowrap">
                  Total Analyses: {history.length}
                </div>
              </div>
              
              <div className="h-[280px] w-full mt-4">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 100]} />
                      <Tooltip  
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#0ea5e9' }}
                        labelFormatter={(label, payload) => {
                          const item = payload[0]?.payload;
                          return item ? `${item.fullDate} at ${label}` : label;
                        }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                    <Sparkles className="w-12 h-12 opacity-20" />
                    <p>Analyze your first resume to see progress trends</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-card p-6 bg-gradient-to-br from-primary-600/10 to-transparent border-primary-500/20"
              >
                <p className="text-slate-400 text-sm font-medium">Average Score</p>
                <h4 className="text-3xl font-bold mt-1">
                  {history.length > 0 ? Math.round(history.reduce((a, b) => a + (b.analysis?.atsScore || 0), 0) / history.length) : 0}%
                </h4>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-card p-6 bg-gradient-to-br from-accent-600/10 to-transparent border-accent-500/20"
              >
                <p className="text-slate-400 text-sm font-medium">Skills Extracted</p>
                <h4 className="text-3xl font-bold mt-1">
                  {history.length > 0 ? (
                    (history[0].analysis?.skills?.technical?.length || 0) + 
                    (history[0].analysis?.skills?.soft?.length || 0)
                  ) : 0}
                </h4>
              </motion.div>
            </div>
          </div>

          {/* Sidebar - History List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold px-2">Recent Analyses</h3>
            <div className="space-y-3 overflow-y-auto max-h-[600px] lg:max-h-[550px] pr-2 custom-scrollbar relative">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="glass-card p-4 animate-pulse h-24" />
                ))
              ) : history.length === 0 ? (
                <div className="glass-card p-8 text-center text-slate-500">
                  <p>No history yet.</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ 
                      scale: 1.03, 
                      backgroundColor: "rgba(30, 41, 59, 0.5)",
                      boxShadow: "0 10px 40px -10px rgba(14, 165, 233, 0.2)",
                      borderColor: "rgba(14, 165, 233, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    key={item._id} 
                    className="glass-card p-4 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/analysis/${item._id}`, { state: { result: item.analysis, resume: item } })}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-primary-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm truncate max-w-[120px]">{item.fileName || 'Resume Analysis'}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`text-sm font-bold mr-1 ${item.analysis?.atsScore >= 80 ? 'text-green-400' : item.analysis?.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {item.analysis?.atsScore || 0}%
                        </div>
                        {item.fileUrl && (
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="View PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, id: item._id }); }}
                          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Remove Analysis"
        message="Are you sure you want to remove this record? This will permanently delete the analysis data."
        confirmText="Remove"
        type="danger"
      />
      </div>
    </>
  );
};

export default Dashboard;
