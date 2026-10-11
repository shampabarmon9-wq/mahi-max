import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, X, AlertCircle } from 'lucide-react';

interface WhatsAppConfirmModalProps {
  recipient: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WhatsAppConfirmModal({
  recipient,
  message,
  onConfirm,
  onCancel,
}: WhatsAppConfirmModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 30 }}
      className="fixed inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] z-50 bg-zinc-950/95 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white">WhatsApp Confirmation</h3>
          <p className="text-xs text-emerald-400">"Yes sir, kya main isko bhej doon?"</p>
        </div>
      </div>

      <div className="py-3 space-y-2">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] font-bold uppercase text-white/50 block">Recipient</span>
          <span className="text-sm font-semibold text-white">{recipient || 'Contact'}</span>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] font-bold uppercase text-white/50 block">Message Content</span>
          <p className="text-sm text-white/90 whitespace-pre-wrap">{message || 'Hello!'}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <X className="w-4 h-4 text-red-400" />
          Cancel (Nahi)
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.6)] transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          Send (Haan Bhej Do)
        </button>
      </div>
    </motion.div>
  );
}
