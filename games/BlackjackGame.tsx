
import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { createDeck } from '../constants';
import { sounds } from '../utils/sounds';

interface BlackjackGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onRecordResult: (game: string, multiplier: number, payout: number, wager: number) => void;
}

type GameState = 'betting' | 'insurance' | 'playing' | 'dealerTurn' | 'gameOver';

const BlackjackGame: React.FC<BlackjackGameProps> = ({ balance, onBalanceChange, onRecordResult }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHands, setPlayerHands] = useState<Card[][]>([]);
  const [handBets, setHandBets] = useState<number[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [currentBet, setCurrentBet] = useState(100);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [results, setResults] = useState<{msg: string, win: number}[]>([]);

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const dealerScore = calculateScore(dealerHand);

  const deal = () => {
    if (balance < currentBet) return;
    sounds.deal();
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHands([pHand]);
    setHandBets([currentBet]);
    setDealerHand(dHand);
    setActiveHandIndex(0);
    setResults([]);
    setInsuranceBet(0);
    onBalanceChange(-currentBet);

    if (dHand[0].rank === 'A') {
      setGameState('insurance');
    } else {
      setGameState('playing');
      if (calculateScore(pHand) === 21) {
        setGameState('dealerTurn');
      }
    }
  };

  const hit = () => {
    if (gameState !== 'playing') return;
    sounds.hit();
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const currentHands = [...playerHands];
    currentHands[activeHandIndex] = [...currentHands[activeHandIndex], newCard];
    setPlayerHands(currentHands);
    setDeck(newDeck);
    if (calculateScore(currentHands[activeHandIndex]) >= 21) nextHand();
  };

  const stand = () => {
    if (gameState !== 'playing' && gameState !== 'insurance') return;
    sounds.stand();
    nextHand();
  };

  const doubleDown = () => {
    if (gameState !== 'playing') return;
    const bet = handBets[activeHandIndex];
    if (balance < bet) return;
    sounds.hit();
    onBalanceChange(-bet);
    const newBets = [...handBets];
    newBets[activeHandIndex] *= 2;
    setHandBets(newBets);
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const currentHands = [...playerHands];
    currentHands[activeHandIndex] = [...currentHands[activeHandIndex], newCard];
    setPlayerHands(currentHands);
    setDeck(newDeck);
    nextHand();
  };

  const nextHand = () => {
    if (activeHandIndex < playerHands.length - 1) setActiveHandIndex(activeHandIndex + 1);
    else setGameState('dealerTurn');
  };

  useEffect(() => {
    if (gameState === 'dealerTurn') {
      const playDealer = async () => {
        let currentDealerHand = [...dealerHand];
        let currentDeck = [...deck];
        while (calculateScore(currentDealerHand) < 17) {
          await new Promise(resolve => setTimeout(resolve, 800));
          sounds.deal();
          currentDealerHand.push(currentDeck.pop()!);
          setDealerHand([...currentDealerHand]);
          setDeck([...currentDeck]);
        }
        const dScore = calculateScore(currentDealerHand);
        const dealerHasBJ = currentDealerHand.length === 2 && dScore === 21;
        let insurancePayout = (dealerHasBJ && insuranceBet > 0) ? insuranceBet * 3 : 0;
        const finalResults = playerHands.map((hand, idx) => {
          const pScore = calculateScore(hand);
          const bet = handBets[idx];
          const isBJ = hand.length === 2 && pScore === 21;
          if (pScore > 21) return { msg: 'Bust', win: 0 };
          if (dealerHasBJ) return isBJ ? { msg: 'Push', win: bet } : { msg: 'Dealer BJ', win: 0 };
          if (isBJ) return { msg: 'Blackjack!', win: Math.floor(bet * 2.5) };
          if (dScore > 21) return { msg: 'Dealer Bust!', win: bet * 2 };
          if (dScore > pScore) return { msg: 'Dealer Wins', win: 0 };
          if (dScore < pScore) return { msg: 'You Win', win: bet * 2 };
          return { msg: 'Push', win: bet };
        });
        const totalWin = finalResults.reduce((sum, res) => sum + res.win, 0) + insurancePayout;
        const totalWager = handBets.reduce((a, b) => a + b, 0) + insuranceBet;
        setResults(finalResults);
        onRecordResult('Blackjack', totalWin / (totalWager || 1), totalWin, 0); // Bal already deducted during play
        onBalanceChange(totalWin);
        setGameState('gameOver');
        if (totalWin > totalWager) sounds.win(); else if (totalWin === 0) sounds.lose(); else sounds.stand();
      };
      playDealer();
    }
  }, [gameState]);

  return (
    <div className="w-full max-w-6xl flex flex-col items-center relative gap-4 animate-in slide-in-from-bottom-8 duration-700">
      <section className="flex flex-col items-center pt-4 pb-2 relative z-10 w-full">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center min-h-[140px]">
            {dealerHand.length > 0 && (
              <>
                <div className="absolute -left-16 flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Dealer</span>
                  <div className="size-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {gameState === 'playing' || gameState === 'insurance' ? '?' : dealerScore}
                  </div>
                </div>
                <div className="flex gap-3">
                  {dealerHand.map((card, idx) => (
                    <CardUI key={idx} card={card} hidden={(idx === 1 && (gameState === 'playing' || gameState === 'insurance'))} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <div className="min-h-[60px] flex items-center justify-center relative z-20">
        {gameState === 'gameOver' && results.length === 1 && (
          <div className="bg-black/80 text-primary px-8 py-2 rounded-xl border border-primary/30 backdrop-blur-md shadow-2xl animate-bounce italic font-black uppercase tracking-tight text-2xl">
            {results[0].msg}
          </div>
        )}
      </div>
      <section className="flex flex-col items-center pb-8 relative z-10 w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-12 items-start justify-center min-h-[220px] px-8">
          {playerHands.map((hand, idx) => {
            const score = calculateScore(hand);
            const isActive = gameState === 'playing' && activeHandIndex === idx;
            const result = results[idx];
            return (
              <div key={idx} className={`flex flex-col items-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-90 opacity-60'}`}>
                <div className="relative mb-4">
                   <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-black text-sm whitespace-nowrap shadow-xl border ${isActive ? 'bg-primary text-black border-primary' : 'bg-slate-800 text-white border-white/10'}`}>
                     {result ? result.msg : score}
                   </div>
                   <div className="flex -space-x-12">
                     {hand.map((card, cIdx) => (
                       <div key={cIdx} style={{ zIndex: cIdx, transform: `translateX(${cIdx * 1.5}rem)` }}><CardUI card={card} /></div>
                     ))}
                   </div>
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-yellow-500/50">
                      <div className="size-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs font-black text-white">{handBets[idx]}</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-full max-w-4xl bg-[#15281e]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-2xl mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-6 items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Base Bet</span>
                <div className="flex items-center gap-2"><div className="size-4 rounded-full bg-yellow-500"></div><span className="text-xl font-black text-white">{currentBet}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {gameState === 'betting' || gameState === 'gameOver' ? (
                <div className="flex items-center gap-3">
                   <div className="flex bg-black/30 p-1 rounded-full border border-white/5">
                      {[10, 50, 100, 500].map(val => (
                        <button key={val} onClick={() => { sounds.tick(); setCurrentBet(val); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentBet === val ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}>{val}</button>
                      ))}
                   </div>
                   <button onClick={deal} className="h-12 px-10 rounded-full bg-primary text-black hover:bg-green-400 transition-all font-black text-base uppercase tracking-wider">DEAL</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ActionButton label="Hit" onClick={hit} color="primary" />
                  <ActionButton label="Stand" onClick={stand} color="red" outline />
                  {gameState === 'playing' && playerHands[activeHandIndex].length === 2 && <ActionButton label="Double" onClick={doubleDown} color="yellow" outline />}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ActionButton: React.FC<{ label: string; onClick: () => void; color: 'primary' | 'red' | 'yellow' | 'blue'; outline?: boolean }> = ({ label, onClick, color, outline }) => {
  const colors = { primary: 'bg-primary text-black hover:bg-green-400', red: 'bg-red-500/10 text-red-400 border-red-500/50', yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50', blue: 'bg-blue-500/10 text-blue-400 border-blue-500/50' };
  return <button onClick={onClick} className={`h-11 px-6 rounded-full transition-all font-black text-xs uppercase tracking-widest border ${colors[color]}`}>{label}</button>;
};

const CardUI: React.FC<{ card: Card; hidden?: boolean }> = ({ card, hidden }) => {
  if (hidden) return <div className="w-24 h-36 rounded-lg bg-[#0e2a1a] border-[3px] border-emerald-800/50 flex items-center justify-center shadow-xl">Back</div>;
  const isRed = ['hearts', 'diamonds'].includes(card.suit);
  const suitIcon = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];
  return (
    <div className={`w-24 h-36 bg-white rounded-lg flex flex-col justify-between p-2 shadow-2xl ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
      <div className="text-xl font-black">{card.rank}</div>
      <div className="self-center text-5xl">{suitIcon}</div>
      <div className="self-end text-xl font-black rotate-180">{card.rank}</div>
    </div>
  );
};

export default BlackjackGame;
