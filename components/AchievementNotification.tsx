import React, { useEffect } from 'react';
import { useAchievements } from '../contexts/AchievementContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

const AchievementNotification: React.FC = () => {
  const { lastUnlocked, clearNotification } = useAchievements();
  const { highContrast, speak } = useAccessibility();

  useEffect(() => {
    if (lastUnlocked) {
      speak(`Conquista desbloqueada: ${lastUnlocked.title}`);
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastUnlocked, speak, clearNotification]);

  if (!lastUnlocked) return null;

  const styleClass = highContrast 
    ? "bg-black border-2 border-yellow-400 text-yellow-400" 
    : "bg-white border-l-4 border-yellow-500 text-gray-800 shadow-xl";

  return (
    <div 
      role="alert" 
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg max-w-sm w-full animate-slide-up ${styleClass}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl" aria-hidden="true">{lastUnlocked.icon}</span>
        <div>
          <h4 className="font-bold text-lg">Conquista Desbloqueada!</h4>
          <p className="font-semibold">{lastUnlocked.title}</p>
          <p className="text-sm opacity-90">{lastUnlocked.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;