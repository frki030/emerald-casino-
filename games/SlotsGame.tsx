
import React, { useState, useEffect } from 'react';
import { SLOT_SYMBOLS } from '../constants';
import { SlotSymbol } from '../types';
import { sounds } from '../utils/sounds';

interface SlotsGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onRecordResult: (game: string, multiplier: number, payout: number, wager: number) => void;
}

const SlotsGame: React.FC<SlotsGameProps> = ({ balance, onBalanceChange, onRecordResult }) => {
  const [reels, setReels] = useState<SlotSymbol[]>([SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [betAmount, setBetAmount] = useState(10);

  const spin = async () => {
    if (balance < betAmount || isSpinning) return;
    setIsSpinning(true);
    const wager = betAmount;
    onBalanceChange(-wager);
    setLastWin(0);
    sounds.hit();
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = [
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    ];
    setReels(result);
    let win = 0;
    if (result[0].icon === result[1].icon && result[1].icon === result[2].icon) {
      win = wager * result[0].value * 5;
      sounds.win();
    } else if (result[0].icon === result[1].icon || result[1].icon === result[2].icon) {
      win = Math.floor(wager * 1.5);
      sounds.deal();
    } else {
      sounds.lose();
    }
    onRecordResult('Slots', win / (wager || 1), win, wager);
    setLastWin(win);
    onBalanceChange(win);
    setIsSpinning(false);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 animate-in zoom-in duration-500">
      <div className="bg-[#1c3326] border border-[#2c4a38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative rounded-xl overflow-hidden bg-[#0a160e] border border-[#2c4a38] p-4 shadow-inner h-[200px]">
           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 z-20 pointer-events-none -translate-y-1/2"></div>
           <div className="grid grid-cols-3 gap-4 h-full relative z-10">
             {reels.map((reel, idx) => (
               <div key={idx} className="h-full bg-[#1c3326]/50 rounded-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
                 <div className={`flex flex-col items-center gap-12 transition-transform duration-500 ${isSpinning ? 'animate-slot-spin' : ''}`}>
                    {isSpinning ? (
                      [...SLOT_SYMBOLS, ...SLOT_SYMBOLS].map((s, i) => <span key={i} className={`material-symbols-outlined text-6xl opacity-40 ${s.color}`}>{s.icon}</span>)
                    ) : (
                      <span className={`material-symbols-outlined text-7xl md:text-8xl transition-all scale-110 ${reel.color}`}>{reel.icon}</span>
                    )}
                 </div>
               </div>
             ))}
           </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
           <DashItem label="Last Win" value={lastWin} highlight />
           <DashItem label="Bet" value={betAmount} />
        </div>
        <div className="mt-8 pt-6 border-t border-[#2c4a38] flex flex-col md:flex-row items-center gap-6">
           <div className="flex-1 flex flex-col gap-2 w-full">
             <input type="range" min="10" max="500" step="10" value={betAmount} onChange={(e) => { sounds.tick(); setBetAmount(Number(e.target.value)); }} className="w-full accent-primary h-2 bg-black/40 rounded-full appearance-none cursor-pointer" />
           </div>
           <button onClick={spin} disabled={isSpinning || balance < betAmount} className={`h-14 px-10 rounded-xl font-black text-lg uppercase flex items-center gap-2 transition-all ${isSpinning ? 'bg-gray-600' : 'bg-primary text-black'}`}>
              <span className={`material-symbols-outlined text-3xl ${isSpinning ? 'animate-spin' : ''}`}>refresh</span>
              {isSpinning ? 'Spinning' : 'Spin'}
           </button>
        </div>
      </div>
    </div>
  );
};

const DashItem: React.FC<{ label: string; value: string | number; suffix?: string; highlight?: boolean }> = ({ label, value, suffix, highlight }) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-black/20'}`}>
    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-primary' : 'text-gray-500'}`}>{label}</p>
    <span className={`text-2xl font-black ${highlight ? 'text-primary' : 'text-white'}`}>{value}</span>
  </div>
);

export default SlotsGame;
