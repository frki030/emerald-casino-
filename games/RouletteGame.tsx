
import React, { useState, useMemo, useRef } from 'react';
import { RED_NUMBERS } from '../constants';
import { RouletteBet } from '../types';
import { sounds } from '../utils/sounds';

interface RouletteGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onRecordResult: (game: string, multiplier: number, payout: number, wager: number) => void;
}

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const RouletteGame: React.FC<RouletteGameProps> = ({ balance, onBalanceChange, onRecordResult }) => {
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [selectedChip, setSelectedChip] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const currentBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

  const groupedBets = useMemo(() => {
    const map = new Map<string, number>();
    bets.forEach(bet => {
      const key = `${bet.type}-${bet.value}`;
      map.set(key, (map.get(key) || 0) + bet.amount);
    });
    return map;
  }, [bets]);

  const placeBet = (type: RouletteBet['type'], value: string | number) => {
    if (isSpinning) return;
    if (balance < currentBetAmount + selectedChip) return;
    sounds.tick();
    setBets(prev => [...prev, { type, value, amount: selectedChip }]);
  };

  const removeLastBetAt = (type: RouletteBet['type'], value: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isSpinning) return;
    const lastIdx = [...bets].reverse().findIndex(b => b.type === type && b.value === value);
    if (lastIdx !== -1) {
      const actualIdx = bets.length - 1 - lastIdx;
      setBets(prev => prev.filter((_, i) => i !== actualIdx));
      sounds.tick();
    }
  };

  const clear = () => { if (!isSpinning) { setBets([]); sounds.tick(); } };

  const spin = async () => {
    if (currentBetAmount === 0 || isSpinning) return;
    
    setIsSpinning(true);
    const wager = currentBetAmount;
    onBalanceChange(-wager);
    setWinningNumber(null);
    setLastWin(null);
    sounds.hit();

    const result = Math.floor(Math.random() * 37);
    const sliceAngle = 360 / 37;
    const numberIndex = WHEEL_NUMBERS.indexOf(result);
    const extraSpins = 5; 
    const targetRotation = (extraSpins * 360) + (360 - (numberIndex * sliceAngle));
    const finalRotation = rotation + targetRotation;
    setRotation(finalRotation);

    await new Promise(resolve => setTimeout(resolve, 4000));

    setWinningNumber(result);
    setHistory(prev => [result, ...prev].slice(0, 8));

    let totalWin = 0;
    const isRed = RED_NUMBERS.includes(result);
    const isEven = result !== 0 && result % 2 === 0;
    const isOdd = result !== 0 && result % 2 !== 0;
    const isLow = result >= 1 && result <= 18;
    const isHigh = result >= 19 && result <= 36;
    const dozen = result === 0 ? 0 : Math.ceil(result / 12);

    bets.forEach(bet => {
      if (bet.type === 'straight' && bet.value === result) totalWin += bet.amount * 36;
      if (bet.type === 'red' && isRed) totalWin += bet.amount * 2;
      if (bet.type === 'black' && !isRed && result !== 0) totalWin += bet.amount * 2;
      if (bet.type === 'even' && isEven) totalWin += bet.amount * 2;
      if (bet.type === 'odd' && isOdd) totalWin += bet.amount * 2;
      if (bet.type === 'low' && isLow) totalWin += bet.amount * 2;
      if (bet.type === 'high' && isHigh) totalWin += bet.amount * 2;
      if (bet.type === 'dozen' && bet.value === dozen) totalWin += bet.amount * 3;
    });

    onRecordResult('Roulette', totalWin / (wager || 1), totalWin, wager);
    setLastWin(totalWin);
    setBets([]);
    setIsSpinning(false);
    
    if (totalWin > 0) sounds.win();
    else sounds.lose();
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-success text-black';
    return RED_NUMBERS.includes(num) ? 'bg-red-500 text-white' : 'bg-neutral-900 text-white';
  };

  return (
    <div className="w-full max-w-7xl flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 glass rounded-[40px] p-8 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-30" 
               style={{ backgroundImage: 'radial-gradient(circle at center, #8B5CF6 0%, transparent 70%)' }}></div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
            <div className="w-6 h-8 bg-gradient-to-b from-yellow-200 to-yellow-600 clip-path-triangle shadow-xl border-t border-white/20"></div>
          </div>
          <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center">
            <div className="w-full h-full transition-transform duration-[4000ms] ease-[cubic-bezier(0.15,0,0.15,1)]"
              style={{ transform: `rotate(${rotation}deg)` }}>
              <RouletteWheelSVG />
            </div>
            <div className="absolute size-24 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-900 to-black z-10 shadow-2xl border-[3px] border-white/10 flex items-center justify-center">
              <div className="size-16 rounded-full bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-600 shadow-inner flex items-center justify-center">
                <span className="material-symbols-outlined text-black font-black text-2xl">diamond</span>
              </div>
            </div>
          </div>
          <div className="mt-10 text-center w-full max-w-[280px]">
            <div className={`glass px-8 py-4 rounded-3xl transition-all border ${isSpinning ? 'border-primary/50' : 'border-white/5'}`}>
              {isSpinning ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Moment of Truth...</span>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress"></div>
                  </div>
                </div>
              ) : winningNumber !== null ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40 uppercase font-black text-[10px] tracking-widest">Result</span>
                  <div className={`size-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl animate-in zoom-in duration-500 ${getNumberColor(winningNumber)}`}>
                    {winningNumber}
                  </div>
                </div>
              ) : (
                <span className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px] italic">Awaiting Stakes</span>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-6">
             <StatCard label="Wagered" value={currentBetAmount} icon="toll" color="text-primary" />
             <StatCard label="Risk Multiplier" value="35.0x" icon="trending_up" color="text-success" />
             <StatCard label="Last Payout" value={lastWin || 0} icon="emoji_events" highlight={!!lastWin} color="text-primary" />
          </div>
          <div className="glass rounded-[40px] p-8 flex-1 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block mb-4">Board History</span>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {history.map((num, i) => (
                  <div key={i} className={`size-14 rounded-2xl flex items-center justify-center font-black text-xl border border-white/5 shadow-2xl shrink-0 transition-transform hover:scale-110 cursor-default ${getNumberColor(num)}`}>
                    {num}
                  </div>
                ))}
                {history.length === 0 && <span className="text-white/10 italic text-sm py-4">Floor history empty...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Board and Chips remain the same as previous implementation */}
      <div className="glass rounded-[48px] p-8 lg:p-12 overflow-x-auto border border-white/10">
        <div className="min-w-[1000px] flex flex-col gap-4">
           <div className="flex gap-4">
              <div className="w-24">
                <button onClick={() => placeBet('straight', 0)} className="w-full h-[232px] bg-success/10 hover:bg-success text-success hover:text-black font-black text-3xl rounded-[32px] border border-success/30 transition-all relative group overflow-hidden">
                  <span className="-rotate-90 block relative z-10">0</span>
                  <ChipOverlay amount={groupedBets.get('straight-0') || 0} />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-12 gap-3">
                {[3, 2, 1, 6, 5, 4, 9, 8, 7, 12, 11, 10, 15, 14, 13, 18, 17, 16, 21, 20, 19, 24, 23, 22, 27, 26, 25, 30, 29, 28, 33, 32, 31, 36, 35, 34].map(num => (
                  <BoardButton key={num} num={num} onClick={() => placeBet('straight', num)} onRemove={(e) => removeLastBetAt('straight', num, e)} amount={groupedBets.get(`straight-${num}`) || 0} />
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
             {[10, 50, 100, 500, 1000].map(val => (
               <Chip key={val} value={val} active={selectedChip === val} onClick={() => { sounds.tick(); setSelectedChip(val); }} />
             ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={clear} disabled={isSpinning} className="h-20 w-20 glass rounded-[28px] flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-3xl">delete_sweep</span></button>
          <button disabled={isSpinning || currentBetAmount === 0} onClick={spin} className={`h-20 px-16 rounded-[28px] text-xl font-black italic tracking-tighter flex items-center gap-5 transition-all shadow-2xl ${isSpinning || currentBetAmount === 0 ? 'bg-white/5 text-white/20' : 'bg-primary text-white shadow-primary/40 hover:-translate-y-2'}`}>
            {isSpinning ? <span className="material-symbols-outlined animate-spin text-3xl">refresh</span> : <span className="material-symbols-outlined text-4xl">play_circle</span>}
            <span>{isSpinning ? 'REELING...' : 'PLACE STAKES'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const RouletteWheelSVG: React.FC = () => {
  const sliceAngle = 360 / 37;
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#goldGradient)" />
      <circle cx="100" cy="100" r="94" fill="#0d0d0d" />
      {WHEEL_NUMBERS.map((num, i) => {
        const startAngle = i * sliceAngle - (sliceAngle / 2) - 90;
        const endAngle = (i + 1) * sliceAngle - (sliceAngle / 2) - 90;
        const x1 = 100 + 88 * Math.cos((startAngle * Math.PI) / 180);
        const y1 = 100 + 88 * Math.sin((startAngle * Math.PI) / 180);
        const x2 = 100 + 88 * Math.cos((endAngle * Math.PI) / 180);
        const y2 = 100 + 88 * Math.sin((endAngle * Math.PI) / 180);
        const color = num === 0 ? '#10B981' : RED_NUMBERS.includes(num) ? '#ef4444' : '#1a1a1a';
        const midAngle = (startAngle + endAngle) / 2;
        const tx = 100 + 78 * Math.cos((midAngle * Math.PI) / 180);
        const ty = 100 + 78 * Math.sin((midAngle * Math.PI) / 180);
        return (
          <g key={num}>
            <path d={`M 100 100 L ${x1} ${y1} A 88 88 0 0 1 ${x2} ${y2} Z`} fill={color} />
            <text x={tx} y={ty} fill="white" fontSize="6" fontWeight="900" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}>{num}</text>
          </g>
        );
      })}
    </svg>
  );
};

const BoardButton: React.FC<{ num: number; onClick: () => void; onRemove: (e: React.MouseEvent) => void; amount: number }> = ({ num, onClick, onRemove, amount }) => (
  <button onClick={onClick} onContextMenu={onRemove} className={`h-16 font-black text-xl rounded-2xl border border-white/5 transition-all relative flex items-center justify-center ${RED_NUMBERS.includes(num) ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-white/5 text-white/60 hover:bg-neutral-800 hover:text-white'}`}>
    <span className="relative z-10">{num}</span>
    <ChipOverlay amount={amount} />
  </button>
);

const ChipOverlay: React.FC<{ amount: number }> = ({ amount }) => {
  if (amount === 0) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-in zoom-in-50">
      <div className="size-11 rounded-full bg-primary border-2 border-dashed border-white/40 shadow-2xl flex items-center justify-center scale-110">
        <span className="text-[9px] font-black text-white">{amount >= 1000 ? `${(amount/1000).toFixed(1)}k` : amount}</span>
      </div>
    </div>
  );
};

const Chip: React.FC<{ value: number; active: boolean; onClick: () => void }> = ({ value, active, onClick }) => (
  <button onClick={onClick} className={`relative size-16 rounded-full glass flex items-center justify-center font-black text-sm transition-all shadow-xl ${active ? 'bg-primary border-primary border-4 scale-110 z-10' : 'text-white/40 opacity-80'}`}>
    {value}
    <div className="absolute inset-1.5 rounded-full border border-white/10 border-dashed"></div>
  </button>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: string; color: string; highlight?: boolean }> = ({ label, value, icon, color, highlight }) => (
  <div className={`glass p-6 rounded-[32px] relative overflow-hidden group border border-white/5 ${highlight ? 'win-glow border-success/30' : ''}`}>
    <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}><span className="material-symbols-outlined text-[100px]">{icon}</span></div>
    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1 block">{label}</span>
    <span className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</span>
  </div>
);

export default RouletteGame;
