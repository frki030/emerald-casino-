import { GoogleGenAI } from "@google/genai";
import { ChatMessage, LiveBet } from "../types";

export interface BotResponse {
  botName: string;
  messages: string[];
  baseDelay: number;
}

const BOT_ARCHETYPES = [
  { 
    name: 'VoltStrike', 
    vibe: 'The Hype-Man',
    personality: 'Extremely energetic, uses uppercase for excitement, loves fire emojis, calls people "king" or "legend".' 
  },
  { 
    name: 'ShadowBet', 
    vibe: 'The Skeptic',
    personality: 'Low energy, skeptical, lowercase only, uses 💀 or 🤡 emojis, thinks everything is rigged but keeps playing.' 
  },
  { 
    name: 'NeonGamer', 
    vibe: 'The Chill One',
    personality: 'Relaxed, friendly, uses "idk" and "fr", talks about vibing, very casual texting style.' 
  }
];

export class SmartChatAI {
  private ai: GoogleGenAI;
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateResponse(
    userMessage: string,
    chatHistory: ChatMessage[],
    gameHistory: LiveBet[],
    userName: string
  ): Promise<BotResponse | null> {
    const now = Date.now();
    const lastInteraction = this.cooldowns.get('global') || 0;
    if (now - lastInteraction < 2000) return null; 
    this.cooldowns.set('global', now);

    const bot = BOT_ARCHETYPES[Math.floor(Math.random() * BOT_ARCHETYPES.length)];
    
    const recentMessages = chatHistory.slice(-8).map(m => `${m.user}: ${m.text}`).join('\n');
    const recentWins = gameHistory.slice(0, 3).map(h => `${h.game} (${h.multiplier})`).join(', ');
    
    const systemInstruction = `
      You are "${bot.name}", a casino player. 
      Vibe: ${bot.vibe}.
      Style: ${bot.personality}
      
      MOBILE TEXTING RULES:
      1. Short sentences only. Max 10-12 words per message.
      2. Use lowercase mostly (unless Hype-Man).
      3. Use "fr", "idk", "gg", "rn", "bet", "lfg", "bruh".
      4. No robotic formal phrasing. No periods at the ends of short texts.
      5. BURST EFFECT: You can return 1 or 2 separate short messages. 
      
      RESPONSE FORMAT: Return a JSON array of strings. 
      Example: ["yo u actually hit that?", "massive win fr 💀"]
      
      Context:
      Current Player: ${userName}
      Recent Wins: ${recentWins || 'none'}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Recent Chat:\n${recentMessages}\n\n${userName} says: "${userMessage}"`,
        config: {
          systemInstruction,
          temperature: 0.9,
          responseMimeType: "application/json"
        },
      });

      const text = response.text || '[]';
      let messages: string[] = [];
      try {
        messages = JSON.parse(text);
      } catch {
        messages = [text];
      }

      if (messages.length === 0) return null;

      return {
        botName: bot.name,
        messages: messages.slice(0, 2), // Max 2 for burst effect
        baseDelay: 1000 
      };
    } catch (error) {
      console.error('SmartChatAI Error:', error);
      return null;
    }
  }
}

export const smartChat = new SmartChatAI();