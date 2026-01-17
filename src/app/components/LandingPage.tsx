'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Briefcase, GraduationCap, Mail, FileText, User } from 'lucide-react';
import ChatInterface from './ChatInterface';
import FluidBackground from './FluidBackground';
import LinkedInPosts from './LinkedInPosts';
import Image from 'next/image'; // Import next/image if using Next.js

export default function LandingPage() {
  const [showChat, setShowChat] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query.trim()) {
      setInitialQuery(query);
      setShowChat(true);
    }
  };

  const quickActions = [
    { icon: User, label: 'Me', action: () => handleQuickAction('Tell me about yourself') },
    { icon: Briefcase, label: 'Projects', action: () => handleQuickAction('Show me your projects') },
    { icon: GraduationCap, label: 'Skills', action: () => handleQuickAction('What are your skills?') },
    { icon: Mail, label: 'Contact', action: () => handleQuickAction('How can I contact you?') },
    { icon: FileText, label: 'Resume', action: () => handleQuickAction('Show me your resume') },
  ];

  const handleQuickAction = (query: string) => {
    setInitialQuery(query);
    setShowChat(true);
  };

  return (
    <>
      <FluidBackground />
      
      <AnimatePresence mode="wait">
        {!showChat ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 min-h-screen flex items-center justify-center px-4"
          >
            <div className="w-full max-w-4xl mx-auto text-center py-12">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <p className="text-gray-600 text-lg mb-2">
                  Hello there, old sport. The name's <span className="text-gray-900 font-medium">Yash Shah</span>
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent px-2">
                  AI/ML Engineer & Data Scientist
                </h1>
              </motion.div>

              {/* Avatar with Profile Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="my-12"
              >
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                  {/* Iridescent glow ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-70 blur-lg animate-pulse"></div>
                  
                  {/* Gradient border */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-1">
                    <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white/90 backdrop-blur-sm">
                      {/* Option 2: Fallback with initials */}
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-800">YS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Search Bar with Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mb-8"
              >
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto px-2">
                  <input
                    type="text"
                    name="search"
                    placeholder="What do you want to know, old sport?"
                    className="w-full px-5 py-3 sm:px-6 sm:py-4 pr-14 rounded-full bg-white/80 backdrop-blur-xl border border-gray-200/60 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all shadow-2xl text-base sm:text-lg"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center hover:scale-110 hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/30"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>

              {/* Improved Quick Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-wrap justify-center gap-3 sm:gap-6 px-4"
              >
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    onClick={action.action}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.08, 
                      y: -6,
                      rotate: [0, -2, 2, -2, 0]
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
                    
                    {/* Main button */}
                    <div className="relative w-full h-full rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/70 group-hover:border-purple-300/80 group-hover:bg-white/90 transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:shadow-purple-500/20 flex flex-col items-center justify-center">
                      
                      {/* Icon container with gradient background */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-2 sm:mb-3 group-hover:from-purple-600 group-hover:to-pink-500 transition-all duration-300 shadow-md">
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {action.label}
                      </span>
                      
                      {/* Subtle indicator dot */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* Subtle hint text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mt-12"
              >
                <p className="text-gray-500 text-sm italic">
                  Click any button above or type your question to begin...
                </p>
              </motion.div>

              {/* LinkedIn Posts Section */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.8 }}
              >
                <LinkedInPosts />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <ChatInterface initialQuery={initialQuery} onBack={() => setShowChat(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}