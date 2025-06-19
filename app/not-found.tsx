'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const CuteEyes = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculateEyePosition = (eyeX: number, eyeY: number) => {
    const angle = Math.atan2(mousePosition.y - eyeY, mousePosition.x - eyeX);
    const distance = Math.min(8, Math.sqrt((mousePosition.x - eyeX) ** 2 + (mousePosition.y - eyeY) ** 2) / 10);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  };

  const leftEye = calculateEyePosition(window.innerWidth / 2 - 60, window.innerHeight / 2 - 20);
  const rightEye = calculateEyePosition(window.innerWidth / 2 + 60, window.innerHeight / 2 - 20);

  return (
    <div className="relative">
      {/* Left Eye */}
      <motion.div 
        className="absolute w-20 h-20 rounded-full border-4 border-foreground bg-foreground"
        style={{ left: -60, top: -20 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <motion.div 
          className="w-8 h-8 bg-background rounded-full absolute top-1/2 left-1/2"
          style={{ 
            transform: `translate(-50%, -50%) translate(${leftEye.x}px, ${leftEye.y}px)` 
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </motion.div>
      
      {/* Right Eye */}
      <motion.div 
        className="absolute w-20 h-20 rounded-full border-4 border-foreground bg-foreground"
        style={{ right: -60, top: -20 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
      >
        <motion.div 
          className="w-8 h-8 bg-background rounded-full absolute top-1/2 left-1/2"
          style={{ 
            transform: `translate(-50%, -50%) translate(${rightEye.x}px, ${rightEye.y}px)` 
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </motion.div>
    </div>
  );
};

const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-foreground/10 rounded-full"
      initial={{ 
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: 0 
      }}
      animate={{ 
        y: [null, -100, window.innerHeight + 100],
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        delay: Math.random() * 5,
        ease: "linear"
      }}
    />
  ));

  return <div className="fixed inset-0 pointer-events-none">{particles}</div>;
};

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
    >
      <FloatingParticles />
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      
      <div className="text-center z-10 px-4 max-w-2xl mx-auto">
        {/* Main 404 with cute face */}
        <div className="relative inline-block">
          <motion.h1 
            className="text-9xl md:text-[12rem] font-bold text-foreground relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              duration: 1 
            }}
          >
            4
            <motion.span
              className="inline-block"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              0
            </motion.span>
            4
          </motion.h1>
          
          <CuteEyes />
          
          {/* Cute mouth */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
          >
            <motion.svg 
              width="80" 
              height="40" 
              viewBox="0 0 80 40"
              animate={{ 
                scaleY: [1, 0.8, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <path 
                d="M20 20 Q40 35 60 20" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round"
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* Error message */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 space-y-6"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Oops! This page got lost in space
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Don&apos;t worry, even our AI models make mistakes sometimes. 
            Let&apos;s get you back to exploring amazing conversations!
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-12 space-y-4"
        >
          <div className="flex justify-center items-center">
            <Link href="/home">
              <motion.button 
                className="px-8 py-4 bg-primary text-primary-foreground font-medium rounded-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 flex items-center gap-3 hover:bg-primary/90"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-house-icon lucide-house">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                Take Me Home
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Cute floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                scale: 0 
              }}
              animate={{ 
                y: [null, -20, 0],
                scale: [0, 1, 0.8, 1],
                rotate: [0, 360]
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            >
              <div className="text-3xl md:text-4xl">
                {['✨', '🌟', '💫', '⭐', '🎭', '🎪'][i]}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 