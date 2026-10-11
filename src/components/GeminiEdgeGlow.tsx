import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface GeminiEdgeGlowProps {
  isActive: boolean;
  volume: number; // 0 to 1
  isSpeaking: boolean;
  activeTheme?: string;
}

export function GeminiEdgeGlow({
  isActive,
  volume,
  isSpeaking,
  activeTheme = '#00f0ff',
}: GeminiEdgeGlowProps) {
  if (!isActive) return null;

  const boost = Math.min(Math.max(volume * 1.5, isSpeaking ? 0.6 : 0.25), 1.0);
  const glowOpacity = 0.55 + boost * 0.45;
  const spread = 24 + boost * 36;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* 4-side perimeter glowing gradient frame (Google Gemini style) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: glowOpacity }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 ${spread}px ${spread / 2}px ${activeTheme}70, inset 0 0 100px 30px #7928ca50, inset 0 0 160px 50px #00f0ff30`,
        }}
      />

      {/* Top Animated Edge */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{
          background: 'linear-gradient(90deg, #00f0ff, #7928ca, #ff0080, #00f0ff)',
          backgroundSize: '200% 100%',
          boxShadow: `0 0 24px 8px ${activeTheme}, 0 0 40px 15px #7928ca`,
        }}
      />

      {/* Bottom Animated Edge */}
      <motion.div
        animate={{
          backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-0 left-0 right-0 h-1.5"
        style={{
          background: 'linear-gradient(90deg, #ff0080, #7928ca, #00f0ff, #ff0080)',
          backgroundSize: '200% 100%',
          boxShadow: `0 0 24px 8px ${activeTheme}, 0 0 40px 15px #ff0080`,
        }}
      />

      {/* Left Animated Edge */}
      <motion.div
        animate={{
          backgroundPosition: ['50% 0%', '50% 100%', '50% 0%'],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 bottom-0 left-0 w-1.5"
        style={{
          background: 'linear-gradient(180deg, #00f0ff, #ff0080, #7928ca, #00f0ff)',
          backgroundSize: '100% 200%',
          boxShadow: `0 0 24px 8px ${activeTheme}, 0 0 40px 15px #7928ca`,
        }}
      />

      {/* Right Animated Edge */}
      <motion.div
        animate={{
          backgroundPosition: ['50% 100%', '50% 0%', '50% 100%'],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 bottom-0 right-0 w-1.5"
        style={{
          background: 'linear-gradient(180deg, #7928ca, #00f0ff, #ff0080, #7928ca)',
          backgroundSize: '100% 200%',
          boxShadow: `0 0 24px 8px ${activeTheme}, 0 0 40px 15px #ff0080`,
        }}
      />

      {/* 4 Corner Flares */}
      <div
        className="absolute top-0 left-0 w-32 h-32 pointer-events-none rounded-br-full"
        style={{
          background: 'radial-gradient(circle at 0 0, rgba(0,240,255,0.45) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none rounded-bl-full"
        style={{
          background: 'radial-gradient(circle at 100% 0, rgba(121,40,202,0.45) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none rounded-tr-full"
        style={{
          background: 'radial-gradient(circle at 0 100%, rgba(255,0,128,0.45) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none rounded-tl-full"
        style={{
          background: 'radial-gradient(circle at 100% 100%, rgba(0,240,255,0.45) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
