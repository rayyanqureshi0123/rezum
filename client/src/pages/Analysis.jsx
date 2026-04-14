import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { CheckCircle2, AlertCircle, Award, Target, ChevronLeft, Download, Briefcase } from 'lucide-react';
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

  const handleExport = async () => {
    const element = document.getElementById('analysis-report');
    if (!element) return;
    
    // Hide UI elements
    const exportBtn = element.querySelector('.btn-primary');
    const backBtn = element.querySelector('button');
    if (exportBtn) exportBtn.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    
    // Fix Gradient Text (html2canvas doesn't support background-clip: text)
    const gradientTexts = element.querySelectorAll('.gradient-text');
    gradientTexts.forEach(el => {
      el.style.background = 'none';
      el.style.webkitBackgroundClip = 'initial';
      el.style.color = '#8b5cf6'; // Solid primary color for export
    });
    
    // Force stable layout
    const originalStyle = element.getAttribute('style');
    element.style.width = '1200px';
    element.style.maxWidth = 'none';
    element.style.margin = '0';
    element.style.padding = '40px';
    
    window.scrollTo(0, 0);
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
        width: 1200
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create a PDF with CUSTOM dimensions matching the content (Single Long Page)
      const imgWidth = 210; // A4 Width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      pdf.save(`Rezum-AI-Analysis.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      // Restore styles
      if (originalStyle) {
        element.setAttribute('style', originalStyle);
      } else {
        element.removeAttribute('style');
      }
      gradientTexts.forEach(el => {
        el.style.background = '';
        el.style.webkitBackgroundClip = '';
        el.style.color = '';
      });
      if (exportBtn) exportBtn.style.display = 'flex';
      if (backBtn) backBtn.style.display = 'flex';
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
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 transition-transform" />
          Back to Portfolio
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-8">
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
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                  <span className="text-6xl font-black text-white leading-none">{result.atsScore}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 translate-y-1">Score</span>
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
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Report
                  </motion.button>
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
                <div className="flex flex-wrap gap-2 mb-6">
                  {combinedSkills.map((skill, i) => (
                    <motion.span 
                      key={i} 
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-3 py-1.5 bg-slate-800 border border-white/5 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-primary-400 transition-colors cursor-default"
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
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 5 }}
                      className="flex gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-primary-500/20 transition-all"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0" />
                      <p className="text-sm text-slate-300 italic">"{suggestion}"</p>
                    </motion.div>
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
                    <span key={i} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/10 text-sm font-bold">
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
                <div className="space-y-2">
                  {(result.errors || []).filter(e => typeof e === 'string').map((error, i) => (
                    <div key={i} className="text-sm text-slate-400 flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                       <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" /> {error}
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
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="flex items-center justify-center p-8 bg-slate-900/50 rounded-2xl"
               >
                 <div className="text-6xl font-black gradient-text">
                   {result.interviewProbability || Math.max(0, result.atsScore - 10)}%
                 </div>
               </motion.div>
               <p className="text-xs text-center text-slate-500 mt-4 uppercase tracking-tighter">Based on target role match</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
