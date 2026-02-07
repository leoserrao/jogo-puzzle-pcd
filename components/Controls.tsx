import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface ControlsProps {
  gridSize: number;
  setGridSize: (size: number) => void;
  onReset: () => void;
  moveCount: number;
}

const Controls: React.FC<ControlsProps> = ({ gridSize, setGridSize, onReset, moveCount }) => {
  const { highContrast, speak } = useAccessibility();

  const handleDifficultyChange = (size: number) => {
    setGridSize(size);
    speak(`Dificuldade alterada para grade ${size} por ${size}`);
  };

  const btnBase = "px-4 py-2 rounded-lg font-bold transition-colors focus:ring-4 ring-offset-2";
  const btnPrimary = highContrast 
    ? "bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-900" 
    : "bg-blue-600 text-white hover:bg-blue-700 ring-blue-300";
  const btnSecondary = highContrast
    ? "bg-black text-white border border-white hover:bg-gray-800"
    : "bg-gray-200 text-gray-800 hover:bg-gray-300 ring-gray-400";

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl w-full max-w-md mx-auto" aria-label="Controles do Jogo">
      
      <div className="flex justify-between items-center bg-gray-50/10 p-2 rounded">
        <span className={`font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-700'}`} role="status">
          Movimentos: {moveCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Seleção de Dificuldade">
        {[2, 3, 4, 5].map((size) => (
          <button
            key={size}
            onClick={() => handleDifficultyChange(size)}
            aria-pressed={gridSize === size}
            className={`${btnSecondary} ${gridSize === size ? (highContrast ? 'bg-yellow-900' : 'bg-blue-200 border-blue-500 border') : ''}`}
          >
            {size}x{size}
          </button>
        ))}
      </div>

      <button 
        onClick={onReset}
        className={`${btnPrimary} w-full py-3 text-lg flex items-center justify-center gap-2`}
        aria-label="Reiniciar Jogo e Embaralhar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reiniciar Jogo
      </button>
      
      <p className={`text-center text-sm mt-2 ${highContrast ? 'text-white' : 'text-gray-600'}`}>
        Dica: Você pode usar as setas do teclado para navegar e Enter para mover.
      </p>
    </div>
  );
};

export default Controls;