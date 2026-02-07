import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

const AccessibilityPanel: React.FC = () => {
  const { 
    highContrast, toggleHighContrast, 
    fontSizeMultiplier, increaseFontSize, decreaseFontSize,
    ttsEnabled, toggleTTS,
    voiceCommandsEnabled, toggleVoiceCommands
  } = useAccessibility();

  const toggleBtnClass = (active: boolean) => `
    flex-1 py-2 px-3 rounded-lg border-2 font-semibold text-sm transition-all
    ${active 
      ? (highContrast ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-blue-600 text-white border-blue-600') 
      : (highContrast ? 'bg-black text-white border-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
    }
  `;

  return (
    <div className={`p-4 rounded-xl mb-6 ${highContrast ? 'bg-black border-2 border-white' : 'bg-white shadow-lg'}`} role="region" aria-label="Painel de Acessibilidade">
      <h2 className={`text-lg font-bold mb-4 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
        Acessibilidade
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Contrast */}
        <div className="flex flex-col gap-1">
          <span className={`text-sm ${highContrast ? 'text-white' : 'text-gray-600'}`}>Visual</span>
          <button 
            onClick={toggleHighContrast}
            className={toggleBtnClass(highContrast)}
            aria-pressed={highContrast}
          >
            Alto Contraste: {highContrast ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Font Size */}
        <div className="flex flex-col gap-1">
           <span className={`text-sm ${highContrast ? 'text-white' : 'text-gray-600'}`}>Tamanho da Fonte ({fontSizeMultiplier}x)</span>
           <div className="flex gap-2">
             <button 
              onClick={decreaseFontSize}
              className={toggleBtnClass(false)}
              aria-label="Diminuir fonte"
             >
               A-
             </button>
             <button 
              onClick={increaseFontSize}
              className={toggleBtnClass(false)}
              aria-label="Aumentar fonte"
             >
               A+
             </button>
           </div>
        </div>

        {/* TTS */}
        <div className="flex flex-col gap-1">
          <span className={`text-sm ${highContrast ? 'text-white' : 'text-gray-600'}`}>Auditivo</span>
          <button 
            onClick={toggleTTS}
            className={toggleBtnClass(ttsEnabled)}
            aria-pressed={ttsEnabled}
          >
            Narração (TTS): {ttsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Voice Commands */}
        <div className="flex flex-col gap-1">
          <span className={`text-sm ${highContrast ? 'text-white' : 'text-gray-600'}`}>Motor / Voz</span>
          <button 
            onClick={toggleVoiceCommands}
            className={toggleBtnClass(voiceCommandsEnabled)}
            aria-pressed={voiceCommandsEnabled}
          >
            Comando de Voz: {voiceCommandsEnabled ? 'ON' : 'OFF'}
          </button>
          <p className="text-xs mt-1 text-gray-500">
             Diga <b>"Selecionar [número]"</b> para focar ou <b>"Mover [número]"</b> para jogar.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AccessibilityPanel;