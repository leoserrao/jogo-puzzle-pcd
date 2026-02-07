import React, { createContext, useContext, useState, useRef, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { AccessibilitySettings } from '../types';

interface AccessibilityContextType extends AccessibilitySettings {
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleTTS: () => void;
  toggleVoiceCommands: () => void;
  speak: (text: string, force?: boolean) => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lastSpokenText = useRef<string>("");
  const lastSpokenTime = useRef<number>(0);
  
  // Track if interaction is via keyboard to only announce focus on keyboard nav
  const isKeyboardNav = useRef<boolean>(false);

  // Apply font size to root HTML element so rem units (Tailwind) scale properly
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`;
  }, [fontSizeMultiplier]);

  // TTS Helper
  const speak = useCallback((text: string, force: boolean = false) => {
    if ((!ttsEnabled && !force) || !window.speechSynthesis) return;
    
    const now = Date.now();
    // Prevent repeating the exact same text within 300ms (debounce double triggers)
    if (text === lastSpokenText.current && now - lastSpokenTime.current < 300) {
      return;
    }

    // Cancel current speaking to avoid queue buildup for quick interactions
    window.speechSynthesis.cancel();

    lastSpokenText.current = text;
    lastSpokenTime.current = now;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR'; // Portuguese Brazil
    utterance.rate = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // Global Focus Listener for Accessibility Announce
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
        isKeyboardNav.current = true;
      }
    };

    const handleMouseDown = () => {
      isKeyboardNav.current = false;
    };

    const handleFocus = (e: FocusEvent) => {
      if (!ttsEnabled || !isKeyboardNav.current) return;

      const target = e.target as HTMLElement;
      if (!target) return;

      // Determine what to say based on accessibility priorities
      let textToRead = '';

      // 1. Aria-Label (Highest priority)
      const ariaLabel = target.getAttribute('aria-label');
      if (ariaLabel) {
        textToRead = ariaLabel;
      } 
      // 2. Alt text (for images or inputs with images)
      else if (target.getAttribute('alt')) {
        textToRead = target.getAttribute('alt') || '';
      }
      // 3. Text Content (clean up whitespace)
      else if (target.innerText && target.innerText.trim().length > 0) {
        // Limit text length to avoid reading huge paragraphs on focus accidentally
        textToRead = target.innerText.slice(0, 100); 
      }
      // 4. Value (for inputs)
      else if ((target as HTMLInputElement).value) {
        textToRead = (target as HTMLInputElement).value;
      }

      if (textToRead) {
        speak(textToRead);
      }
    };

    // Use capture phase to ensure we catch focus events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('focus', handleFocus, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('focus', handleFocus, true);
    };
  }, [speak, ttsEnabled]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const newVal = !prev;
      speak(newVal ? "Alto contraste ativado" : "Alto contraste desativado", true);
      return newVal;
    });
  }, [speak]);

  const increaseFontSize = useCallback(() => {
    setFontSizeMultiplier(prev => {
      const newVal = Math.min(prev + 0.25, 2);
      speak(`Tamanho da fonte aumentado para ${newVal * 100} por cento`, true);
      return newVal;
    });
  }, [speak]);

  const decreaseFontSize = useCallback(() => {
    setFontSizeMultiplier(prev => {
      const newVal = Math.max(prev - 0.25, 1);
      speak(`Tamanho da fonte diminuído para ${newVal * 100} por cento`, true);
      return newVal;
    });
  }, [speak]);

  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => {
      const newVal = !prev;
      // We force this speak so they know it's off/on
      if (newVal) {
        speak("Narração ativada", true);
      } else {
        // Speak one last time before disabling
        const u = new SpeechSynthesisUtterance("Narração desativada");
        u.lang = 'pt-BR';
        u.onend = () => setIsSpeaking(false);
        u.onstart = () => setIsSpeaking(true);
        window.speechSynthesis.speak(u);
      }
      return newVal;
    });
  }, [speak]);

  const toggleVoiceCommands = useCallback(() => {
    setVoiceCommandsEnabled(prev => {
      const newVal = !prev;
      speak(newVal ? "Comandos de voz ativados" : "Comandos de voz desativados", true);
      return newVal;
    });
  }, [speak]);

  const value = useMemo(() => ({
    highContrast,
    fontSizeMultiplier,
    ttsEnabled,
    voiceCommandsEnabled,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleTTS,
    toggleVoiceCommands,
    speak,
    isSpeaking
  }), [
    highContrast,
    fontSizeMultiplier,
    ttsEnabled,
    voiceCommandsEnabled,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleTTS,
    toggleVoiceCommands,
    speak,
    isSpeaking
  ]);

  return (
    <AccessibilityContext.Provider value={value}>
      <div className={highContrast ? 'high-contrast' : ''}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};