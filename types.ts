
export enum GameType {
  ROULETTE = 'ROULETTE',
  BLACKJACK = 'BLACKJACK',
  MINES = 'MINES',
  PLINKO = 'PLINKO',
  SLOTS = 'SLOTS',
  BACCARAT = 'BACCARAT'
}

export interface LiveBet {
  id: string;
  game: string;
  user: string;
  multiplier: string;
  payout: number;
  time: string;
}

export interface UserProfile {
  name: string;
  avatar: string | null;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string | null;
  status: 'online' | 'offline';
  lastGifted: number; // timestamp
  totalWagered: number;
}

export interface FriendRequest {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  reward: number;
  claimed: boolean;
  type: 'wager' | 'wins' | 'payout';
}

export interface AffiliateData {
  referralCode: string;
  totalReferrals: number;
  networkVolume: number;
  unclaimedCommission: number;
}

export interface ChatMessage {
  id: string;
  user: string;
  rank?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Mod';
  text: string;
  timestamp: number;
  isPlayer?: boolean;
  isRain?: boolean;
}

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface RouletteBet {
  type: 'straight' | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen' | 'column';
  value: string | number;
  amount: number;
}

/** 
 * Added for SlotsGame.tsx to define the structure of reel symbols
 */
export interface SlotSymbol {
  icon: string;
  value: number;
  color: string;
}

/** 
 * Added for BaccaratGame.tsx to define the structure of the betting state
 */
export interface BaccaratBet {
  player: number;
  banker: number;
  tie: number;
  pPair: number;
  bPair: number;
}
