
import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/sounds';

interface PlinkoGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onRecordResult: (game: string, multiplier: number, payout: number, wager: number) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bet: number;
}

const ROWS = 12;
const PEG_RADIUS = 4;
const BALL_RADIUS = 6;
const GRAVITY = 0.25;
const FRICTION = 0.99;
const BOUNCE = 0.6;
const MULTIPLIERS = [15, 8, 4, 2, 0.5, 0.2, 0.2, 0.5, 2, 4, 8, 15];

const PlinkoGame: React.FC<PlinkoGameProps> = ({ balance, onBalanceChange, onRecordResult }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [betAmount, setBetAmount] = useState(100);
  const ballsRef = useRef<Ball[]>([]);
  const nextBallId = useRef(0);

  const dropBall = () => {
    if (balance < betAmount) return;
    onBalanceChange(-betAmount);
    sounds.tick();
    const newBall: Ball = {
      id: nextBallId.current++,
      x: 300 + (Math.random() - 0.5) * 10,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      bet: betAmount
    };
    ballsRef.current.push(newBall);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const spacing = 40;
      const startY = 80;
      ctx.fillStyle = '#2c5a3b';
      for (let i = 0; i < ROWS; i++) {
        const rowY = startY + i * spacing;
        const rowWidth = i * spacing;
        const startX = (width - rowWidth) / 2;
        for (let j = 0; j <= i; j++) {
          const pegX = startX + j * spacing;
          ctx.beginPath(); ctx.arc(pegX, rowY, PEG_RADIUS, 0, Math.PI * 2); ctx.fill();
        }
      }
      const bucketY = startY + ROWS * spacing;
      const bucketWidth = width / MULTIPLIERS.length;
      MULTIPLIERS.forEach((mult, i) => {
        const x = i * bucketWidth;
        const color = mult >= 2 ? '#13ec5b' : mult < 1 ? '#4b5563' : '#fbbf24';
        ctx.fillStyle = color + '22'; ctx.fillRect(x + 2, bucketY, bucketWidth - 4, 40);
        ctx.fillStyle = color; ctx.font = 'bold 12px Lexend'; ctx.textAlign = 'center'; ctx.fillText(`${mult}x`, x + bucketWidth / 2, bucketY + 25);
      });
      const nextBalls: Ball[] = [];
      ballsRef.current.forEach(ball => {
        ball.vy += GRAVITY; ball.vx *= FRICTION; ball.x += ball.vx; ball.y += ball.vy;
        for (let i = 0; i < ROWS; i++) {
          const rowY = startY + i * spacing; const rowWidth = i * spacing; const startX = (width - rowWidth) / 2;
          for (let j = 0; j <= i; j++) {
            const pegX = startX + j * spacing; const dx = ball.x - pegX; const dy = ball.y - rowY; const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < BALL_RADIUS + PEG_RADIUS) {
              sounds.tick(); const normalX = dx / dist; const normalY = dy / dist; const dot = ball.vx * normalX + ball.vy * normalY;
              ball.vx = (ball.vx - 2 * dot * normalX) * BOUNCE; ball.vy = (ball.vy - 2 * dot * normalY) * BOUNCE;
              ball.x = pegX + normalX * (BALL_RADIUS + PEG_RADIUS + 1); ball.y = rowY + normalY * (BALL_RADIUS + PEG_RADIUS + 1);
              ball.vx += (Math.random() - 0.5) * 1.5;
            }
          }
        }
        if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx *= -BOUNCE; }
        if (ball.x > width - BALL_RADIUS) { ball.x = width - BALL_RADIUS; ball.vx *= -BOUNCE; }
        if (ball.y > bucketY) {
          const bucketIndex = Math.floor(ball.x / bucketWidth);
          const multiplier = MULTIPLIERS[bucketIndex] || 0.2;
          const winAmount = Math.floor(ball.bet * multiplier);
          onRecordResult('Plinko', multiplier, winAmount, ball.bet);
          onBalanceChange(winAmount);
          if (multiplier >= 1) sounds.win(); else sounds.deal();
          return;
        }
        ctx.fillStyle = '#13ec5b'; ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
        nextBalls.push(ball);
      });
      ballsRef.current = nextBalls;
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700">
      <aside className="w-full lg:w-[300px] flex flex-col gap-6">
        <div className="bg-[#1c3325] rounded-2xl p-6 border border-[#23482f] shadow-2xl">
          <input type="number" value={betAmount} onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))} className="w-full bg-[#102216] border border-[#23482f] text-white rounded-lg h-12 pl-4 pr-12 font-black" />
          <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={() => setBetAmount(prev => Math.floor(prev/2))} className="bg-[#23482f] py-2 rounded font-bold uppercase">1/2</button><button onClick={() => setBetAmount(prev => prev*2)} className="bg-[#23482f] py-2 rounded font-bold uppercase">2x</button></div>
          <button onClick={dropBall} className="w-full h-16 bg-primary hover:bg-primary-dark text-black font-black rounded-xl mt-6">DROP BALL</button>
        </div>
      </aside>
      <section className="flex-1 bg-[#0a160e] rounded-3xl border border-[#23482f] p-4 flex flex-col items-center justify-center min-h-[600px]">
        <canvas ref={canvasRef} width={600} height={650} className="w-full max-w-[600px] aspect-[600/650]" />
      </section>
    </div>
  );
};

export default PlinkoGame;
