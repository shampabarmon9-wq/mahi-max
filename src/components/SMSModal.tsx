import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, X, Phone, User, CheckCircle2, CornerDownLeft } from 'lucide-react';

interface SMSModalProps {
  onClose: () => void;
  onSendSMS: (recipient: string, message: string) => void;
  initialRecipient?: string;
  initialMessage?: string;
  isReplyMode?: boolean;
}

export function SMSModal({
  onClose,
  onSendSMS,
  initialRecipient = '',
  initialMessage = '',
  isReplyMode = false,
}: SMSModalProps) {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [message, setMessage] = useState(initialMessage);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = () => {
    if (!recipient.trim() || !message.trim()) return;
    onSendSMS(recipient.trim(), message.trim());
    setSentSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-zinc-950 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-white"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              {isReplyMode ? <CornerDownLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isReplyMode ? 'Reply to SMS' : 'Send SMS via Mahi'}
              </h3>
              <p className="text-xs text-white/50">Voice or manual text messaging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce mb-3" />
            <h4 className="text-lg font-bold text-white">SMS Sent Successfully</h4>
            <p className="text-xs text-white/60 mt-1">Dispatched to {recipient}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Recipient (Contact name or phone number)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Rahul, Pooja, or +919876543210"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                SMS Message Text
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message or say 'Mahi send SMS to [Name]'..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 text-sm text-white placeholder-white/30 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!recipient.trim() || !message.trim()}
                className="flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Send SMS
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
