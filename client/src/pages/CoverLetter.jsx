import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Copy, Check, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { resumeAPI } from '../api';

const CoverLetter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCoverLetter = async () => {
      try {
        const { data } = await resumeAPI.generateCoverLetter(id);
        setCoverLetter(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate cover letter');
      } finally {
        setLoading(false);
      }
    };
    fetchCoverLetter();
  }, [id]);

  const handleCopy = () => {
    if (coverLetter?.coverLetter) {
      navigator.clipboard.writeText(coverLetter.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 bg-[#020617]">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.button 
          whileHover={{ x: -5 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 transition-transform" />
          Back to Analysis
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 border-accent-500/20 bg-gradient-to-br from-accent-600/5 to-transparent relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-600/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px]">
             {loading ? (
               <div className="flex flex-col items-center gap-4 text-accent-400">
                 <Loader2 className="w-12 h-12 animate-spin" />
                 <p className="font-medium animate-pulse">Drafting your tailored cover letter...</p>
                 <p className="text-xs text-slate-500">Our AI is analyzing your resume and the target job description.</p>
               </div>
             ) : error ? (
                <div className="flex flex-col items-center gap-4 text-red-400">
                  <AlertCircle className="w-12 h-12" />
                  <p className="font-medium">{error}</p>
                  <button onClick={() => window.location.reload()} className="btn-secondary mt-4">Try Again</button>
                </div>
             ) : (
                <div className="w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <FileText className="w-8 h-8 text-accent-400" /> Professional Cover Letter
                      </h1>
                      {coverLetter?.subject && (
                        <p className="text-sm text-slate-400">
                          <span className="font-bold text-slate-300">Suggested Subject:</span> {coverLetter.subject}
                        </p>
                      )}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="btn-secondary flex items-center gap-2 py-2.5 px-5"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Letter'}
                    </motion.button>
                  </div>

                  <div className="bg-slate-900/50 rounded-2xl p-8 md:p-10 border border-white/5 shadow-inner leading-relaxed overflow-y-auto">
                    {coverLetter?.coverLetter?.split('\n\n').map((para, i) => (
                      <p key={i} className="text-slate-300 mb-6 last:mb-0 md:text-lg">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CoverLetter;
