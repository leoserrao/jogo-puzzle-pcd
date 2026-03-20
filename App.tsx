import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import Tile from './components/Tile';
import Controls from './components/Controls';
import AccessibilityPanel from './components/AccessibilityPanel';
import AchievementNotification from './components/AchievementNotification';
import AchievementsList from './components/AchievementsList';
import { useAccessibility } from './contexts/AccessibilityContext';
import { useAchievements } from './contexts/AchievementContext';
import { VoiceService } from './services/voiceService';
import { GoogleGenAI } from "@google/genai";

// Helper to extract numbers from text (digits or Portuguese words)
const extractNumberFromCommand = (text: string): number | null => {
  const lower = text.toLowerCase();

  // Map of number words to integers
  const numberMap: { [key: string]: number } = {
    'um': 1, 'uma': 1,
    'dois': 2, 'duas': 2,
    'três': 3, 'tres': 3,
    'quatro': 4,
    'cinco': 5,
    'seis': 6, 'meia': 6,
    'sete': 7,
    'oito': 8,
    'nove': 9,
    'dez': 10,
    'onze': 11,
    'doze': 12,
    'treze': 13,
    'quatorze': 14, 'catorze': 14,
    'quinze': 15,
    'dezesseis': 16,
    'dezessete': 17,
    'dezoito': 18,
    'dezenove': 19,
    'vinte': 20
  };

  // 1. Try to find direct digits first (most common from Speech API)
  const digitMatch = lower.match(/(\d+)/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }

  // 2. Try to find number words
  // Sort keys by length desc to match longer words first if needed (though unlikely collision here)
  const words = Object.keys(numberMap);
  for (const word of words) {
    // Use regex to ensure word boundary
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) {
      return numberMap[word];
    }
  }

  return null;
};

