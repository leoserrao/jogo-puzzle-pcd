export interface TilePosition {
  row: number;
  col: number;
}

export interface TileData {
  id: number; // The generic ID (0 to N-1)
  currentPos: TilePosition; // Where it is currently on the grid
  correctPos: TilePosition; // Where it should be
  isEmpty: boolean; // Is this the empty slot?
}

export interface GameState {
  gridSize: number;
  tiles: TileData[];
  isSolved: boolean;
  moveCount: number;
  imageUrl: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSizeMultiplier: number; // 1, 1.25, 1.5
  ttsEnabled: boolean;
  voiceCommandsEnabled: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';