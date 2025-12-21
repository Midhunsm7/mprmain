"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function LoadingAnimation() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-white flex items-center justify-center z-50"
      >
        <div className="relative w-[400px] h-[300px] mx-auto">
          {/* Video Loading Animation */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to spinner if video fails to load
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              const spinner = target.nextElementSibling as HTMLElement;
              if (spinner) spinner.style.display = 'flex';
            }}
          >
            <source src="/mpass.mp4" type="video/mp4" />
            <source src="/animations/loading.webm" type="video/webm" />
          </video>
          
          {/* Fallback Spinner (hidden by default) */}
          <div 
            className="absolute inset-0 hidden items-center justify-center"
            id="fallback-spinner"
          >
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20"></div>
              
              {/* Spinner */}
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
                
                {/* Inner logo/icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">MP</span>
                  </div>
                </div>
              </div>
              
              {/* Loading text */}
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                className="mt-8 text-center"
              >
                <p className="text-gray-600 font-medium">Loading...</p>
                <p className="text-gray-400 text-sm mt-1">Please wait</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}