const App: React.FC = () => {
  const [gridSize, setGridSize] = useState(3);
  const { tiles, isSolved, moveCount, imageUrl, moveTile, resetGame, initializeGame, lastMovedTileId, errorTileId } = useGameLogic(gridSize);
  const { 
    highContrast, 
    voiceCommandsEnabled, 
    ttsEnabled, 
    speak, 
    isSpeaking,
    toggleVoiceCommands,
    toggleTTS,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize
  } = useAccessibility();
  const { unlockAchievement, addToScore } = useAchievements();
  
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const [congratsMessage, setCongratsMessage] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [isErrorAnimating, setIsErrorAnimating] = useState(false);
  // State to track if we are waiting for a YES/NO confirmation to reset
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Keep a ref to the latest state/functions to use inside the stable VoiceService callback
  // This prevents the VoiceService from being recreated on every render
  const stateRef = useRef({
    tiles,
    moveTile,
    resetGame,
    speak,
    unlockAchievement,
    voiceCommandsEnabled,
    isConfirmingReset,
    setIsConfirmingReset,
    isSpeaking
  });

  // Update stateRef on every render
  useEffect(() => {
    stateRef.current = {
      tiles,
      moveTile,
      resetGame,
      speak,
      unlockAchievement,
      voiceCommandsEnabled,
      isConfirmingReset,
      setIsConfirmingReset,
      isSpeaking
    };
  });

  // Reset timer on game reset/init
  useEffect(() => {
    startTimeRef.current = Date.now();
    setPointsEarned(0);
  }, [imageUrl]); // imageUrl changes on reset

  // Track Accessibility Achievements
  useEffect(() => {
    if (highContrast || ttsEnabled) {
      unlockAchievement('access_features');
    }
  }, [highContrast, ttsEnabled, unlockAchievement]);

  // Track Win Achievements and Calculate Score
  useEffect(() => {
    if (isSolved) {
      unlockAchievement('first_win');
      
      const timeTaken = (Date.now() - startTimeRef.current) / 1000; // seconds
      if (timeTaken < 60) {
        unlockAchievement('speedster');
      }

      if (gridSize === 2) unlockAchievement('grid_2x2'); // Keep 2x2 as basic completion badge
      
      // Calculate Score:
      // Base: 100 * GridSize
      // Efficiency Bonus: (Allowable Moves - ActualMoves) * Multiplier
      // Allowable Moves heuristic: GridSize * GridSize * 6 (generous)
      const baseScore = gridSize * 100;
      const moveAllowance = gridSize * gridSize * 6;
      const efficiencyBonus = Math.max(0, moveAllowance - moveCount) * 10;
      
      const totalPoints = baseScore + efficiencyBonus;
      setPointsEarned(totalPoints);
      
      // Add to global score
      addToScore(totalPoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSolved]); // Run only when isSolved becomes true

  // Focus on the moved tile when it changes
  useEffect(() => {
    if (lastMovedTileId !== null && !isSolved) {
      const tileElement = document.getElementById(`tile-${lastMovedTileId}`);
      if (tileElement) {
        tileElement.focus();
      }
    }
  }, [lastMovedTileId, moveCount, isSolved]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (just in case we add one later)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Ignore if modifiers are pressed (except Shift which is needed for + on some layouts, though e.key handles the char)
      // We allow Shift, but block Ctrl/Alt/Meta to avoid overriding browser shortcuts like Ctrl+ (Zoom)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      
      // Accessibility Toggles
      if (key === 'v') toggleVoiceCommands();
      if (key === 'n') toggleTTS();
      if (key === 'a') toggleHighContrast();
      
      // Font Sizing
      if (e.key === '-') decreaseFontSize();
      if (e.key === '+') increaseFontSize();

      // Grid Size / Difficulty Shortcuts (2, 3, 4, 5)
      if (['2', '3', '4', '5'].includes(key)) {
        const newSize = parseInt(key, 10);
        // Only update if it's different to prevent unnecessary resets
        setGridSize((prev) => {
          if (prev !== newSize) {
            speak(`Dificuldade alterada para grade ${newSize} por ${newSize}`);
            return newSize;
          }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [toggleVoiceCommands, toggleTTS, toggleHighContrast, increaseFontSize, decreaseFontSize, speak]);

  const triggerErrorAnimation = () => {
    setIsErrorAnimating(true);
    setTimeout(() => setIsErrorAnimating(false), 500); // Duration matches animation in CSS
  };

  const handleTileClick = (id: number) => {
    const success = moveTile(id);
    // If NOT success, moveTile handles setting 'errorTileId', so the specific tile will shake.
    // We do NOT trigger the global board shake here anymore, to avoid visual clutter.
  };

  // Initialize Voice Service ONCE
  useEffect(() => {
    voiceServiceRef.current = new VoiceService((transcript) => {
      // Access latest state from ref
      const { 
        voiceCommandsEnabled: enabled, 
        tiles: currentTiles, 
        moveTile: currentMoveTile, 
        resetGame: currentResetGame, 
        speak: currentSpeak,
        unlockAchievement: currentUnlock,
        isConfirmingReset: currentIsConfirmingReset,
        setIsConfirmingReset: currentSetIsConfirmingReset,
        isSpeaking: currentIsSpeaking
      } = stateRef.current;

      if (!enabled) return;

      // We removed the strict speaking check to prevent blocking legitimate commands.
      // If the user speaks while the app is speaking, we prioritize the user command.
      
      const lower = transcript.toLowerCase();
      console.log('Voice Command:', lower);

      // --- CONFIRMATION LOGIC ---
      if (currentIsConfirmingReset) {
        if (lower.includes('sim') || lower.includes('confirma') || lower.includes('claro') || lower.includes('certeza')) {
          currentUnlock('access_voice');
          currentSetIsConfirmingReset(false);
          currentResetGame(); // resetGame includes a "New game started" speak
          return;
        } else if (lower.includes('não') || lower.includes('cancelar') || lower.includes('para')) {
          currentSetIsConfirmingReset(false);
          currentSpeak("Reinício cancelado. O jogo continua.");
          return;
        } else {
          currentSpeak("Não entendi. Diga sim para reiniciar ou não para cancelar.");
          return;
        }
      }

      // --- NORMAL COMMANDS ---

      // Reset commands
      if (lower.includes('reiniciar') || lower.includes('novo jogo') || lower.includes('começar de novo')) {
        currentSetIsConfirmingReset(true);
        currentSpeak("Tem certeza que deseja reiniciar o jogo? Diga sim ou não.");
        return;
      }

      // Movement / Selection commands
      // Expanded regex to catch variants like "Mova", "Movimente", "Escolha"
      const isSelectCommand = /selecion(ar|e|a)|foc(ar|o)|escolh(er|a)/i.test(lower);
      const isMoveCommand = /mov(er|a|imente)|peça|número|andar/i.test(lower);
      
      const num = extractNumberFromCommand(lower);

      if (num !== null) {
        // Valid number found
        const targetId = num - 1;
        const exists = currentTiles.some(t => t.id === targetId);

        if (exists) {
          currentUnlock('access_voice'); 

          if (isSelectCommand) {
            // "Selecionar X" -> ONLY Focus, do NOT move.
            const tileElement = document.getElementById(`tile-${targetId}`);
            if (tileElement) {
              tileElement.focus();
              currentSpeak(`Peça ${num} selecionada.`);
            }
          } else {
            // "Mover X" or implicitly just "X" -> Move
            const success = currentMoveTile(targetId);
            if (!success) {
               triggerErrorAnimation(); 
            }
          }
        } else {
          currentSpeak(`Peça número ${num} não encontrada.`);
          triggerErrorAnimation();
        }
      } else if (isMoveCommand && !isSelectCommand) {
        // User said "mover" but we couldn't find a number
        currentSpeak("Qual peça você quer mover?");
      }
    });

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, []); // Run once on mount

  // NEW: Manage Start/Stop of Voice Service based on Enabled state
  useEffect(() => {
    if (voiceCommandsEnabled) {
      voiceServiceRef.current?.start();
    } else {
      voiceServiceRef.current?.stop();
    }
  }, [voiceCommandsEnabled]);

  // Generate congratulatory message when solved using Gemini
  useEffect(() => {
    if (isSolved && process.env.API_KEY) {
      const fetchCongrats = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: "Write a short, encouraging, 1-sentence congratulation message in Portuguese for someone who just finished a puzzle.",
          });
          setCongratsMessage(response.text);
          speak(response.text + ` Você ganhou ${pointsEarned} pontos.`);
        } catch (e) {
          console.error("Gemini error", e);
          setCongratsMessage("Parabéns! Você é incrível!");
          speak(`Parabéns! Você é incrível! Você ganhou ${pointsEarned} pontos.`);
        }
      };
      fetchCongrats();
    } else if (isSolved) {
        setCongratsMessage("Parabéns! Quebra-cabeça concluído!");
        speak(`Parabéns! Quebra-cabeça concluído! Você ganhou ${pointsEarned} pontos.`);
    } else {
        setCongratsMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSolved, pointsEarned]); // Add pointsEarned to dependency to ensure it speaks the score

  // Keyboard Navigation Handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle if inside the grid and not modifying key
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Check if focus is on a tile
    const activeElement = document.activeElement as HTMLElement;
    const isTile = activeElement?.getAttribute('data-row') !== null;
    
    if (!isTile) return;

    const currentRow = parseInt(activeElement.getAttribute('data-row') || '0', 10);
    const currentCol = parseInt(activeElement.getAttribute('data-col') || '0', 10);
    
    let nextRow = currentRow;
    let nextCol = currentCol;

    switch (e.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(gridSize - 1, currentRow + 1);
        break;
      case 'ArrowLeft':
        nextCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        nextCol = Math.min(gridSize - 1, currentCol + 1);
        break;
      default:
        return; // Let other keys propagate (e.g. Enter, Tab)
    }

    if (nextRow !== currentRow || nextCol !== currentCol) {
      e.preventDefault();
      // Find the element with this row/col. 
      // Changed from 'button[data-row...]' to generic '[data-row...]' to include empty tiles (divs)
      const nextTile = document.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLElement;
      
      if (nextTile) {
        nextTile.focus();
        // If it's the empty tile (checked via aria-label or just behavior), speak it
        if (nextTile.getAttribute('aria-label') === 'Espaço vazio') {
           speak("Espaço vazio");
        }
      } 
    }
  };

  const containerClass = highContrast 
    ? "min-h-screen bg-black text-yellow-400 font-sans transition-colors"
    : "min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors";

  // Sort tiles for rendering to ensure DOM order matches Visual order (Accessbility: Tab Order)
  const sortedTiles = [...tiles].sort((a, b) => {
    const posA = a.currentPos.row * gridSize + a.currentPos.col;
    const posB = b.currentPos.row * gridSize + b.currentPos.col;
    return posA - posB;
  });

  return (
    <main className={containerClass}>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        
        <AchievementNotification />

        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-2" tabIndex={0}>Inclusive Puzzle</h1>
          <p className="text-lg opacity-80" tabIndex={0}>Monte a imagem movendo as peças.</p>
        </header>

        <AccessibilityPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Game Board Area */}
          <div className="flex flex-col items-center">
            
            {/* Target Image - Placed above grid for better visibility */}
            <div className={`mb-6 p-3 rounded-xl flex items-center gap-4 ${highContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-white shadow-sm border border-gray-100'}`}>
               <span className="font-bold text-sm uppercase tracking-wide">Meta:</span>
               <img 
                 src={imageUrl} 
                 alt="Imagem de referência: Como o quebra-cabeça deve ficar" 
                 className="w-40 h-40 object-cover rounded border border-gray-300" 
               />
            </div>

            <div 
              className={`
                relative w-full max-w-[500px] aspect-square rounded-xl overflow-hidden shadow-2xl border-4 transition-colors 
                ${highContrast ? 'bg-gray-900 border-yellow-400' : 'bg-gray-200 border-transparent focus-within:border-blue-500'}
                ${isErrorAnimating ? 'animate-shake' : ''}
              `}
              role="grid"
              aria-label={`Tabuleiro de quebra-cabeça ${gridSize} por ${gridSize}. Use as setas para navegar.`}
              onKeyDown={handleKeyDown}
            >
              {sortedTiles.map((tile) => (
                 <Tile 
                   key={tile.id}
                   tile={tile}
                   gridSize={gridSize}
                   imageUrl={imageUrl}
                   onClick={handleTileClick}
                   disabled={isSolved}
                   isError={tile.id === errorTileId}
                 />
              ))}
              
              {isSolved && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center animate-fade-in">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Vitória!</h2>
                    <p className="text-lg font-bold text-green-400 mb-4">+{pointsEarned} Pontos</p>
                    <p className="text-xl text-yellow-300 mb-6">{congratsMessage}</p>
                    <button 
                      onClick={resetGame}
                      className="bg-white text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                      autoFocus
                    >
                      Jogar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <p className="sr-only">
               Use as teclas de seta para mover o foco entre as peças. Pressione Enter ou Espaço para mover a peça selecionada para o espaço vazio.
            </p>

          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            <Controls 
              gridSize={gridSize}
              setGridSize={setGridSize}
              onReset={resetGame}
              moveCount={moveCount}
            />

            <AchievementsList />
          </div>

        </div>

      </div>
    </main>
  );
};

export default App;