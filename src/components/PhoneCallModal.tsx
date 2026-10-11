import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneCall, X, Delete, UserCheck } from 'lucide-react';

interface PhoneCallModalProps {
  onClose: () => void;
  onInitiateCall: (target: string) => void;
  initialTarget?: string;
}

export function PhoneCallModal({
  onClose,
  onInitiateCall,
  initialTarget = '',
}: PhoneCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialTarget);

  const handleDigit = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber.trim()) return;
    onInitiateCall(phoneNumber.trim());
    onClose();
  };

  const KEYPAD = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: '' },
    { num: '0', sub: '+' },
    { num: '#', sub: '' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative text-white"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Smart Phone Dialer</h3>
              <p className="text-[11px] text-white/50">Mahi Voice or Keypad Calling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Number Display */}
        <div className="mb-4">
          <div className="relative flex items-center justify-center min-h-[50px] bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter number or name..."
              className="w-full text-center text-2xl font-black tracking-wider text-emerald-300 bg-transparent focus:outline-none placeholder-white/20"
            />
            {phoneNumber && (
              <button
                onClick={handleDelete}
                className="absolute right-3 p-1 text-white/40 hover:text-white transition-colors"
              >
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {KEYPAD.map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => handleDigit(item.num)}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 flex flex-col items-center justify-center transition-colors active:scale-95"
            >
              <span className="text-xl font-bold text-white">{item.num}</span>
              {item.sub && (
                <span className="text-[9px] font-semibold text-white/40 tracking-wider">
                  {item.sub}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Contacts & Dial Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPhoneNumber('Mom')}
            className="px-3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            Mom
          </button>
          <button
            type="button"
            onClick={() => setPhoneNumber('Rahul')}
            className="px-3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            Rahul
          </button>
          <button
            type="button"
            onClick={handleCall}
            disabled={!phoneNumber.trim()}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            Call
          </button>
        </div>
      </motion.div>
    </div>
  );
}
