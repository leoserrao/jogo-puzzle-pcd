import React from 'react';
import { useAchievements } from '../contexts/AchievementContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

const AchievementsList: React.FC = () => {
  const { achievements, totalScore } = useAchievements();
  const { highContrast } = useAccessibility();

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const cardClass = (unlocked: boolean) => {
    if (highContrast) {
      return unlocked 
        ? "bg-black border-2 border-yellow-400 text-yellow-400"
        : "bg-gray-900 border border-gray-600 text-gray-500";
    }
    return unlocked
      ? "bg-white border-2 border-yellow-400 shadow-md"
      : "bg-gray-100 border border-gray-200 opacity-70 grayscale";
  };

  return (
    <div className={`p-4 rounded-xl mt-6 ${highContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-md'}`}>
      
      <div className={`mb-6 p-4 rounded-lg text-center ${highContrast ? 'bg-black border border-white' : 'bg-blue-50 border border-blue-100'}`}>
         <h4 className="text-sm uppercase tracking-wider opacity-80">Pontuação Total</h4>
         <div className="text-4xl font-extrabold mt-1">{totalScore.toLocaleString()}</div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold text-lg ${highContrast ? 'text-white' : 'text-gray-800'}`}>
          Conquistas
        </h3>
        <span className={`text-sm font-bold ${highContrast ? 'text-yellow-400' : 'text-blue-600'}`}>
          {unlockedCount} / {achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((ach) => (
          <div 
            key={ach.id} 
            className={`p-3 rounded-lg flex items-center gap-3 transition-all ${cardClass(ach.unlocked)}`}
            aria-label={`${ach.title}: ${ach.description} - ${ach.unlocked ? 'Desbloqueado' : 'Bloqueado'}`}
          >
            <div className="text-2xl" aria-hidden="true">
              {ach.unlocked ? ach.icon : '🔒'}
            </div>
            <div>
              <p className="font-bold text-sm">{ach.title}</p>
              <p className="text-xs opacity-80">{ach.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsList;