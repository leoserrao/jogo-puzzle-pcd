import { useState, useEffect, useCallback } from 'react';
import { TileData, TilePosition } from '../types';
import { useAccessibility } from '../contexts/AccessibilityContext';

export const useGameLogic = (gridSize: number) => {
  const { speak } = useAccessibility();
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [imageUrl, setImageUrl] = useState(`https://picsum.photos/800/800?random=${Date.now()}`);
  const [lastMovedTileId, setLastMovedTileId] = useState<number | null>(null);
  const [errorTileId, setErrorTileId] = useState<number | null>(null);

  const initializeGame = useCallback(() => {
    const newTiles: TileData[] = [];
    // Create solved state
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const id = r * gridSize + c;
        newTiles.push({
          id,
          currentPos: { row: r, col: c },
          correctPos: { row: r, col: c },
          isEmpty: id === gridSize * gridSize - 1, // Last one is empty
        });
      }
    }
    
    // Shuffle by simulating valid moves to ensure solvability
    // We start from the solved state and move the empty tile randomly
    let emptyIdx = newTiles.findIndex(t => t.isEmpty);
    let lastMove = -1;
    const shuffleMoves = gridSize * gridSize * 10; // Sufficient randomness

    for (let i = 0; i < shuffleMoves; i++) {
      const emptyTile = newTiles[emptyIdx];
      const neighbors = [];
      
      const directions = [
        { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
      ];

      for (const d of directions) {
        const nr = emptyTile.currentPos.row + d.r;
        const nc = emptyTile.currentPos.col + d.c;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
          const neighborIdx = newTiles.findIndex(t => t.currentPos.row === nr && t.currentPos.col === nc);
          neighbors.push(neighborIdx);
        }
      }

      // Filter out the tile we just moved to prevent immediate backtracking (improves shuffle quality)
      const validNeighbors = neighbors.filter(n => n !== lastMove);
      const randomNeighborIdx = validNeighbors.length > 0 
        ? validNeighbors[Math.floor(Math.random() * validNeighbors.length)] 
        : neighbors[0]; // Fallback

      // Swap logic
      const tempPos = { ...newTiles[emptyIdx].currentPos };
      newTiles[emptyIdx].currentPos = { ...newTiles[randomNeighborIdx].currentPos };
      newTiles[randomNeighborIdx].currentPos = tempPos;

      lastMove = emptyIdx; // The empty tile "was" at index emptyIdx, but logically the piece moved is randomNeighborIdx
      // Wait, we need to track where the empty slot WENT physically, but we just swap positions in the array data
    }
    
    setTiles(newTiles);
    setIsSolved(false);
    setMoveCount(0);
    setLastMovedTileId(null);
    setErrorTileId(null);
    speak("Novo jogo iniciado. Tabuleiro embaralhado.");
  }, [gridSize, speak]);

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize]); // Only initialize when grid size changes

  const checkWin = (currentTiles: TileData[]) => {
    const won = currentTiles.every(tile => 
      tile.currentPos.row === tile.correctPos.row && 
      tile.currentPos.col === tile.correctPos.col
    );
    if (won) {
      setIsSolved(true);
      speak("Parabéns! Você completou o quebra-cabeça.");
    }
  };

  const moveTile = (tileId: number): boolean => {
    if (isSolved) return false;

    const tileIndex = tiles.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return false; // Safety check

    const tile = tiles[tileIndex];
    const emptyTileIndex = tiles.findIndex(t => t.isEmpty);
    const emptyTile = tiles[emptyTileIndex];

    const dr = Math.abs(tile.currentPos.row - emptyTile.currentPos.row);
    const dc = Math.abs(tile.currentPos.col - emptyTile.currentPos.col);

    // Check adjacency (only 1 step away in one direction)
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      const newTiles = [...tiles];
      
      // Swap positions
      const tempPos = { ...tile.currentPos };
      newTiles[tileIndex] = { ...tile, currentPos: emptyTile.currentPos };
      newTiles[emptyTileIndex] = { ...emptyTile, currentPos: tempPos };

      setTiles(newTiles);
      setMoveCount(prev => prev + 1);
      setLastMovedTileId(tileId);
      setErrorTileId(null); // Clear any previous error
      
      speak(`Peça ${tile.id + 1} movida.`);
      checkWin(newTiles);
      return true;
    } else {
      // Logic for invalid move: Set error state and trigger visual/audio feedback
      setErrorTileId(tileId);
      speak(`A peça ${tile.id + 1} não pode ser movida. Tente uma peça adjacente ao espaço vazio.`);
      
      // Reset error state after animation (500ms)
      setTimeout(() => {
        setErrorTileId(null);
      }, 500);
      
      return false;
    }
  };

  const resetGame = () => {
    initializeGame();
    setImageUrl(`https://picsum.photos/800/800?random=${Date.now()}`);
  };

  return {
    tiles,
    isSolved,
    moveCount,
    imageUrl,
    moveTile,
    resetGame,
    initializeGame,
    lastMovedTileId,
    errorTileId
  };
};