import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, Shield, BarChart3, ChevronRight, Play, History } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 -z-10 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.15),transparent_70%)]" />
        


        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight leading-[1.1] mb-8"
        >
          Get Your Resume <br className="hidden md:block" />
          <span className="gradient-text drop-shadow-[0_0_40px_rgba(14,165,233,0.3)]">Recruiter-Ready</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed font-light"
        >
          Rezum uses advanced AI to instantly analyze your resume, scoring it against industry benchmarks and providing actionable insights to land you more interviews.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-24 w-full sm:w-auto"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link to="/register" className="btn-primary py-4 px-10 text-lg flex items-center justify-center gap-2 shadow-2xl shadow-primary-500/30 w-full">
              Analyze Now <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link to="/history" className="btn-secondary py-4 px-10 text-lg flex items-center justify-center gap-3 w-full bg-white/5 border border-white/10 hover:bg-white/10">
              <History className="w-5 h-5 text-primary-400" />
              View Past Reports
            </Link>
          </motion.div>
        </motion.div>

        {/* Custom Mock Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative w-full max-w-5xl mx-auto"
        >
          <div className="glass-card p-4 md:p-6 rounded-3xl shadow-[0_0_80px_rgba(14,165,233,0.15)] bg-[#0B1121] border border-white/10 relative overflow-hidden">
            {/* Minimal Mockup Layout */}
            <div className="flex gap-6 h-[400px] md:h-[500px]">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col gap-4 w-64 border-r border-white/5 pr-6">
                <div className="h-8 w-24 bg-white/10 rounded-md mb-8"></div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 w-full bg-white/5 rounded-lg"></div>
                ))}
              </div>
              
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Header line */}
                <div className="flex justify-between items-center mb-4">
                  <div className="h-8 w-48 bg-white/10 rounded-md"></div>
                  <div className="h-10 w-32 bg-primary-500/20 rounded-xl border border-primary-500/30"></div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   <div className="h-32 bg-primary-600/10 rounded-2xl border border-primary-500/20 animate-pulse"></div>
                   <div className="h-32 bg-accent-600/10 rounded-2xl border border-accent-500/20"></div>
                   <div className="h-32 bg-slate-800/50 rounded-2xl border border-white/5 hidden md:block"></div>
                </div>

                {/* Graph Area */}
                <div className="flex-1 bg-slate-900/50 rounded-2xl border border-white/5 relative overflow-hidden p-6 mt-2">
                   <div className="h-full w-full opacity-30 flex items-end gap-2">
                     {[40, 60, 50, 80, 70, 95, 85].map((val, i) => (
                       <div key={i} className="flex-1 bg-gradient-to-t from-primary-600 to-transparent rounded-t-sm" style={{ height: `${val}%` }}></div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
            
            {/* Animated Scanning Line Effect overlaying the mockup */}
            <motion.div 
              animate={{ y: ["0%", "480px", "0%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-[2px] bg-primary-400 shadow-[0_0_15px_#38bdf8] opacity-70 z-10"
            />
          </div>

          {/* Floating UI Elements */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} 
            className="absolute -top-6 -right-6 lg:-right-12 glass-card p-6 flex items-center gap-4 border border-white/10 shadow-2xl backdrop-blur-2xl z-20 rounded-2xl"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">96</span>
            </div>
            <div className="text-left pr-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ATS Score</p>
              <p className="text-lg font-bold text-white leading-tight mt-1">Excellent Match</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: Zap, 
              title: "Instant Feedback", 
              desc: "Get an analysis in seconds, not hours. Our AI scans everything from keywords to structure.",
              color: "text-yellow-400"
            },
            { 
              icon: Shield, 
              title: "Privacy First", 
              desc: "Your data is encrypted and secure. We never share your personal information with third parties.",
              color: "text-green-400"
            },
            { 
              icon: Sparkles, 
              title: "Strategic Insights", 
              desc: "Receive actionable tips on how to improve your bullet points for specific job roles.",
              color: "text-primary-400"
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-card p-8 group border-white/5 cursor-pointer"
            >
              <div className={`w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
