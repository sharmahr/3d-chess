/**
 * Chess AI Web Worker
 * Handles AI computation off the main thread
 */

// Piece values for evaluation
const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

// Position tables for piece-square evaluation
const POSITION_TABLES = {
  pawn: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  knight: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  bishop: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  rook: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  queen: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  king: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

class ChessAIEngine {
  constructor() {
    this.nodesSearched = 0;
    this.startTime = 0;
    this.timeLimit = 2000; // 2 seconds
    this.shouldStop = false;
  }

  // Convert board to our format
  parseBoard(boardData) {
    return boardData.map(row => 
      row.map(piece => piece ? { ...piece } : null)
    );
  }

  // Evaluate board position
  evaluate(board, color) {
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        
        const value = PIECE_VALUES[piece.type];
        let positionValue = 0;
        
        // Get position table value (flip for black)
        if (POSITION_TABLES[piece.type]) {
          const table = POSITION_TABLES[piece.type];
          if (piece.color === 'white') {
            positionValue = table[r][c];
          } else {
            positionValue = table[7 - r][c];
          }
        }
        
        if (piece.color === color) {
          score += value + positionValue;
        } else {
          score -= value + positionValue;
        }
      }
    }
    
    return score;
  }

  // Get all legal moves for a color
  getAllMoves(board, color, castlingRights) {
    const moves = [];
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const pieceMoves = this.getLegalMoves(board, r, c, castlingRights);
          for (const move of pieceMoves) {
            moves.push({
              from: { r, c },
              to: { r: move.row, c: move.col },
              isCastling: move.isCastling
            });
          }
        }
      }
    }
    
    return moves;
  }

  // Get legal moves for a piece
  getLegalMoves(board, row, col, castlingRights) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const color = piece.color;
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    switch (piece.type) {
      case 'pawn':
        const dir = color === 'white' ? -1 : 1;
        const startRank = color === 'white' ? 6 : 1;
        
        // Forward moves
        if (!board[row + dir]?.[col]) {
          moves.push({ row: row + dir, col });
          if (row === startRank && !board[row + 2 * dir]?.[col]) {
            moves.push({ row: row + 2 * dir, col });
          }
        }
        
        // Captures
        for (const dc of [-1, 1]) {
          const target = board[row + dir]?.[col + dc];
          if (target && target.color === opponentColor) {
            moves.push({ row: row + dir, col: col + dc });
          }
        }
        break;
        
      case 'knight':
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (!target || target.color === opponentColor) {
              moves.push({ row: nr, col: nc });
            }
          }
        }
        break;
        
      case 'rook':
      case 'bishop':
      case 'queen':
        const directions = [];
        if (piece.type !== 'bishop') directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        if (piece.type !== 'rook') directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        
        for (const [dr, dc] of directions) {
          let nr = row + dr, nc = col + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (!target) {
              moves.push({ row: nr, col: nc });
            } else {
              if (target.color === opponentColor) moves.push({ row: nr, col: nc });
              break;
            }
            nr += dr; nc += dc;
          }
        }
        break;
        
      case 'king':
        const kingMoves = [
          [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
        ];
        for (const [dr, dc] of kingMoves) {
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (!target || target.color === opponentColor) {
              moves.push({ row: nr, col: nc });
            }
          }
        }
        
        // Castling
        if (!this.isInCheck(board, color)) {
          const rights = castlingRights[color];
          if (rights?.kingSide && !board[row][5] && !board[row][6]) {
            moves.push({ row, col: 6, isCastling: true });
          }
          if (rights?.queenSide && !board[row][3] && !board[row][2] && !board[row][1]) {
            moves.push({ row, col: 2, isCastling: true });
          }
        }
        break;
    }
    
    // Filter out moves that leave king in check
    return moves.filter(move => {
      const newBoard = this.simulateMove(board, row, col, move.row, move.col);
      return !this.isInCheck(newBoard, color);
    });
  }

  // Simulate a move
  simulateMove(board, fromR, fromC, toR, toC) {
    const newBoard = board.map(row => [...row]);
    newBoard[toR][toC] = newBoard[fromR][fromC];
    newBoard[fromR][fromC] = null;
    return newBoard;
  }

  // Check if square is attacked
  isSquareAttacked(board, row, col, attackerColor) {
    // Check pawns
    const pawnDir = attackerColor === 'white' ? 1 : -1;
    for (const dc of [-1, 1]) {
      const p = board[row + pawnDir]?.[col + dc];
      if (p?.type === 'pawn' && p.color === attackerColor) return true;
    }
    
    // Check knights
    const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, dc] of knightMoves) {
      const p = board[row + dr]?.[col + dc];
      if (p?.type === 'knight' && p.color === attackerColor) return true;
    }
    
    // Check sliding pieces
    const slidingDirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let i = 0; i < slidingDirs.length; i++) {
      const [dr, dc] = slidingDirs[i];
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c];
        if (p) {
          if (p.color === attackerColor) {
            if (i < 4 && (p.type === 'rook' || p.type === 'queen')) return true;
            if (i >= 4 && (p.type === 'bishop' || p.type === 'queen')) return true;
          }
          break;
        }
        r += dr; c += dc;
      }
    }
    
    // Check king
    const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [dr, dc] of kingMoves) {
      const p = board[row + dr]?.[col + dc];
      if (p?.type === 'king' && p.color === attackerColor) return true;
    }
    
    return false;
  }

  // Check if color is in check
  isInCheck(board, color) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p?.type === 'king' && p.color === color) {
          kingPos = { r, c };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return false;
    return this.isSquareAttacked(board, kingPos.r, kingPos.c, color === 'white' ? 'black' : 'white');
  }

  // Check if color has any legal moves
  hasLegalMoves(board, color, castlingRights) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p?.color === color) {
          if (this.getLegalMoves(board, r, c, castlingRights).length > 0) return true;
        }
      }
    }
    return false;
  }

  // Minimax with alpha-beta pruning
  minimax(board, depth, alpha, beta, isMaximizing, color, castlingRights) {
    this.nodesSearched++;
    
    // Check time limit
    if (Date.now() - this.startTime > this.timeLimit) {
      this.shouldStop = true;
      return this.evaluate(board, color);
    }
    
    // Terminal conditions
    if (depth === 0) {
      return this.evaluate(board, color);
    }
    
    const opponentColor = isMaximizing ? (color === 'white' ? 'black' : 'white') : color;
    const currentColor = isMaximizing ? color : opponentColor;
    
    // Check for checkmate/stalemate
    if (!this.hasLegalMoves(board, currentColor, castlingRights)) {
      if (this.isInCheck(board, currentColor)) {
        return isMaximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
      }
      return 0; // Stalemate
    }
    
    const moves = this.getAllMoves(board, currentColor, castlingRights);
    
    // Sort moves for better pruning (captures first)
    moves.sort((a, b) => {
      const captureA = board[a.to.r][a.to.c] ? PIECE_VALUES[board[a.to.r][a.to.c].type] : 0;
      const captureB = board[b.to.r][b.to.c] ? PIECE_VALUES[board[b.to.r][b.to.c].type] : 0;
      return captureB - captureA;
    });
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = this.simulateMove(board, move.from.r, move.from.c, move.to.r, move.to.c);
        const eval_ = this.minimax(newBoard, depth - 1, alpha, beta, false, color, castlingRights);
        if (this.shouldStop) return eval_;
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = this.simulateMove(board, move.from.r, move.from.c, move.to.r, move.to.c);
        const eval_ = this.minimax(newBoard, depth - 1, alpha, beta, true, color, castlingRights);
        if (this.shouldStop) return eval_;
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Find best move using iterative deepening
  findBestMove(boardData, color, castlingRights, maxDepth) {
    this.startTime = Date.now();
    this.shouldStop = false;
    this.nodesSearched = 0;
    
    const board = this.parseBoard(boardData);
    let bestMove = null;
    let bestValue = -Infinity;
    
    // Iterative deepening
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() - this.startTime > this.timeLimit) break;
      
      const moves = this.getAllMoves(board, color, castlingRights);
      if (moves.length === 0) break;
      
      let currentBestMove = null;
      let currentBestValue = -Infinity;
      
      for (const move of moves) {
        if (Date.now() - this.startTime > this.timeLimit) {
          this.shouldStop = true;
          break;
        }
        
        const newBoard = this.simulateMove(board, move.from.r, move.from.c, move.to.r, move.to.c);
        const value = this.minimax(newBoard, depth - 1, -Infinity, Infinity, false, color, castlingRights);
        
        if (this.shouldStop) break;
        
        if (value > currentBestValue) {
          currentBestValue = value;
          currentBestMove = move;
        }
      }
      
      if (!this.shouldStop && currentBestMove) {
        bestMove = currentBestMove;
        bestValue = currentBestValue;
      }
      
      // Report progress
      self.postMessage({
        type: 'progress',
        depth,
        nodes: this.nodesSearched,
        bestValue
      });
    }
    
    return { bestMove, nodesSearched: this.nodesSearched, evaluation: bestValue };
  }
}

// Worker message handler
const ai = new ChessAIEngine();

self.onmessage = function(e) {
  const { board, color, castlingRights, difficulty } = e.data;
  
  // Difficulty levels: easy=2, medium=4, hard=6
  const maxDepth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
  
  const result = ai.findBestMove(board, color, castlingRights, maxDepth);
  
  self.postMessage({
    type: 'complete',
    move: result.bestMove,
    nodesSearched: result.nodesSearched,
    evaluation: result.evaluation
  });
};