// Simple wrapper for speech recognition
// Note: This relies on browser support (Chrome/Edge mainly)

export class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResult: (transcript: string) => void;

  constructor(onResult: (transcript: string) => void) {
    this.onResult = onResult;
    
    if ('webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'pt-BR';

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim();
        this.onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
      
      // Auto restart if it stops unexpectedly while supposed to be on
      this.recognition.onend = () => {
        if (this.isListening) {
           try {
             this.recognition.start();
           } catch (e) {
             console.log("Restarting recognition...");
           }
        }
      };
    }
  }

  start() {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      try {
        this.recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  isSupported() {
    return !!this.recognition;
  }
}