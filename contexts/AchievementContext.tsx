import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Achievement } from '../types';

interface AchievementContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  lastUnlocked: Achievement | null;
  clearNotification: () => void;
  totalScore: number;
  addToScore: (points: number) => void;
}

// Updated definitions to reflect Score-based progression for specific ranks
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'Primeira Vitória', description: 'Complete seu primeiro quebra-cabeça.', icon: '🏆', unlocked: false },
  { id: 'grid_2x2', title: 'Iniciante', description: 'Complete um puzzle 2x2.', icon: '👶', unlocked: false },
  // Changed logic: These are now Score Milestones
  { id: 'grid_3x3', title: 'Aprendiz', description: 'Acumule 1.000 pontos.', icon: '🧩', unlocked: false },
  { id: 'grid_4x4', title: 'Mestre', description: 'Acumule 5.000 pontos.', icon: '🎓', unlocked: false },
  { id: 'grid_5x5', title: 'Lenda', description: 'Acumule 10.000 pontos.', icon: '👑', unlocked: false },
  
  { id: 'access_voice', title: 'Comandante', description: 'Use um comando de voz.', icon: '🎤', unlocked: false },
  { id: 'access_features', title: 'Acessível', description: 'Use ferramentas de acessibilidade.', icon: '👁️', unlocked: false },
  { id: 'speedster', title: 'Velocista', description: 'Complete um puzzle em menos de 1 minuto.', icon: '⚡', unlocked: false },
];

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// --- Cookie Helper Functions ---

const setScoreCookie = (score: number, days: number) => {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  const secure = window.location.protocol === 'https:' ? ';SameSite=None;Secure' : ';SameSite=Lax';
  document.cookie = "puzzle_score=" + score + ";" + expires + ";path=/" + secure;
};

const getScoreCookie = (): number => {
  const name = "puzzle_score=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      const val = parseInt(c.substring(name.length, c.length), 10);
      return isNaN(val) ? 0 : val;
    }
  }
  return 0;
};

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [lastUnlocked, setLastUnlocked] = useState<Achievement | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const index = prev.findIndex(a => a.id === id);
      if (index === -1 || prev[index].unlocked) return prev;

      const newArr = [...prev];
      const newlyUnlocked = { ...newArr[index], unlocked: true, unlockedAt: Date.now() };
      newArr[index] = newlyUnlocked;
      
      setLastUnlocked(newlyUnlocked);
      localStorage.setItem('puzzle_achievements', JSON.stringify(newArr));
      return newArr;
    });
  }, []);

  // Load from Persistence
  useEffect(() => {
    // Load Achievements (Keep LocalStorage as achievements shouldn't expire)
    const savedAch = localStorage.getItem('puzzle_achievements');
    if (savedAch) {
      try {
        const parsed = JSON.parse(savedAch);
        setAchievements(prev => prev.map(a => {
          const savedOne = parsed.find((p: Achievement) => p.id === a.id);
          return savedOne ? { ...a, ...savedOne } : a;
        }));
      } catch (e) {
        console.error("Failed to load achievements", e);
      }
    }

    // Load Score from Cookie and sync achievements
    const cookieScore = getScoreCookie();
    if (cookieScore > 0) {
      setTotalScore(cookieScore);
      
      // Retroactively unlock achievements if score qualifies
      if (cookieScore >= 1000) unlockAchievement('grid_3x3');
      if (cookieScore >= 5000) unlockAchievement('grid_4x4');
      if (cookieScore >= 10000) unlockAchievement('grid_5x5');
    }
  }, [unlockAchievement]);

  const addToScore = (points: number) => {
    // We use the functional update to ensure we have the latest state,
    // BUT we need the new value for the cookie immediately. 
    // Since addToScore is recreated on every render with the correct closure 'totalScore', 
    // using 'totalScore + points' is generally safe.
    // However, to be absolutely sure against race conditions in React batching (rare here),
    // we calculate based on the current closure variable which represents the render state.
    
    const newScore = totalScore + points;
    setTotalScore(newScore);
    
    // Update Cookie: Sets value and resets the 5-day expiration timer
    setScoreCookie(newScore, 5);

    // Check Score Milestones
    if (newScore >= 1000) unlockAchievement('grid_3x3'); // Aprendiz
    if (newScore >= 5000) unlockAchievement('grid_4x4'); // Mestre
    if (newScore >= 10000) unlockAchievement('grid_5x5'); // Lenda
  };

  const clearNotification = () => {
    setLastUnlocked(null);
  };

  return (
    <AchievementContext.Provider value={{ achievements, unlockAchievement, lastUnlocked, clearNotification, totalScore, addToScore }}>
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};