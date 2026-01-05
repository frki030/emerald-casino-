
import React, { useState } from 'react';
import { sounds } from '../utils/sounds';

interface MinesGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onRecordResult: (game: string, multiplier: number, payout: number, wager: number) => void;
}

const MinesGame: React.FC<MinesGameProps> = ({ balance, onBalanceChange, onRecordResult }) => {
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<('hidden' | 'gem' | 'mine')[]>(Array(25).fill('hidden'));
  const [mines, setMines] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver' | 'cashedOut'>('idle');
  const [multiplier, setMultiplier] = useState(1);
  const [activeWager, setActiveWager] = useState(0);

  const startGame = () => {
    if (balance < betAmount) return;
    sounds.hit();
    const mineLocations: number[] = [];
    while (mineLocations.length < mineCount) {
      const loc = Math.floor(Math.random() * 25);
      if (!mineLocations.includes(loc)) mineLocations.push(loc);
    }
    setMines(mineLocations);
    setGrid(Array(25).fill('hidden'));
    setGameState('playing');
    setMultiplier(1);
    setActiveWager(betAmount);
    onBalanceChange(-betAmount);
  };

  const calculateNextMultiplier = (currentRevealed: number) => {
    const base = 1 + (mineCount / 22);
    return parseFloat(Math.pow(base, currentRevealed + 1).toFixed(2));
  };

  const revealTile = (idx: number) => {
    if (gameState !== 'playing' || grid[idx] !== 'hidden') return;
    if (mines.includes(idx)) {
      sounds.lose();
      const newGrid = [...grid];
      mines.forEach(m => (newGrid[m] = 'mine'));
      setGrid(newGrid);
      setGameState('gameOver');
      onRecordResult('Mines', 0, 0, activeWager);
    } else {
      sounds.tick();
      const newGrid = [...grid];
      newGrid[idx] = 'gem';
      const revealedCount = newGrid.filter(t => t === 'gem').length;
      setMultiplier(calculateNextMultiplier(revealedCount));
      setGrid(newGrid);
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing') return;
    sounds.win();
    const win = Math.floor(activeWager * multiplier);
    onRecordResult('Mines', multiplier, win, activeWager);
    onBalanceChange(win);
    setGameState('cashedOut');
  };

  return (
    <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 animate-in slide-in-from-right-8 duration-700">
      <aside className="w-full lg:w-[380px] space-y-6">
        <div className="glass rounded-[40px] p-8 space-y-6">
          <div className="space-y-2">
            <input type="number" disabled={gameState === 'playing'} value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 text-white rounded-[20px] h-16 pl-6 pr-16 font-black italic text-xl" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setBetAmount(prev => Math.floor(prev/2))} className="bg-white/5 hover:bg-white/10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">1/2</button>
              <button onClick={() => setBetAmount(prev => prev*2)} className="bg-white/5 hover:bg-white/10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">2x</button>
            </div>
          </div>
          <div className="space-y-4">
             <input type="range" min="1" max="24" disabled={gameState === 'playing'} value={mineCount} onChange={(e) => setMineCount(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer" />
          </div>
          {gameState === 'playing' ? (
            <button onClick={cashOut} className="w-full h-20 bg-primary hover:bg-primary-dark text-white font-black rounded-[28px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 group transition-all">
              <span className="text-xl uppercase italic tracking-tighter">Cash Out</span>
              <div className="bg-white/10 px-4 py-1.5 rounded-full text-sm">{(activeWager * multiplier).toFixed(0)}</div>
            </button>
          ) : (
            <button onClick={startGame} className="w-full h-20 bg-white hover:bg-neutral-200 text-black font-black rounded-[28px] shadow-2xl flex items-center justify-center transition-all">
              <span className="text-xl uppercase italic tracking-tighter">Enter Minefield</span>
            </button>
          )}
        </div>
        <div className={`glass p-6 rounded-[32px] text-center border-2 transition-colors ${gameState === 'cashedOut' ? 'border-success/50 win-glow' : 'border-white/5'}`}>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Current Reward</span>
          <span className="text-3xl font-black italic tracking-tighter text-white">{multiplier.toFixed(2)}x</span>
        </div>
      </aside>
      <section className="flex-1 glass rounded-[48px] p-8 flex items-center justify-center relative overflow-hidden">
        <div className="grid grid-cols-5 gap-4 w-full max-w-[500px] aspect-square z-10">
          {grid.map((state, idx) => (
            <button key={idx} onClick={() => revealTile(idx)} disabled={gameState !== 'playing' || state !== 'hidden'} className={`w-full h-full rounded-[24px] flex items-center justify-center border-2 ${state === 'hidden' ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10' : state === 'gem' ? 'bg-success/20 border-success/40' : 'bg-red-500/20 border-red-500/40'}`}>
              {state === 'gem' && <span className="material-symbols-outlined text-success text-4xl">diamond</span>}
              {state === 'mine' && <span className="material-symbols-outlined text-red-500 text-4xl">bomb</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MinesGame;
