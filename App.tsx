import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameType, LiveBet, Challenge, AffiliateData, ChatMessage, UserProfile, Friend, FriendRequest } from './types';
import RouletteGame from './games/RouletteGame';
import BlackjackGame from './games/BlackjackGame';
import MinesGame from './games/MinesGame';
import PlinkoGame from './games/PlinkoGame';
import { sounds } from './utils/sounds';
import { smartChat } from './utils/aiChat';

// --- COMPONENTS ---

const Odometer: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 1200; 
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const currentVal = Math.floor(startValue + (endValue - startValue) * easeOutExpo(progress));
      
      setDisplayValue(currentVal);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; icon: string }> = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="glass w-full max-w-2xl rounded-[40px] overflow-hidden relative z-10 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">{title}</h2>
          </div>
          <button onClick={onClose} className="size-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

const Lobby: React.FC<{ 
  onSelect: (g: GameType) => void; 
  history: LiveBet[];
}> = ({ onSelect, history }) => {
  const [jackpot, setJackpot] = useState(1248590);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(p => p + Math.floor(Math.random() * 10));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="relative w-full h-[380px] rounded-[48px] overflow-hidden bg-gradient-to-br from-primary-dark via-obsidian to-black group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center px-12 space-y-6 max-w-2xl">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-widest">Premium Suite</span>
             <div className="flex items-center gap-2 text-success font-bold text-xs">
                <span className="material-symbols-outlined text-sm animate-pulse">verified</span>
                PROVABLY FAIR
             </div>
          </div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
            EMERALD <br/> <span className="text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">ORIGINALS</span>
          </h2>
          <p className="text-white/60 text-lg font-medium leading-relaxed">
            The standard in luxury virtual gaming. High multipliers, <br/> lightning-fast response, and immersive feedback.
          </p>
          <div className="flex gap-4 items-center">
            <button onClick={() => onSelect(GameType.PLINKO)} className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-lg rounded-2xl animate-breathe hover:scale-105 transition-transform shadow-2xl">
              PLAY NOW
            </button>
            <div className="glass px-6 py-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Current Jackpot</span>
              <span className="text-xl font-black text-white text-center"><Odometer value={jackpot} /> CR</span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Gaming Floor</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <GameCard title="Mines" type={GameType.MINES} icon="bomb" badge="HOT" onSelect={onSelect} color="from-orange-500/20" />
          <GameCard title="Plinko" type={GameType.PLINKO} icon="grid_view" badge="NEW" onSelect={onSelect} color="from-primary/20" />
          <GameCard title="Roulette" type={GameType.ROULETTE} icon="radio_button_checked" onSelect={onSelect} color="from-success/20" />
          <GameCard title="Blackjack" type={GameType.BLACKJACK} icon="style" onSelect={onSelect} color="from-blue-500/20" />
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="size-3 rounded-full bg-success animate-pulse"></div>
             <h3 className="text-xl font-black uppercase italic tracking-tighter">Your Session Activity</h3>
          </div>
          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Real-time tracking enabled</span>
        </div>
        <div className="glass rounded-[32px] overflow-hidden border border-white/5">
          {history.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  <th className="px-8 py-5">Game</th>
                  <th className="px-8 py-5">Result</th>
                  <th className="px-8 py-5">Multiplier</th>
                  <th className="px-8 py-5 text-right">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((bet) => (
                  <tr key={bet.id} className="group hover:bg-white/[0.02] transition-colors animate-row">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">{bet.game[0]}</div>
                        <span className="text-sm font-bold uppercase tracking-tighter italic">{bet.game}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4"><span className={`text-xs font-black uppercase tracking-widest ${bet.payout > 0 ? 'text-success' : 'text-white/20'}`}>{bet.payout > 0 ? 'WIN' : 'LOSS'}</span></td>
                    <td className="px-8 py-4"><span className={`text-sm font-black ${bet.payout > 0 ? 'text-success' : 'text-white/20'}`}>{bet.multiplier}</span></td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <span className={`text-sm font-black italic ${bet.payout > 0 ? 'text-white' : 'text-white/20'}`}>{bet.payout.toLocaleString()}</span>
                         <span className="text-[10px] font-black text-primary">CR</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <span className="material-symbols-outlined text-white/5 text-8xl">receipt_long</span>
              <p className="text-white/40 font-black uppercase italic tracking-widest">No Bets Recorded</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const GameCard: React.FC<{ title: string; type: GameType; icon: string; badge?: string; onSelect: (t: GameType) => void; color: string }> = ({ title, type, icon, badge, onSelect, color }) => (
  <div onClick={() => onSelect(type)} className="glass glass-hover rounded-[32px] p-6 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group aspect-square border border-white/5 bg-obsidian">
    <div className={`absolute inset-0 bg-gradient-to-br ${color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    {badge && <span className="absolute top-4 right-4 bg-primary text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-10 shadow-lg">{badge}</span>}
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="size-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <span className="text-lg font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{title}</span>
    </div>
  </div>
);

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('emerald_balance')) || 10000);
  const [totalWagered, setTotalWagered] = useState(() => Number(localStorage.getItem('emerald_wagered')) || 0);
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [realHistory, setRealHistory] = useState<LiveBet[]>([]);
  const [activeModal, setActiveModal] = useState<'challenges' | 'vip' | 'affiliates' | 'support' | 'settings' | 'social' | null>(null);
  const [lastReload, setLastReload] = useState(() => Number(localStorage.getItem('emerald_last_reload')) || 0);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('emerald_profile');
    return saved ? JSON.parse(saved) : { name: 'Emerald_Elite', avatar: null };
  });
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('emerald_friends');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>(() => {
    const saved = localStorage.getItem('emerald_friend_requests');
    return saved ? JSON.parse(saved) : [];
  });
  const [socialSearch, setSocialSearch] = useState('');
  const [spectating, setSpectating] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('emerald_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [chatInput, setChatInput] = useState('');
  const [botTyping, setBotTyping] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const saved = localStorage.getItem('emerald_challenges');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'High Roller', description: 'Wager 5,000 credits', goal: 5000, current: 0, reward: 500, claimed: false, type: 'wager' },
      { id: '2', title: 'Lucky Streak', description: 'Win 10 rounds', goal: 10, current: 0, reward: 250, claimed: false, type: 'wins' },
      { id: '3', title: 'Jackpot Chaser', description: 'Win 1,000 in a single round', goal: 1000, current: 0, reward: 1000, claimed: false, type: 'payout' }
    ];
  });

  const [affiliateData, setAffiliateData] = useState<AffiliateData>(() => {
    const saved = localStorage.getItem('emerald_affiliates');
    return saved ? JSON.parse(saved) : {
      referralCode: 'VAULTHUNTER-' + Math.random().toString(36).substring(7).toUpperCase(),
      totalReferrals: Math.floor(Math.random() * 50) + 12,
      networkVolume: Math.floor(Math.random() * 100000) + 50000,
      unclaimedCommission: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('emerald_balance', balance.toString());
    localStorage.setItem('emerald_wagered', totalWagered.toString());
    localStorage.setItem('emerald_challenges', JSON.stringify(challenges));
    localStorage.setItem('emerald_affiliates', JSON.stringify(affiliateData));
    localStorage.setItem('emerald_last_reload', lastReload.toString());
    localStorage.setItem('emerald_chat', JSON.stringify(chatMessages.slice(-50)));
    localStorage.setItem('emerald_profile', JSON.stringify(userProfile));
    localStorage.setItem('emerald_friends', JSON.stringify(friends));
    localStorage.setItem('emerald_friend_requests', JSON.stringify(pendingRequests));
  }, [balance, totalWagered, challenges, affiliateData, lastReload, chatMessages, userProfile, friends, pendingRequests]);

  const addChatMessage = useCallback((msg: Partial<ChatMessage>) => {
    setChatMessages(prev => {
      const newMessage: ChatMessage = {
        id: Math.random().toString(36),
        user: msg.user || 'Unknown',
        text: msg.text || '',
        timestamp: Date.now(),
        rank: msg.rank,
        isPlayer: msg.isPlayer,
        isRain: msg.isRain
      };
      return [...prev, newMessage].slice(-100);
    });
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const handleSmartChatAI = async (text: string) => {
    const aiResponse = await smartChat.generateResponse(
      text,
      chatMessages,
      realHistory,
      userProfile.name
    );

    if (aiResponse) {
      let cumulativeDelay = 0;
      for (const msg of aiResponse.messages) {
        const typingDelay = (msg.length * 50) + 1000;
        setTimeout(() => {
          setBotTyping(aiResponse.botName);
          setTimeout(() => {
            addChatMessage({
              user: aiResponse.botName,
              text: msg,
              rank: 'Bronze'
            });
            setBotTyping(null);
          }, typingDelay);
        }, cumulativeDelay);
        cumulativeDelay += typingDelay + 800;
      }
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    addChatMessage({
      user: userProfile.name,
      text: text,
      isPlayer: true
    });
    setChatInput('');
    handleSmartChatAI(text);
  };

  const recordGameResult = (game: string, multiplier: number, payout: number, wager: number) => {
    const newBet: LiveBet = {
      id: Math.random().toString(36),
      game,
      user: userProfile.name,
      multiplier: multiplier.toFixed(2) + 'x',
      payout,
      time: 'Just now'
    };
    setRealHistory(prev => [newBet, ...prev.slice(0, 19)]);
    setTotalWagered(prev => prev + wager);
    setBalance(prev => prev + payout);

    setChallenges(prev => prev.map(ch => {
      if (ch.claimed) return ch;
      let newCurrent = ch.current;
      if (ch.type === 'wager') newCurrent += wager;
      if (ch.type === 'wins' && payout > wager) newCurrent += 1;
      if (ch.type === 'payout') newCurrent = Math.max(newCurrent, payout);
      return { ...ch, current: Math.min(newCurrent, ch.goal) };
    }));
  };

  const updateBalance = (amount: number) => setBalance(prev => prev + amount);

  const saveProfile = () => {
    if (!tempProfile.name.trim()) return;
    setUserProfile(tempProfile);
    setSaveSuccess(true);
    sounds.win();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempProfile(prev => ({ ...prev, avatar: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const giftFriend = (id: string) => {
    if (balance < 1000) {
      addChatMessage({ user: 'SYSTEM', text: 'Insufficient balance to gift! ⚠️' });
      return;
    }
    updateBalance(-1000);
    setFriends(prev => prev.map(f => f.id === id ? { ...f, lastGifted: Date.now() } : f));
    sounds.win();
    addChatMessage({ user: 'SYSTEM', text: `Sent a 1,000 CR gift to a friend! 🎁` });
  };

  return (
    <div className="min-h-screen flex bg-background font-display text-white selection:bg-primary/30 overflow-x-hidden">
      
      {spectating && (
        <div className="fixed inset-0 z-[300] bg-background/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="glass px-8 py-4 rounded-3xl border border-primary/40 flex flex-col items-center gap-2 animate-in zoom-in duration-300">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary animate-spin">visibility</span>
               <span className="font-black uppercase italic tracking-tighter">Spectating @{spectating}</span>
             </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`fixed h-screen top-0 left-0 glass z-[150] border-r border-white/5 transition-all duration-500 flex flex-col items-center py-8 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center gap-4 mb-12 px-6 w-full">
           <div className="size-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
             <span className="material-symbols-outlined font-black">diamond</span>
           </div>
           {!sidebarCollapsed && <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Emerald</h1>}
        </div>
        <nav className="flex-1 w-full space-y-2 px-3">
           <SidebarItem icon="home" label="Casino Floor" active={!activeGame} onClick={() => setActiveGame(null)} collapsed={sidebarCollapsed} />
           <SidebarItem icon="groups" label="Social Hub" active={activeModal === 'social'} onClick={() => setActiveModal('social')} collapsed={sidebarCollapsed} badge={pendingRequests.length > 0 ? pendingRequests.length.toString() : undefined} />
           <SidebarItem icon="trophy" label="Challenges" onClick={() => setActiveModal('challenges')} collapsed={sidebarCollapsed} />
           <SidebarItem icon="loyalty" label="VIP Club" onClick={() => setActiveModal('vip')} collapsed={sidebarCollapsed} />
           <SidebarItem icon="groups_2" label="Affiliates" onClick={() => setActiveModal('affiliates')} collapsed={sidebarCollapsed} />
           <SidebarItem icon="settings" label="Settings" onClick={() => { setTempProfile(userProfile); setActiveModal('settings'); }} collapsed={sidebarCollapsed} />
        </nav>
        <div className="w-full px-3 space-y-2">
           <SidebarItem icon="support_agent" label="Support" onClick={() => setActiveModal('support')} collapsed={sidebarCollapsed} />
           <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full h-12 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
             <span className="material-symbols-outlined transition-transform duration-500" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }}>chevron_left</span>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 transition-all duration-500 ${sidebarCollapsed ? 'pl-20' : 'pl-64'} ${chatCollapsed ? 'pr-20' : 'pr-80'}`}>
        <header className="sticky top-0 z-[100] w-full px-8 py-4 backdrop-blur-xl bg-background/60 border-b border-white/5">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div onClick={() => { setTempProfile(userProfile); setActiveModal('settings'); }} className="flex items-center gap-4 cursor-pointer group">
                  <div className="size-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all">
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">person</span></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black italic tracking-tighter uppercase group-hover:text-primary transition-colors">{userProfile.name}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest text-primary`}>Emerald Elite</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="glass h-12 pl-4 pr-1 rounded-2xl flex items-center gap-4 border-white/10">
                   <div className="flex items-center gap-2">
                      <span className="text-lg font-black italic text-white"><Odometer value={balance} /></span>
                      <span className="text-[10px] font-black text-primary">CR</span>
                   </div>
                   <button onClick={() => { sounds.tick(); updateBalance(5000); }} className="size-10 bg-primary hover:bg-primary-dark text-black rounded-xl flex items-center justify-center shadow-lg"><span className="material-symbols-outlined font-black">add</span></button>
                </div>
              </div>
           </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-12 min-h-screen">
          {activeGame === null ? <Lobby onSelect={setActiveGame} history={realHistory} /> : (
            <div className="w-full flex flex-col items-center">
               <div className="w-full flex justify-start mb-8">
                  <button onClick={() => setActiveGame(null)} className="flex items-center gap-2 text-white/40 hover:text-white transition-all group">
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back_ios</span>
                    <span className="text-xs font-black uppercase tracking-widest">Back to Lounge</span>
                  </button>
               </div>
               <div className="w-full flex justify-center animate-in zoom-in-95 duration-500">
                  {activeGame === GameType.ROULETTE && <RouletteGame balance={balance} onBalanceChange={updateBalance} onRecordResult={recordGameResult} />}
                  {activeGame === GameType.BLACKJACK && <BlackjackGame balance={balance} onBalanceChange={updateBalance} onRecordResult={recordGameResult} />}
                  {activeGame === GameType.MINES && <MinesGame balance={balance} onBalanceChange={updateBalance} onRecordResult={recordGameResult} />}
                  {activeGame === GameType.PLINKO && <PlinkoGame balance={balance} onBalanceChange={updateBalance} onRecordResult={recordGameResult} />}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* RIGHT CHAT SIDEBAR */}
      <aside className={`fixed h-screen top-0 right-0 glass z-[150] border-l border-white/5 transition-all duration-500 flex flex-col ${chatCollapsed ? 'w-20' : 'w-80'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(0,255,95,0.6)]"></div>
              {!chatCollapsed && <span className="text-xs font-black uppercase tracking-widest text-white/60">Live Chat</span>}
           </div>
           <button onClick={() => setChatCollapsed(!chatCollapsed)} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 transition-all">
             <span className="material-symbols-outlined text-sm" style={{ transform: chatCollapsed ? 'rotate(180deg)' : 'none' }}>chevron_right</span>
           </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar scroll-smooth ${chatCollapsed ? 'hidden' : 'block'}`} ref={chatScrollRef}>
           {chatMessages.map((msg, i) => {
             const isYou = msg.user === userProfile.name;
             const isSystem = msg.user === 'SYSTEM' || msg.user === 'SUPPORT';
             const prevMsg = chatMessages[i - 1];
             const showHeader = !prevMsg || prevMsg.user !== msg.user;
             
             return (
               <div key={msg.id} className={`flex flex-col gap-0.5 animate-in fade-in slide-in-from-right-4 duration-300 ${isYou ? 'items-end' : 'items-start'} ${showHeader ? 'mt-3' : 'mt-0'}`}>
                  {showHeader && !isSystem && (
                    <div className="flex items-center gap-2 mb-0.5 px-2">
                      <span className={`text-[9px] font-black italic tracking-tighter ${isYou ? 'text-primary' : 'text-white/40'}`}>{msg.user}</span>
                      {msg.rank && (
                        <span className="text-[7px] font-black uppercase px-1 rounded-sm bg-white/5 text-white/40 border border-white/10">{msg.rank}</span>
                      )}
                    </div>
                  )}

                  {msg.isRain ? (
                    <div onClick={() => { updateBalance(250); sounds.win(); addChatMessage({ user: 'SYSTEM', text: 'Rain Claimed! 💰' }); }} className="bg-success/20 border-success/40 p-3 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all animate-bounce">
                      <p className="text-[10px] font-black text-success uppercase italic leading-tight">{msg.text}</p>
                    </div>
                  ) : (
                    <div className={`relative max-w-[90%] px-4 py-2.5 text-[11px] font-medium leading-relaxed shadow-sm transition-all
                      ${isSystem ? 'bg-white/5 text-white/40 border-none italic text-center w-full rounded-lg' : 
                        isYou ? 'bg-primary text-black rounded-[20px] rounded-tr-[4px]' : 'bg-white/5 text-white/90 border border-white/5 rounded-[20px] rounded-tl-[4px]'}
                    `}>
                      <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                    </div>
                  )}
               </div>
             );
           })}
           {botTyping && (
             <div className="flex items-center gap-2 px-3 mt-4 animate-in fade-in duration-300">
                <div className="bg-white/5 px-4 py-3 rounded-[20px] rounded-tl-[4px] flex gap-1">
                  <div className="size-1.5 bg-white/20 rounded-full animate-bounce"></div>
                  <div className="size-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="size-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
           )}
        </div>

        {!chatCollapsed && (
          <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-background/40 backdrop-blur-md">
            <div className="relative group">
               <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 pl-4 pr-12 text-[11px] font-medium focus:border-primary/50 focus:ring-0 transition-all placeholder:text-white/20" />
               <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-primary text-black rounded-lg flex items-center justify-center hover:bg-primary-dark transition-all active:scale-90 shadow-lg">
                 <span className="material-symbols-outlined text-sm font-black">send</span>
               </button>
            </div>
          </form>
        )}
      </aside>

      {/* MODALS */}
      <Modal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="User Profile" icon="settings">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-6">
            <div className="size-32 rounded-full overflow-hidden border-4 border-primary/20 relative group">
              {tempProfile.avatar ? <img src={tempProfile.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20"><span className="material-symbols-outlined text-4xl">person</span></div>}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"><span className="material-symbols-outlined">add_a_photo</span><input type="file" className="hidden" onChange={handleImageUpload} /></label>
            </div>
            <input value={tempProfile.name} onChange={(e) => setTempProfile(p => ({ ...p, name: e.target.value.substring(0, 16) }))} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-center font-black italic text-xl" />
            <button onClick={saveProfile} className={`w-full h-16 rounded-2xl font-black uppercase italic tracking-widest ${saveSuccess ? 'bg-success text-black' : 'bg-primary text-black hover:scale-[1.02]'}`}>Save Changes</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'social'} onClose={() => setActiveModal(null)} title="Social Hub" icon="groups">
        <div className="space-y-6">
           <div className="relative"><input value={socialSearch} onChange={(e) => setSocialSearch(e.target.value)} placeholder="Find players..." className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12" /><span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span></div>
           <div className="space-y-3">
             {friends.map(f => (
               <div key={f.id} className="glass p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-full bg-white/5 overflow-hidden border border-white/10">{f.avatar ? <img src={f.avatar} /> : <span className="material-symbols-outlined">person</span>}</div>
                     <span className="text-sm font-black italic uppercase">{f.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => giftFriend(f.id)} className="size-8 rounded-lg bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-sm">featured_seasonal_and_gifts</span></button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </Modal>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void; collapsed?: boolean; badge?: string }> = ({ icon, label, active, onClick, collapsed, badge }) => (
  <button onClick={onClick} className={`w-full h-12 rounded-xl flex items-center px-4 gap-4 transition-all group relative ${active ? 'bg-primary text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
    <span className="material-symbols-outlined">{icon}</span>
    {!collapsed && <span className="text-sm font-black uppercase italic tracking-tighter">{label}</span>}
    {badge && <span className="absolute top-2 right-2 size-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">{badge}</span>}
  </button>
);

export default App;