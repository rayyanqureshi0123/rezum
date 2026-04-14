import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap, Shield, BarChart3, ChevronRight, Play } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white pt-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 -z-10 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.15),transparent_70%)]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary-500/20 text-primary-400 font-bold text-sm mb-8"
        >
          <Sparkles className="w-4 h-4" /> Powered by Gemini 1.5 Pro
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-8xl font-black font-display tracking-tight leading-[1.1] mb-8"
        >
          Get Your Resume <br />
          <span className="gradient-text">Recruiter-Ready</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
        >
          Rezum uses advanced AI to analyze your resume, scoring it against industry benchmarks and providing actionable insights to land you more interviews.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-6 mb-20"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/register" className="btn-primary py-4 px-10 text-lg flex items-center gap-2 shadow-2xl shadow-primary-500/40 w-full justify-center">
              Analyze Now <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }} 
            whileTap={{ scale: 0.95 }}
            className="btn-secondary py-4 px-10 text-lg flex items-center gap-2 justify-center"
          >
            <Play className="w-5 h-5 fill-current" /> Watch Demo
          </motion.button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative max-w-5xl w-full"
        >
          <div className="glass-card p-4 rounded-3xl border-white/5 shadow-[0_0_100px_rgba(14,165,233,0.1)]">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
              alt="Dashboard Preview" 
              className="rounded-2xl border border-white/10 opacity-80"
            />
          </div>
          {/* Floating Stats */}
          <div className="absolute top-1/2 -right-8 glass-card p-6 rounded-2xl border-accent-500/20 shadow-2xl hidden lg:block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500">Resume Score</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </div>
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
              icon: Brain, 
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
