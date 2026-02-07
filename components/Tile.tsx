import React from 'react';
import { TileData } from '../types';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface TileProps {
  tile: TileData;
  gridSize: number;
  imageUrl: string;
  onClick: (id: number) => void;
  disabled: boolean;
  isFocused?: boolean;
  isError?: boolean; // New prop for error state
}

const Tile: React.FC<TileProps> = ({ tile, gridSize, imageUrl, onClick, disabled, isError }) => {
  const { highContrast } = useAccessibility();

  // Standardize sizing and positioning
  // We use a small gap logic
  const gap = 0.5; // rem
  const sizePercentage = 100 / gridSize;
  
  const commonStyle: React.CSSProperties = {
    width: `calc(${sizePercentage}% - ${gap}rem)`,
    height: `calc(${sizePercentage}% - ${gap}rem)`,
    top: `calc(${tile.currentPos.row * sizePercentage}% + ${gap / 2}rem)`,
    left: `calc(${tile.currentPos.col * sizePercentage}% + ${gap / 2}rem)`,
  };

  if (tile.isEmpty) {
    return (
      <div 
        id={`tile-${tile.id}`}
        data-row={tile.currentPos.row}
        data-col={tile.currentPos.col}
        className={`absolute transition-all duration-300 ease-in-out rounded-lg flex items-center justify-center ${
          highContrast ? 'bg-black border-2 border-dashed border-yellow-500' : 'bg-gray-200/50'
        }`}
        style={{
          ...commonStyle,
          zIndex: 0
        }}
        tabIndex={-1}
        aria-label="Espaço vazio"
      />
    );
  }

  // Calculate background position
  const originalRow = Math.floor(tile.id / gridSize);
  const originalCol = tile.id % gridSize;
  
  const xPercent = gridSize > 1 ? (originalCol / (gridSize - 1)) * 100 : 0;
  const yPercent = gridSize > 1 ? (originalRow / (gridSize - 1)) * 100 : 0;

  // Define error styles
  const errorClass = isError 
    ? (highContrast 
        ? 'animate-shake border-4 border-red-600 z-50' 
        : 'animate-shake ring-4 ring-red-500 ring-offset-2 z-50 bg-red-100')
    : '';

  // Base Border/Style
  const baseClass = highContrast 
    ? 'border-2 border-yellow-400' 
    : 'shadow-md border border-white/20';

  return (
    <button
      id={`tile-${tile.id}`}
      onClick={() => onClick(tile.id)}
      disabled={disabled}
      data-row={tile.currentPos.row}
      data-col={tile.currentPos.col}
      className={`
        absolute rounded-lg
        focus:z-20 focus:outline-none focus:ring-4 focus:ring-blue-500
        transition-all duration-300 ease-in-out transform
        flex items-center justify-center overflow-hidden
        hover:scale-[0.98] active:scale-95
        ${isError ? errorClass : baseClass}
      `}
      style={{
        ...commonStyle,
        backgroundImage: highContrast && !isError ? 'none' : (isError && highContrast ? 'none' : `url(${imageUrl})`),
        // In high contrast error mode, we still hide the image to maintain contrast, but show the red border
        backgroundSize: `${gridSize * 100}%`,
        backgroundPosition: `${xPercent}% ${yPercent}%`,
        backgroundColor: highContrast ? '#000' : '#ddd',
        zIndex: isError ? 50 : 10 // Error tile pops to top
      }}
      aria-label={`Peça número ${tile.id + 1}, posição linha ${tile.currentPos.row + 1} coluna ${tile.currentPos.col + 1}`}
      aria-invalid={isError}
    >
      <span 
        className={`
          tile-number text-lg font-bold p-2 rounded-full pointer-events-none
          ${highContrast ? 'text-yellow-400 text-3xl' : 'text-white bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 focus-within:opacity-100'}
          transition-opacity
        `}
      >
        {tile.id + 1}
      </span>
    </button>
  );
};

export default Tile;