import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  X, 
  Minimize2, 
  ExternalLink,
  Youtube
} from 'lucide-react';

interface YouTubeControllerProps {
  currentQuery?: string;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function YouTubeController({
  currentQuery = 'Trending Music',
  onClose,
  onAction,
}: YouTubeControllerProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40 bg-zinc-950/95 border border-red-500/40 rounded-3xl p-4 shadow-[0_0_40px_rgba(239,68,68,0.3)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
            <Youtube className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">YouTube Voice Control</span>
            <span className="text-[10px] text-white/50 truncate max-w-[180px] block">
              {currentQuery}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAction('minimize')}
            title="Minimize YouTube"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close YouTube"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-4 py-2">
        {/* Rewind 10s */}
        <button
          onClick={() => onAction('backward_10s')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white active:scale-95 transition-transform"
        >
          <RotateCcw className="w-5 h-5 text-red-400" />
          <span className="text-[10px] font-bold text-white/70">-10s</span>
        </button>

        {/* Play / Pause Toggle */}
        <button
          onClick={() => {
            const next = !isPlaying;
            setIsPlaying(next);
            onAction(next ? 'play' : 'pause');
          }}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] active:scale-95 transition-transform"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Forward 10s */}
        <button
          onClick={() => onAction('forward_10s')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white active:scale-95 transition-transform"
        >
          <RotateCw className="w-5 h-5 text-red-400" />
          <span className="text-[10px] font-bold text-white/70">+10s</span>
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
        <span>Say "Play", "Pause", or "10s forward"</span>
        <button
          onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuery)}`, '_blank')}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium"
        >
          Open App <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
