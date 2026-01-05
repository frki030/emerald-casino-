
import { Card, Rank, Suit, SlotSymbol } from './types';

export const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i);

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function getCardValue(rank: Rank): number {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank, value: getCardValue(rank) });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
}

/** 
 * Added SLOT_SYMBOLS for SlotsGame.tsx functionality
 */
export const SLOT_SYMBOLS: SlotSymbol[] = [
  { icon: 'diamond', value: 50, color: 'text-blue-400' },
  { icon: 'star', value: 20, color: 'text-yellow-400' },
  { icon: 'favorite', value: 15, color: 'text-red-400' },
  { icon: 'bolt', value: 10, color: 'text-orange-400' },
  { icon: 'eco', value: 5, color: 'text-green-400' },
  { icon: 'grade', value: 2, color: 'text-primary' },
];
