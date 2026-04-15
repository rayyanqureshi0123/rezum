import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer as RechartsResponsiveContainer 
} from 'recharts';
import { 
  Chart as ChartJS, 
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Filler, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { PolarArea, Doughnut } from 'react-chartjs-2';
import { CheckCircle2, AlertCircle, Award, Target, ChevronLeft, Download, Briefcase, Wand2, Loader2, FileText, Copy, Check, X } from 'lucide-react';
import { resumeAPI } from '../api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

ChartJS.register(
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Filler, 
  Tooltip, 
  Legend,
  ArcElement
);

const Analysis = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const resumeData = location.state?.resume || null;

  // Bullet Rewrite State
  const [rewritingIdx, setRewritingIdx] = useState(null);
  const [rewriteResults, setRewriteResults] = useState({});

  const handleRewriteBullet = async (suggestion, index) => {
    setRewritingIdx(index);
    try {
      const { data } = await resumeAPI.rewriteBullet(suggestion, result.jobRoleSuggestions?.[0] || '');
      setRewriteResults(prev => ({ ...prev, [index]: data }));
    } catch (err) {
      setRewriteResults(prev => ({ ...prev, [index]: { error: 'Rewrite failed. Try again.' } }));
    } finally {
      setRewritingIdx(null);
    }
  };

  const handleGenerateCoverLetter = () => {
    navigate(`/cover-letter/${id}`);
  };

  const handleExport = async () => {
    const element = document.getElementById('analysis-report');
    if (!element) return;
    
    // Create a clone to export so we don't flash/mess up the real UI
    const clone = element.cloneNode(true);
    clone.id = 'export-clone';
    
    // Styles for the clone to ensure perfect desktop layout
    Object.assign(clone.style, {
      position: 'absolute',
      top: '-9999px',
      left: '0',
      width: '1280px',
      maxWidth: '1280px',
      margin: '0',
      padding: '40px',
      background: '#020617'
    });
    
    // Cleanup the clone from UI-only elements
    const elementsToHide = clone.querySelectorAll('.export-hide');
    elementsToHide.forEach(el => el.remove());
    
    // Fix Gradient Text in Clone
    const gradientTexts = clone.querySelectorAll('.gradient-text');
    gradientTexts.forEach(el => {
      el.style.background = 'none';
      el.style.webkitBackgroundClip = 'initial';
      el.style.color = '#8b5cf6';
    });

    document.body.appendChild(clone);
    window.scrollTo(0, 0);
    
    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
        width: 1280,
        height: clone.scrollHeight,
        windowWidth: 1280
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Rezum-AI-Analysis-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      document.body.removeChild(clone);
    }
  };

  if (!result) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Analysis Not Found</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const scoreData = {
    labels: ['Resume Score', 'Remaining'],
    datasets: [{
      data: [result.atsScore, 100 - result.atsScore],
      backgroundColor: ['#0ea5e9', '#1e293b'],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }]
  };

  const combinedSkills = [...(result.skills?.technical || []), ...(result.skills?.soft || [])];

  const skillData = combinedSkills.slice(0, 6).map((skill, index) => ({
    subject: skill,
    A: 80 + (index * 5) % 20,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 bg-[#020617]" id="analysis-report">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <motion.button 
          whileHover={{ x: -5 }}
          onClick={() => navigate('/dashboard')}
          className="export-hide flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-6"
        >
          <ChevronLeft className="w-5 h-5 transition-transform" />
          Back to Portfolio
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 flex flex-col md:flex-row items-center gap-12"
            >
              <div className="relative w-72 h-36">
                <Doughnut 
                  data={scoreData} 
                  options={{ 
                    plugins: { legend: { display: false }, tooltip: { enabled: false } }, 
                    cutout: '80%', 
                    circumference: 180,
                    rotation: -90,
                    maintainAspectRatio: false 
                  }} 
                />
                <div className="absolute bottom-0 left-0 right-0 w-full flex flex-col items-center justify-center pb-4 text-center pointer-events-none">
                  <span className="text-6xl font-black text-white leading-none block">{result.atsScore}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 block">Score</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-primary-500/10 text-primary-400 px-4 py-1 rounded-full text-sm font-bold border border-primary-500/20">
                  <Target className="w-4 h-4" /> AI Analysis Complete
                </div>
                <h2 className="text-3xl font-bold">Optimization Summary</h2>
                <p className="text-slate-400 leading-relaxed">
                  {result.overallAnalysis || "Based on our advanced AI parsing, your resume shows a strong alignment with industry standards. Focus on the key improvement areas highlighted to maximize your interview chances."}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExport} 
                    className="export-hide btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Report
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateCoverLetter}
                    className="export-hide btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    Write Cover Letter
                  </motion.button>
                  {resumeData?.fileUrl && resumeData.fileUrl !== "deleted-for-privacy" && (
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={resumeData.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="export-hide btn-secondary bg-white/5 border-white/10 flex items-center gap-2 transition-all font-bold text-sm whitespace-nowrap"
                    >
                      <Briefcase className="w-4 h-4 text-primary-400" />
                      View Uploaded Resume
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>

            {/* JD Match Compatibility Module */}
            {result.jdMatchScore !== undefined && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 md:p-8 bg-gradient-to-r from-primary-600/10 to-accent-600/10 border-primary-500/30 relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"></div>
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 relative flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                        <circle 
                          cx="64" cy="64" r="56" fill="none" 
                          stroke="#0ea5e9" strokeWidth="8"
                          strokeDasharray="351"
                          strokeDashoffset={351 - (351 * result.jdMatchScore) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="text-4xl font-black text-white">{result.jdMatchScore}<span className="text-base text-slate-400">%</span></span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-primary-400 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> JD Match
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl md:text-2xl font-bold">Target Role Alignment</h3>
                    <div className="space-y-3">
                      {(result.jdInsights || []).map((insight, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-accent-400 shrink-0" />
                          <p>{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Keyword Gap Heatmap */}
            {result.keywordGap && result.keywordGap.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-6 md:p-8"
              >
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-400" /> Keyword Gap Analysis
                </h3>
                <p className="text-sm text-slate-400 mb-6">Keywords extracted from the Job Description — see which ones your resume covers.</p>
                <div className="flex flex-wrap gap-3 w-full">
                  {result.keywordGap.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        item.found 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {item.found ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {item.keyword}
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center gap-6 mt-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Found in Resume</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Missing from Resume</span>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Key Skills */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-400" /> Professional Skills
                </h3>
                <div className="flex flex-wrap gap-2 mb-6 w-full">
                  {combinedSkills.map((skill, i) => (
                    <motion.span 
                      key={i} 
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-3 py-1.5 bg-slate-800 border border-white/5 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-primary-400 transition-colors cursor-default inline-block break-words"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
                {combinedSkills.length > 0 && (
                  <div className="mt-8 h-64 w-full">
                    <RechartsResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar
                          name="Skill Level"
                          dataKey="A"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </RechartsResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* Improvements */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-400" /> AI Suggestions
                </h3>
                <div className="space-y-4">
                  {(result.contentSuggestions || []).map((suggestion, i) => (
                    <div key={i} className="space-y-2">
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-primary-500/20 transition-all"
                      >
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-300 italic">"{suggestion}"</p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRewriteBullet(suggestion, i)} 
                          disabled={rewritingIdx === i}
                          className="export-hide shrink-0 p-2 text-accent-400 hover:bg-accent-500/10 rounded-lg transition-all"
                          title="Rewrite with AI"
                        >
                          {rewritingIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        </motion.button>
                      </motion.div>
                      {/* AI Rewrite Result */}
                      <AnimatePresence>
                        {rewriteResults[i] && !rewriteResults[i].error && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-5 p-4 bg-accent-500/5 rounded-xl border border-accent-500/20"
                          >
                            <p className="text-xs text-accent-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Wand2 className="w-3 h-3" /> AI-Improved (STAR Method)</p>
                            <p className="text-sm text-white font-medium">"{rewriteResults[i].improved}"</p>
                            <p className="text-xs text-slate-500 mt-2 italic">{rewriteResults[i].explanation}</p>
                          </motion.div>
                        )}
                        {rewriteResults[i]?.error && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-5 text-xs text-red-400">{rewriteResults[i].error}</motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* NEW: Missing Sections & Errors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6 border-red-500/20"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" /> Missing Sections
                </h3>
                <div className="flex flex-wrap gap-3">
                  {(result.missingSections || []).map((section, i) => (
                    <span key={i} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm font-bold whitespace-nowrap">
                      {section}
                    </span>
                  ))}
                  {(!result.missingSections || result.missingSections.length === 0) && <p className="text-slate-500 italic">None - Your structure is complete!</p>}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6 border-yellow-500/20"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-5 h-5" /> Formatting Warnings
                </h3>
                <div className="space-y-3">
                  {(result.errors || []).filter(e => typeof e === 'string').map((error, i) => (
                    <div key={i} className="text-sm text-slate-400 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                       <span className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" /> {error}
                    </div>
                  ))}
                  {(!result.errors || result.errors.length === 0) && <p className="text-slate-500 italic">No major formatting issues detected.</p>}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Sidebar - High Level Insight */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 border-accent-500/30 bg-gradient-to-br from-accent-600/5 to-transparent"
            >
              <h4 className="text-lg font-bold mb-4">Market Readiness</h4>
              <div className="h-64">
                <PolarArea 
                  data={{
                    labels: ['Format', 'Keywords', 'Quantifiable', 'Structure', 'Impact'],
                    datasets: [{
                      label: 'Rating',
                      data: [
                        result.sectionRatings?.format || 5,
                        result.sectionRatings?.keywords || 5,
                        result.sectionRatings?.quantifiable || 5,
                        result.sectionRatings?.structure || 5,
                        result.sectionRatings?.impact || 5,
                      ],
                      backgroundColor: [
                        'rgba(14, 165, 233, 0.5)',
                        'rgba(139, 92, 246, 0.5)',
                        'rgba(244, 63, 94, 0.5)',
                        'rgba(234, 179, 8, 0.5)',
                        'rgba(34, 197, 94, 0.5)',
                      ],
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    scales: { r: { grid: { color: '#ffffff10' }, ticks: { display: false } } },
                    plugins: { legend: { display: false } }
                  }}
                />
              </div>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                {result.marketReadinessInsight || `Your resume performs exceptionally well in **${
                  Object.entries(result.sectionRatings || {}).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Quantifiable Results'
                }**, which is a key priority for Fortune 500 recruiters.`}
              </p>
            </motion.div>

            {/* Career Path Suggestions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 border-primary-500/20"
            >
               <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Target className="w-5 h-5 text-primary-400" /> Career Path
               </h4>
               <div className="space-y-3">
                 {(result.jobRoleSuggestions || []).map((role, i) => (
                   <motion.div 
                     key={i} 
                     whileHover={{ x: 5 }}
                     className="p-3 bg-primary-500/5 rounded-xl border border-primary-500/10 text-sm hover:bg-primary-500/20 transition-colors"
                   >
                     {role}
                   </motion.div>
                 ))}
               </div>
            </motion.div>

             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               whileHover={{ scale: 1.02 }}
               className="glass-card p-6"
             >
                 <h4 className="text-lg font-bold mb-4">Interview Probability</h4>
                <div className="flex items-center justify-center p-8 bg-slate-900/50 rounded-2xl w-full">
                  <div className="text-6xl font-black text-[#8b5cf6] text-center w-full block">
                    {result.interviewProbability || Math.max(0, result.atsScore - 10)}%
                  </div>
                </div>
                <p className="text-xs text-center text-slate-500 mt-4 uppercase tracking-tighter w-full">Based on target role match</p>
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
