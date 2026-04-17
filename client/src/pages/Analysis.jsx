import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { PolarArea } from 'react-chartjs-2';
import { 
  CheckCircle2, AlertCircle, Award, Target, ChevronLeft, 
  Download, Briefcase, Wand2, Loader2, FileText, 
  Zap, ArrowRight, Star, ShieldCheck, Sparkles, Layout,
  Eye, CornerDownRight, BarChart3
} from 'lucide-react';
import { resumeAPI } from '../api';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

ChartJS.register(
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Filler, 
  Tooltip, 
  Legend,
  ArcElement
);

const SectionHeader = ({ icon: Icon, title, subtitle, colorClass = "text-primary-400" }) => (
  <div className="flex items-start gap-4 mb-8">
    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
    </div>
  </div>
);

const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(Number(value));
    if (end === 0) {
      setCount(0);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = totalMiliseconds / end;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Analysis = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const [resumeData, setResumeData] = useState(location.state?.resume || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);

  const [rewritingIdx, setRewritingIdx] = useState(null);
  const [rewriteResults, setRewriteResults] = useState({});

  useEffect(() => {
    if (result?.atsScore >= 85) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [result]);

  useEffect(() => {
    if (!result && id) {
      fetchAnalysis();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const { data } = await resumeAPI.getById(id);
      if (data.success && data.resume) {
        setResult(data.resume.analysis);
        setResumeData(data.resume);
      } else {
        setError("Analysis not found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load analysis results");
    } finally {
      setLoading(false);
    }
  };

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

  const handleExport = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      let yPos = 20;
      const margin = 20;
      const maxTextWidth = pageWidth - margin * 2;

      const checkPageBreak = (neededHeight) => {
        if (yPos + neededHeight > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
      };

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 44, 79);
      pdf.text("AI CV Analysis Report", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const summaryText = result.overallAnalysis || "Detailed AI CV analysis highlighting strengths, weaknesses, and improvement areas.";
      const summaryLines = pdf.splitTextToSize(summaryText, maxTextWidth);
      pdf.text(summaryLines, margin, yPos);
      yPos += (summaryLines.length * 5) + 10;

      checkPageBreak(25);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Overall Score:", margin, yPos);
      pdf.setFontSize(16);
      pdf.setTextColor(30, 58, 138);
      pdf.text(`${result.atsScore} /100`, margin + 33, yPos);
      yPos += 6;

      const barWidth = maxTextWidth;
      pdf.setFillColor(235, 235, 235);
      pdf.roundedRect(margin, yPos, barWidth, 4, 3, 3, 'F');
      if (result.atsScore > 0) {
         const scoreWidth = (result.atsScore / 100) * barWidth;
         if (result.atsScore >= 80) pdf.setFillColor(52, 168, 83);
         else if (result.atsScore >= 50) pdf.setFillColor(251, 188, 5);
         else pdf.setFillColor(234, 67, 53);
         pdf.roundedRect(margin, yPos, scoreWidth, 4, 3, 3, 'F');
      }
      yPos += 10;

      const metricsText = `${result.jdMatchScore !== undefined ? `JD Match: ${result.jdMatchScore}%  |  ` : ''}Interview Prob: ${result.interviewProbability || Math.max(0, result.atsScore - 10)}%`;
      pdf.setFontSize(11);
      pdf.text(metricsText, margin, yPos);
      yPos += 12;

      const drawSection = (title, items, boxColor, textColor, isBullet = true) => {
        if (!items || items.length === 0) return;
        checkPageBreak(30);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(33, 44, 79);
        pdf.text(title, margin, yPos);
        yPos += 5;
        const boxPadding = 6;
        const itemSpacing = 5;
        const textIndent = isBullet ? 10 : 2;
        const wrapMaxWidth = maxTextWidth - boxPadding * 2 - textIndent;
        let totalLines = 0;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const parsedItems = items.map(item => {
            const lines = pdf.splitTextToSize(item, wrapMaxWidth + 5);
            totalLines += lines.length;
            return lines;
        });
        const boxHeight = boxPadding * 2 + (totalLines * 5) + ((items.length - 1) * itemSpacing);
        checkPageBreak(boxHeight + 10);
        pdf.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
        pdf.roundedRect(margin, yPos, maxTextWidth, boxHeight, 3, 3, 'F');
        let textY = yPos + boxPadding + 4;
        parsedItems.forEach(lines => {
             if (isBullet) {
                 pdf.setFontSize(18);
                 pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
                 pdf.text('•', margin + boxPadding + 2, textY + 1);
             }
             pdf.setFontSize(10);
             pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
             pdf.text(lines, margin + boxPadding + textIndent, textY);
             textY += (lines.length * 5) + itemSpacing;
        });
        yPos += boxHeight + 10;
      };

      const skills = [...(result.skills?.technical || []), ...(result.skills?.soft || [])];
      if (skills.length) drawSection("Core Competencies", [skills.join(', ')], [245, 247, 250], [50, 50, 50], false);
      
      if (result.missingSections?.length) drawSection("Essential Gaps (Missing Sections)", result.missingSections, [255, 244, 230], [204, 120, 0], true);
      
      if (result.jdInsights?.length) drawSection("Target Role Alignment (JD Insights)", result.jdInsights, [230, 244, 234], [29, 130, 60], true);
      
      const missingKeys = result.keywordGap?.filter(k => !k.found).map(k => k.keyword).join(', ');
      if (missingKeys) drawSection("Missing Keywords", [missingKeys], [252, 232, 230], [219, 68, 55], false);
      
      if (result.contentSuggestions?.length) drawSection("AI Content Recommendations", result.contentSuggestions, [232, 240, 254], [26, 115, 232], true);
      
      if (result.jobRoleSuggestions?.length) drawSection("Suggested Career Trajectory", [result.jobRoleSuggestions.join(' | ')], [240, 232, 254], [107, 33, 168], false);
      
      if (result.marketReadinessInsight) drawSection("Market Readiness Evaluation", [result.marketReadinessInsight], [235, 235, 235], [30, 30, 30], false);

      pdf.save(`Rezum-Report-${new Date().getTime()}.pdf`);
    } catch (error) {
       console.error('Export failed:', error);
       alert('Export failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] gap-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="text-slate-400 font-medium">Fetching analysis results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] gap-6 px-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
           <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">{error || "Analysis Not Found"}</h2>
          <p className="text-slate-400 max-w-md">This analysis record may have been deleted or you might not have permission to view it.</p>
        </div>
        <button 
          onClick={() => navigate('/history')}
          className="btn-primary"
        >
          Return to History
        </button>
      </div>
    );
  }

  const score = result.atsScore || 0;

  return (
    <div className="min-h-screen pt-40 pb-20 bg-[#030712] relative overflow-hidden selection:bg-primary-500/30">
      {/* Abstract Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group w-fit"
          >
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/20 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Back to Portfolio</span>
          </motion.button>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap gap-3"
          >
              {resumeData?.fileUrl && resumeData.fileUrl !== "deleted-for-privacy" && (
                <div className="flex gap-2">
                  <a 
                    href={resumeData.fileUrl.replace('/upload/', '/upload/fl_attachment/')}
                    download
                    className="btn-secondary flex items-center gap-2 py-2 px-5 font-bold border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400"
                  >
                    <Download className="w-4 h-4" /> Download Resume
                  </a>
                  <button onClick={handleExport} className="btn-secondary flex items-center gap-2 py-2 px-5 font-bold">
                    <Download className="w-4 h-4" /> Export Report
                  </button>
                </div>
              )}

          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
          {/* Main Left Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* HERO SCORE SECTION - Re-designed Score Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-morphism p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="space-y-10 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4 max-w-xl text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                           <ShieldCheck className="w-3.5 h-3.5" /> High Precision Analysis
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">Your Resume Is <span className="gradient-text">{score >= 80 ? 'Exceptional' : score >= 60 ? 'Strong' : 'Improving'}</span></h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                           {result.overallAnalysis || "We've meticulously analyzed your resume against modern ATS algorithms. Here's your path to landing more interviews."}
                        </p>
                    </div>
                    {/* Score Bubble */}
                    <div className="flex flex-col items-center md:items-end shrink-0">
                        <div className="text-[120px] font-black leading-none gradient-text opacity-90 drop-shadow-2xl">
                          <AnimatedCounter value={score} />
                        </div>
                        <div className="text-xs uppercase tracking-[0.4em] font-bold text-slate-500 -mt-2">ATS Score / 100</div>
                    </div>
                </div>

                {/* PRO PROGRESS BAR */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Readiness Level</span>
                        <span className="text-sm font-black text-white"><AnimatedCounter value={score} />%</span>
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${score}%` }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           className="h-full rounded-full relative overflow-hidden"
                           style={{ background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6, #d946ef)' }}
                        >
                            {/* Animated Shine Effect */}
                            <motion.div 
                               animate={{ x: ['100%', '-100%'] }}
                               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                               className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                            />
                        </motion.div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold px-1 uppercase tracking-tighter">
                        <span>Foundation</span>
                        <span>Competitive</span>
                        <span>Elite Talent</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary-500/30 transition-all group h-full flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary-400">JD Match</p>
                    <span className="text-2xl font-bold text-primary-400">
                      <AnimatedCounter value={result.jdMatchScore || 0} />%
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-all group h-full flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-accent-400">Interview Prob.</p>
                    <span className="text-2xl font-bold text-accent-400">{result.interviewProbability || Math.max(0, result.atsScore - 10)}%</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all group h-full flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-red-400">Missing Keys</p>
                    <span className="text-2xl font-bold text-red-500">{result.keywordGap?.filter(k => !k.found).length || 0}</span>
                    {result.keywordGap?.filter(k => !k.found).length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-snug line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {result.keywordGap.filter(k => !k.found).map(k => k.keyword).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-all group h-full flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-yellow-400">Essential Gaps</p>
                    <span className="text-2xl font-bold text-yellow-500">{result.missingSections?.length || 0}</span>
                    {result.missingSections?.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-snug line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {result.missingSections.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* JD Match Insights Section */}
            {result.jdInsights && result.jdInsights.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-8 md:p-10 border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-transparent relative overflow-hidden"
              >
                 <SectionHeader 
                  icon={Briefcase} 
                  title="Target Role Alignment"
                  subtitle="How well your profile matches the job requirements"
                  colorClass="text-primary-400"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.jdInsights.map((insight, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 p-5 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-primary-500/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-all">
                        <CheckCircle2 className="w-5 h-5 text-primary-400" />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Improvement Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-8"
              >
                <SectionHeader 
                  icon={Wand2} 
                  title="AI Recommendations"
                  subtitle="Data-driven changes for maximum impact"
                  colorClass="text-accent-400"
                />
                <div className="space-y-4">
                  {result.contentSuggestions?.map((sug, i) => (
                    <div key={i} className="group/item">
                      <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-500/30 hover:bg-white/[0.05] transition-all duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-300 italic group-hover/item:text-white transition-colors">"{sug}"</p>
                        </div>
                        <button 
                          onClick={() => handleRewriteBullet(sug, i)}
                          disabled={rewritingIdx === i}
                          className="p-2 rounded-lg bg-accent-500/10 text-accent-400 hover:bg-accent-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          {rewritingIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {rewriteResults[i] && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-3 pl-8 overflow-hidden"
                          >
                            <div className="p-4 rounded-2xl bg-accent-500/5 border border-accent-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3 h-3 text-accent-400" />
                                <p className="text-[10px] font-black text-accent-400 uppercase tracking-widest">Enhanced Result</p>
                              </div>
                              <p className="text-sm text-slate-200 font-medium leading-relaxed">{rewriteResults[i].improved}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-8"
              >
                <SectionHeader 
                  icon={CheckCircle2} 
                  title="CV Health Check"
                   subtitle="Structural and keyword benchmarks"
                />
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5" /> Essential Sections
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.missingSections?.map((sec, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                          {sec}
                        </span>
                      ))}
                      {!result.missingSections?.length && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Fully Structured</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Key Keyword Gaps
                    </p>
                    <div className="flex flex-wrap gap-2">
                    {result.keywordGap?.filter(k => !k.found).map((item, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-xs font-medium">
                        {item.keyword}
                      </span>
                    ))}
                    </div>
                  </div>

                  {/* New Quantification Meter */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end px-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Quantification
                      </p>
                      <span className="text-xs font-black text-white">
                        <AnimatedCounter value={result.quantificationScore || 0} />%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.quantificationScore || 0}%` }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Percentage of bullet points with measurable impact (%, $, #).
                    </p>
                  </div>

                  {/* New Verb Analysis */}
                  {result.verbAnalysis && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-yellow-500" /> Action Strength
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.verbAnalysis.weakVerbs?.map((v, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/5 border border-red-500/10">
                            <span className="text-[10px] font-bold text-red-400 line-through opacity-60">{v}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                            <span className="text-[10px] font-bold text-emerald-400">{result.verbAnalysis.strongAlternatives?.[i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 p-5 rounded-3xl bg-gradient-to-br from-primary-500/10 via-transparent to-transparent border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-primary-400">
                        <BarChart3 className="w-4 h-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Recruiter Intel</p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      "{result.marketReadinessInsight || "Your current structure is optimized for the high-impact scanning processes favored by Fortune 500 recruiters."}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-8"
            >
              <SectionHeader 
                icon={Award} 
                title="Skill Inventory"
                subtitle="Identified core competencies"
                colorClass="text-primary-400"
              />
              <div className="flex flex-wrap gap-2">
                {[...(result.skills?.technical || []), ...(result.skills?.soft || [])].map((skill, i) => (
                  <span key={i} className="px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-sm text-slate-300 hover:bg-primary-500/10 hover:border-primary-500/20 hover:text-primary-400 transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 bg-gradient-to-br from-primary-600/10 to-transparent"
            >
              <SectionHeader 
                icon={Target} 
                title="Career Path"
                subtitle="Optimized growth targets"
                colorClass="text-primary-400"
              />
              <div className="space-y-3">
                {result.jobRoleSuggestions?.map((role, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:bg-white/10 transition-all group">
                    <span className="text-sm font-medium text-slate-300">{role}</span>
                    <CornerDownRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-all" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-[2.5rem] bg-gradient-to-r from-primary-600 to-accent-600 text-white relative overflow-hidden shadow-2xl shadow-primary-500/20"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 fill-white text-white" />
                  <span className="text-xs font-black uppercase tracking-widest opacity-80">Pro Recommendation</span>
                </div>
                <h4 className="text-2xl font-bold mb-3">AI Cover Letter</h4>
                <p className="text-sm opacity-90 leading-relaxed mb-8">
                  Transform your {score}% score into a compelling narrative directed at your target roles.
                </p>
                <button 
                  onClick={() => navigate(`/cover-letter/${id}`)}
                  className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-3 text-sm shadow-xl shadow-black/10"
                >
                  Start Generator <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles className="w-32 h-32" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
