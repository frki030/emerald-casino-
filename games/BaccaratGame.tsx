import React, { useState, useEffect, useCallback } from 'react';
import { Card, BaccaratBet } from '../types';
import { createDeck } from '../constants';
import { sounds } from '../utils/sounds';

interface BaccaratGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onRecordResult: (game: string, multiplier: number, payout: number, wager: number) => void;
}

type RoundHistory = { winner: 'player' | 'banker' | 'tie'; pScore: number; bScore: number };

const BaccaratGame: React.FC<BaccaratGameProps> = ({ balance, onBalanceChange, onRecordResult }) => {
  const [pHand, setPHand] = useState<Card[]>([]);
  const [bHand, setBHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'dealing' | 'result'>('betting');
  const [currentBets, setCurrentBets] = useState<BaccaratBet>({ player: 0, banker: 0, tie: 0, pPair: 0, bPair: 0 });
  const [selectedChip, setSelectedChip] = useState(100);
  const [callerText, setCallerText] = useState('Place your bets');
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [squeezeMode, setSqueezeMode] = useState(false);

  const calculateScore = (hand: Card[]) => {
    const sum = hand.reduce((acc, card) => {
      if (['10', 'J', 'Q', 'K'].includes(card.rank)) return acc;
      if (card.rank === 'A') return acc + 1;
      return acc + parseInt(card.rank);
    }, 0);
    return sum % 10;
  };

  const getBaccaratWinner = useCallback((pScore: number, bScore: number) => {
    if (pScore > bScore) return 'player';
    if (bScore > pScore) return 'banker';
    return 'tie';
  }, []);

  const resetGame = () => {
    setPHand([]);
    setBHand([]);
    setCurrentBets({ player: 0, banker: 0, tie: 0, pPair: 0, bPair: 0 });
    setGameState('betting');
    setCallerText('Place your bets');
  };

  const placeBet = (zone: keyof BaccaratBet) => {
    if (gameState !== 'betting') return;
    if (balance < selectedChip) return;
    sounds.tick();
    setCurrentBets(prev => ({ ...prev, [zone]: (prev[zone] as number) + selectedChip }));
    onBalanceChange(-selectedChip);
  };

  const handleDeal = async () => {
    const totalWager = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
    if (totalWager === 0) return;
    
    setGameState('dealing');
    setCallerText('Dealing cards...');
    const newDeck = deck.length < 10 ? createDeck() : [...deck];
    
    const p1 = newDeck.pop()!;
    const b1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const b2 = newDeck.pop()!;

    // Initial 4 cards sequence with realistic slide animation
    sounds.deal();
    setPHand([p1]);
    await new Promise(r => setTimeout(r, 400));
    sounds.deal();
    setBHand([b1]);
    await new Promise(r => setTimeout(r, 400));
    sounds.deal();
    setPHand(prev => [...prev, p2]);
    await new Promise(r => setTimeout(r, 400));
    sounds.deal();
    setBHand(prev => [...prev, b2]);
    await new Promise(r => setTimeout(r, 1000));

    let playerHand = [p1, p2];
    let bankerHand = [b1, b2];
    let pScore = calculateScore(playerHand);
    let bScore = calculateScore(bankerHand);

    setCallerText(`${pScore} for Player, ${bScore} for Banker`);

    // Natural rules
    if (pScore >= 8 || bScore >= 8) {
      finishRound(playerHand, bankerHand, newDeck);
      return;
    }

    // Third card Player rule
    let p3: Card | null = null;
    if (pScore <= 5) {
      setCallerText('Player draws...');
      p3 = newDeck.pop()!;
      await new Promise(r => setTimeout(r, 800));
      sounds.deal();
      setPHand(prev => [...prev, p3!]);
      playerHand = [...playerHand, p3];
      pScore = calculateScore(playerHand);
      await new Promise(r => setTimeout(r, 1000));
    }

    // Third card Banker rule
    let b3: Card | null = null;
    const p3Value = p3 ? (['10', 'J', 'Q', 'K'].includes(p3.rank) ? 0 : p3.rank === 'A' ? 1 : parseInt(p3.rank)) : -1;

    let shouldBankerDraw = false;
    if (p3 === null) {
      if (bScore <= 5) shouldBankerDraw = true;
    } else {
      if (bScore <= 2) shouldBankerDraw = true;
      else if (bScore === 3 && p3Value !== 8) shouldBankerDraw = true;
      else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Value)) shouldBankerDraw = true;
      else if (bScore === 5 && [4, 5, 6, 7].includes(p3Value)) shouldBankerDraw = true;
      else if (bScore === 6 && [6, 7].includes(p3Value)) shouldBankerDraw = true;
    }

    if (shouldBankerDraw) {
      setCallerText('Banker draws...');
      b3 = newDeck.pop()!;
      await new Promise(r => setTimeout(r, 800));
      sounds.deal();
      setBHand(prev => [...prev, b3!]);
      bankerHand = [...bankerHand, b3];
      bScore = calculateScore(bankerHand);
      await new Promise(r => setTimeout(r, 1000));
    }

    finishRound(playerHand, bankerHand, newDeck);
  };

  const finishRound = (pFinal: Card[], bFinal: Card[], nextDeck: Card[]) => {
    const pScore = calculateScore(pFinal);
    const bScore = calculateScore(bFinal);
    const winner = getBaccaratWinner(pScore, bScore);
    
    setDeck(nextDeck);
    setGameState('result');
    const winnerName = winner === 'player' ? 'Player Wins!' : winner === 'banker' ? 'Banker Wins!' : 'Tie!';
    setCallerText(`${pScore} to ${bScore}. ${winnerName}`);
    
    // Payout logic
    let totalPayout = 0;
    const totalWager = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);

    if (winner === 'player') totalPayout += currentBets.player * 2;
    if (winner === 'banker') totalPayout += currentBets.banker * 1.95; 
    if (winner === 'tie') totalPayout += currentBets.tie * 9; 
    if (pFinal[0].rank === pFinal[1].rank) totalPayout += currentBets.pPair * 12;
    if (bFinal[0].rank === bFinal[1].rank) totalPayout += currentBets.bPair * 12;

    onBalanceChange(totalPayout);
    setHistory(prev => [{ winner, pScore, bScore }, ...prev].slice(0, 60));
    onRecordResult('Baccarat', totalPayout / (totalWager || 1), totalPayout, totalWager);
    
    if (totalPayout > 0) sounds.win();
    else sounds.lose();

    setTimeout(resetGame, 4500);
  };

  return (
    <div className="w-full max-w-7xl flex flex-col items-center gap-8 animate-in fade-in duration-700">
      {/* Table Area */}
      <div className="relative w-full aspect-[2/1] bg-[#07471e] rounded-[50%_50%_0_0] border-8 border-[#3d2b1f] shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/poker-table.png')] opacity-40"></div>
        
        {/* Card Shoe */}
        <div className="absolute top-10 right-20 w-32 h-44 bg-neutral-900 rounded-lg border-2 border-white/20 shadow-2xl flex flex-col items-center justify-center gap-2 rotate-12 z-20">
          <div className="w-24 h-32 bg-primary/20 rounded border border-primary/40 border-dashed flex items-center justify-center">
             <span className="material-symbols-outlined text-primary/40 text-4xl">playing_cards</span>
          </div>
          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Premium Shoe</span>
        </div>

        {/* Player & Banker Areas */}
        <div className="flex w-full justify-around mb-20 relative z-10">
          {/* Player Hand */}
          <div className="flex flex-col items-center gap-4">
             <div className="flex gap-2 min-h-[110px]">
                {pHand.map((c, i) => (
                  <div key={i} className="animate-deal"><CardUI card={c} squeeze={squeezeMode && i === pHand.length - 1} /></div>
                ))}
             </div>
             <div className="bg-blue-600/20 px-6 py-2 rounded-full border border-blue-400/50 backdrop-blur-md">
                <span className="text-xl font-black italic text-blue-400">{calculateScore(pHand)}</span>
                <span className="text-[10px] ml-2 text-white/60 font-black uppercase tracking-widest">Player</span>
             </div>
          </div>

          {/* Dealer's Voice Display */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-sm">
             <div className="glass px-10 py-5 rounded-[32px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-breathe backdrop-blur-2xl">
                <p className="text-xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">{callerText}</p>
             </div>
          </div>

          {/* Banker Hand */}
          <div className="flex flex-col items-center gap-4">
             <div className="flex gap-2 min-h-[110px]">
                {bHand.map((c, i) => (
                  <div key={i} className="animate-deal"><CardUI card={c} squeeze={squeezeMode && i === bHand.length - 1} /></div>
                ))}
             </div>
             <div className="bg-red-600/20 px-6 py-2 rounded-full border border-red-400/50 backdrop-blur-md">
                <span className="text-xl font-black italic text-red-400">{calculateScore(bHand)}</span>
                <span className="text-[10px] ml-2 text-white/60 font-black uppercase tracking-widest">Banker</span>
             </div>
          </div>
        </div>

        {/* Betting Zones */}
        <div className="flex gap-6 relative z-10 scale-90 lg:scale-100 transition-transform">
           <BetZone label="P PAIR" sub="11:1" active={currentBets.pPair > 0} amount={currentBets.pPair} color="blue" onClick={() => placeBet('pPair')} />
           <BetZone label="PLAYER" sub="1:1" active={currentBets.player > 0} amount={currentBets.player} color="blue" onClick={() => placeBet('player')} large />
           <BetZone label="TIE" sub="8:1" active={currentBets.tie > 0} amount={currentBets.tie} color="emerald" onClick={() => placeBet('tie')} />
           <BetZone label="BANKER" sub="0.95:1" active={currentBets.banker > 0} amount={currentBets.banker} color="red" onClick={() => placeBet('banker')} large />
           <BetZone label="B PAIR" sub="11:1" active={currentBets.bPair > 0} amount={currentBets.bPair} color="red" onClick={() => placeBet('bPair')} />
        </div>
      </div>

      {/* Control Area */}
      <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-8 pb-12">
        <div className="w-full xl:w-auto overflow-hidden">
          <Roadmap history={history} />
        </div>
        
        <div className="flex flex-col items-center xl:items-end gap-6 w-full xl:w-auto">
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {[10, 50, 100, 500, 1000].map(val => (
                <button 
                  key={val} 
                  onClick={() => { sounds.tick(); setSelectedChip(val); }} 
                  className={`size-16 rounded-full glass border-2 transition-all flex items-center justify-center font-black text-xs relative ${selectedChip === val ? 'bg-primary border-primary scale-110 shadow-lg z-10' : 'border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
                >
                  {val}
                  <div className="absolute inset-1.5 rounded-full border border-dashed border-white/10"></div>
                </button>
              ))}
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSqueezeMode(!squeezeMode)} 
                className={`px-6 h-16 rounded-2xl glass font-black uppercase italic text-[10px] tracking-widest transition-all ${squeezeMode ? 'text-primary border-primary/50 bg-primary/10' : 'text-white/40 border-white/10 hover:border-white/20'}`}
              >
                Squeeze Mode: {squeezeMode ? 'ON' : 'OFF'}
              </button>
              <button 
                disabled={gameState !== 'betting' || (Object.values(currentBets) as number[]).every(v => v === 0)} 
                onClick={handleDeal} 
                className={`px-16 h-16 rounded-2xl font-black italic uppercase tracking-tighter flex items-center gap-4 transition-all ${gameState !== 'betting' ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-white hover:-translate-y-1 shadow-xl shadow-primary/20 active:scale-95'}`}
              >
                <span className="material-symbols-outlined text-3xl">play_arrow</span>
                Deal Cards
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const CardUI: React.FC<{ card: Card; squeeze?: boolean }> = ({ card, squeeze }) => {
  const isRed = ['hearts', 'diamonds'].includes(card.suit);
  const suitIcon = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];
  
  return (
    <div className={`relative w-20 h-28 bg-white rounded-xl flex flex-col justify-between p-2 shadow-2xl transition-all duration-1000 ${isRed ? 'text-red-600' : 'text-slate-900'} ${squeeze ? 'skew-x-6 rotate-[12deg] -translate-y-2 origin-bottom-left shadow-primary/20' : ''}`}>
      <div className="text-sm font-black">{card.rank}</div>
      <div className="self-center text-4xl">{suitIcon}</div>
      <div className="self-end text-sm font-black rotate-180">{card.rank}</div>
      {squeeze && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-primary/10 rounded-xl pointer-events-none"></div>
      )}
    </div>
  );
};

const BetZone: React.FC<{ label: string; sub: string; active: boolean; amount: number; color: 'blue' | 'red' | 'emerald'; onClick: () => void; large?: boolean }> = ({ label, sub, active, amount, color, onClick, large }) => {
  const colorStyles = {
    blue: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    red: 'border-red-500/30 text-red-400 bg-red-500/5',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
  };

  return (
    <button onClick={onClick} className={`relative flex flex-col items-center justify-center rounded-[32px] border-2 transition-all group ${large ? 'w-48 h-36' : 'w-36 h-28'} ${active ? `bg-${color}-500/20 border-${color}-400 shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105` : `${colorStyles[color]} hover:bg-white/5`} active:scale-95`}>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-bold opacity-30 tracking-wider mt-1">{sub}</span>
      {amount > 0 && (
        <div className="absolute -top-4 -right-4 size-14 bg-primary rounded-full border-4 border-white/20 shadow-2xl flex items-center justify-center animate-in zoom-in-50 duration-500 z-20">
          <span className="text-[10px] font-black text-white">{amount >= 1000 ? `${(amount/1000).toFixed(1)}k` : amount}</span>
        </div>
      )}
      <div className="absolute inset-2 border border-dashed border-white/5 rounded-[24px] pointer-events-none"></div>
    </button>
  );
};

const Roadmap: React.FC<{ history: RoundHistory[] }> = ({ history }) => {
  const rows = 6;
  const cols = 12;
  const grid = Array.from({ length: cols }, () => Array(rows).fill(null));
  
  let currentCol = 0;
  let currentRow = 0;
  history.slice().reverse().forEach((round, i, arr) => {
    if (i > 0 && round.winner !== arr[i-1].winner && round.winner !== 'tie') {
      currentCol++;
      currentRow = 0;
    }
    if (grid[currentCol] && currentRow < rows) {
      grid[currentCol][currentRow] = round.winner;
      if (round.winner !== 'tie') currentRow++;
    }
  });

  return (
    <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4 shadow-inner max-w-full overflow-hidden">
       <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block">Bead Plate Road Map</span>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-blue-500"></div><span className="text-[8px] font-black uppercase text-white/30">Player</span></div>
             <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-red-500"></div><span className="text-[8px] font-black uppercase text-white/30">Banker</span></div>
          </div>
       </div>
       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {grid.map((col, x) => (
            <div key={x} className="flex flex-col gap-2 shrink-0">
               {col.map((winner, y) => (
                 <div key={y} className={`size-8 rounded-full border border-white/10 flex items-center justify-center transition-all ${winner === 'player' ? 'bg-blue-600/30 border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : winner === 'banker' ? 'bg-red-600/30 border-red-400/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : winner === 'tie' ? 'bg-emerald-600/30 border-emerald-400/40' : 'bg-white/5 opacity-20'}`}>
                    {winner && <div className={`size-3.5 rounded-full ${winner === 'player' ? 'bg-blue-400' : winner === 'banker' ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></div>}
                 </div>
               ))}
            </div>
          ))}
       </div>
    </div>
  );
};

export default BaccaratGame;