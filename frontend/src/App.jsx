import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import * as BABYLON_GUI from "@babylonjs/gui";

/**
 * Chess Piece Geometry Profiles
 * Defined as arrays of Vector3 points for lathe geometry
 * Each profile is defined for the right half (x >= 0) and rotated around Y axis
 */
const PIECE_PROFILES = {
  // Pawn: wide circular base, tapered stem, spherical head
  // Base width: 0.38 - this is our reference for other pieces
  pawn: [
    new BABYLON.Vector3(0, 0, 0), // Center of base
    new BABYLON.Vector3(0.38, 0, 0), // Base edge
    new BABYLON.Vector3(0.38, 0.08, 0), // Base vertical edge
    new BABYLON.Vector3(0.35, 0.12, 0), // Base taper start
    new BABYLON.Vector3(0.22, 0.25, 0), // Lower stem (wide)
    new BABYLON.Vector3(0.16, 0.45, 0), // Mid stem (narrower)
    new BABYLON.Vector3(0.14, 0.65, 0), // Upper stem (narrowest)
    new BABYLON.Vector3(0.18, 0.72, 0), // Collar bottom
    new BABYLON.Vector3(0.22, 0.78, 0), // Collar top
    new BABYLON.Vector3(0.12, 0.82, 0), // Neck start
    new BABYLON.Vector3(0.10, 0.88, 0), // Neck narrow
    new BABYLON.Vector3(0.20, 0.95, 0), // Head bottom curve
    new BABYLON.Vector3(0.26, 1.05, 0), // Head mid
    new BABYLON.Vector3(0.22, 1.15, 0), // Head top curve
    new BABYLON.Vector3(0.12, 1.22, 0), // Head top
    new BABYLON.Vector3(0, 1.24, 0), // Head peak
  ],

  // Rook: cylindrical base with crenellated top
  // Tapered to match pawn base width (~0.38)
  rook: [
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0.38, 0, 0), // Match pawn base
    new BABYLON.Vector3(0.38, 0.10, 0),
    new BABYLON.Vector3(0.34, 0.20, 0),
    new BABYLON.Vector3(0.32, 0.35, 0), // Narrower body
    new BABYLON.Vector3(0.32, 0.95, 0),
    new BABYLON.Vector3(0.36, 0.95, 0), // Crenellations start
    new BABYLON.Vector3(0.36, 1.10, 0),
    new BABYLON.Vector3(0.28, 1.10, 0),
    new BABYLON.Vector3(0.28, 1.00, 0),
    new BABYLON.Vector3(0.24, 1.00, 0),
    new BABYLON.Vector3(0.24, 1.10, 0),
    new BABYLON.Vector3(0.16, 1.10, 0),
    new BABYLON.Vector3(0.16, 1.00, 0),
    new BABYLON.Vector3(0.12, 1.00, 0),
    new BABYLON.Vector3(0.12, 1.10, 0),
    new BABYLON.Vector3(0, 1.10, 0),
  ],

  // Knight: elegant curved shape
  // Tapered to match pawn base width
  knight: [
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0.38, 0, 0), // Match pawn base
    new BABYLON.Vector3(0.38, 0.08, 0),
    new BABYLON.Vector3(0.34, 0.18, 0),
    new BABYLON.Vector3(0.28, 0.35, 0),
    new BABYLON.Vector3(0.26, 0.55, 0),
    new BABYLON.Vector3(0.28, 0.75, 0),
    new BABYLON.Vector3(0.24, 0.90, 0),
    new BABYLON.Vector3(0.16, 1.05, 0),
    new BABYLON.Vector3(0.10, 1.20, 0),
    new BABYLON.Vector3(0.06, 1.32, 0),
    new BABYLON.Vector3(0, 1.35, 0),
  ],

  // Bishop: tall with rounded slit top
  // Tapered to match pawn base width
  bishop: [
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0.38, 0, 0), // Match pawn base
    new BABYLON.Vector3(0.38, 0.08, 0),
    new BABYLON.Vector3(0.34, 0.18, 0),
    new BABYLON.Vector3(0.28, 0.38, 0),
    new BABYLON.Vector3(0.22, 0.60, 0),
    new BABYLON.Vector3(0.18, 0.85, 0),
    new BABYLON.Vector3(0.16, 1.10, 0),
    new BABYLON.Vector3(0.20, 1.25, 0), // Collar
    new BABYLON.Vector3(0.14, 1.40, 0),
    new BABYLON.Vector3(0.08, 1.55, 0),
    new BABYLON.Vector3(0.04, 1.62, 0),
    new BABYLON.Vector3(0, 1.65, 0),
  ],

  // Queen: tall with elaborate crown
  // Tapered to match pawn base width
  queen: [
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0.38, 0, 0), // Match pawn base
    new BABYLON.Vector3(0.38, 0.08, 0),
    new BABYLON.Vector3(0.34, 0.18, 0),
    new BABYLON.Vector3(0.28, 0.40, 0),
    new BABYLON.Vector3(0.22, 0.70, 0),
    new BABYLON.Vector3(0.18, 1.00, 0),
    new BABYLON.Vector3(0.16, 1.25, 0),
    new BABYLON.Vector3(0.22, 1.45, 0), // Crown base flare
    new BABYLON.Vector3(0.20, 1.60, 0),
    new BABYLON.Vector3(0.14, 1.72, 0),
    new BABYLON.Vector3(0.08, 1.80, 0),
    new BABYLON.Vector3(0.04, 1.85, 0),
    new BABYLON.Vector3(0, 1.88, 0),
  ],

  // King: tallest with elaborate cross base
  // Tapered to match pawn base width
  king: [
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0.38, 0, 0), // Match pawn base
    new BABYLON.Vector3(0.38, 0.08, 0),
    new BABYLON.Vector3(0.34, 0.18, 0),
    new BABYLON.Vector3(0.28, 0.42, 0),
    new BABYLON.Vector3(0.22, 0.75, 0),
    new BABYLON.Vector3(0.18, 1.10, 0),
    new BABYLON.Vector3(0.16, 1.40, 0),
    new BABYLON.Vector3(0.24, 1.60, 0), // Crown
    new BABYLON.Vector3(0.22, 1.78, 0),
    new BABYLON.Vector3(0.14, 1.92, 0),
    new BABYLON.Vector3(0.08, 2.02, 0),
    new BABYLON.Vector3(0.04, 2.08, 0),
    new BABYLON.Vector3(0, 2.10, 0),
  ],
};

/**
 * Core Chess Engine Logic
 * Handles legal move generation, check detection, and game state
 */
class ChessEngine {
  constructor() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.turn = "white"; // "white" or "black"
    this.history = [];
    this.castlingRights = {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    };
    this.enPassantTarget = null; // { row, col }
    this.gameState = "active"; // "active", "check", "checkmate", "stalemate"
  }

  setPiece(row, col, piece) {
    this.board[row][col] = piece;
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  isSquareOccupied(row, col) {
    return this.getPiece(row, col) !== null;
  }

  isSquareAttacked(row, col, attackerColor) {
    for (let r = 0; row < 8; r++) {
      for (let c = 0; col < 8; col++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.color === attackerColor) {
          const moves = this.getPseudoLegalMoves(r, c, false);
          if (moves.some(m => m.row === row && m.col === col)) return true;
        }
      }
    }
    return false;
  }

  // Simplified version for check detection to avoid recursion
  isSquareAttackedSimple(row, col, attackerColor) {
    // Check for pawns
    const pawnDir = attackerColor === "white" ? 1 : -1;
    const pawnAttacks = [
      { r: row + pawnDir, c: col - 1 },
      { r: row + pawnDir, c: col + 1 }
    ];
    for (const attack of pawnAttacks) {
      const p = this.getPiece(attack.r, attack.c);
      if (p && p.type === "pawn" && p.color === attackerColor) return true;
    }

    // Check for knights
    const knightMoves = [
      { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
      { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 }
    ];
    for (const m of knightMoves) {
      const p = this.getPiece(row + m.r, col + m.c);
      if (p && p.type === "knight" && p.color === attackerColor) return true;
    }

    // Check for sliding pieces (Rook, Bishop, Queen)
    const slidingDirs = [
      { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }, // Rook/Queen
      { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 } // Bishop/Queen
    ];
    for (let i = 0; i < slidingDirs.length; i++) {
      const dir = slidingDirs[i];
      let r = row + dir.r;
      let c = col + dir.c;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = this.getPiece(r, c);
        if (p) {
          if (p.color === attackerColor) {
            if (i < 4 && (p.type === "rook" || p.type === "queen")) return true;
            if (i >= 4 && (p.type === "bishop" || p.type === "queen")) return true;
          }
          break;
        }
        r += dir.r;
        c += dir.c;
      }
    }

    // Check for King
    const kingMoves = [
      { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
      { r: 0, c: -1 }, { r: 0, c: 1 },
      { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
    ];
    for (const m of kingMoves) {
      const p = this.getPiece(row + m.r, col + m.c);
      if (p && p.type === "king" && p.color === attackerColor) return true;
    }

    return false;
  }

  isInCheck(color) {
    // Find king
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type === "king" && p.color === color) {
          kingPos = { r, c };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return false;
    return this.isSquareAttackedSimple(kingPos.r, kingPos.c, color === "white" ? "black" : "white");
  }

  getPseudoLegalMoves(row, col, includeCastling = true) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];

    const moves = [];
    const color = piece.color;
    const opponentColor = color === "white" ? "black" : "white";

    switch (piece.type) {
      case "pawn":
        const dir = color === "white" ? -1 : 1;
        const startRank = color === "white" ? 6 : 1;

        // Forward 1
        if (!this.isSquareOccupied(row + dir, col)) {
          moves.push({ row: row + dir, col });
          // Forward 2
          if (row === startRank && !this.isSquareOccupied(row + 2 * dir, col)) {
            moves.push({ row: row + 2 * dir, col });
          }
        }

        // Captures
        for (const dc of [-1, 1]) {
          const target = this.getPiece(row + dir, col + dc);
          if (target && target.color === opponentColor) {
            moves.push({ row: row + dir, col: col + dc });
          }
        }
        break;

      case "knight":
        const kMoves = [
          { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
          { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 }
        ];
        for (const m of kMoves) {
          const nr = row + m.r, nc = col + m.c;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.getPiece(nr, nc);
            if (!target || target.color === opponentColor) moves.push({ row: nr, col: nc });
          }
        }
        break;

      case "rook":
      case "bishop":
      case "queen":
        const dirs = [];
        if (piece.type !== "bishop") dirs.push({ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 });
        if (piece.type !== "rook") dirs.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 });

        for (const d of dirs) {
          let nr = row + d.r, nc = col + d.c;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.getPiece(nr, nc);
            if (!target) {
              moves.push({ row: nr, col: nc });
            } else {
              if (target.color === opponentColor) moves.push({ row: nr, col: nc });
              break;
            }
            nr += d.r; nc += d.c;
          }
        }
        break;

      case "king":
        const kingMoves = [
          { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
          { r: 0, c: -1 }, { r: 0, c: 1 },
          { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
        ];
        for (const m of kingMoves) {
          const nr = row + m.r, nc = col + m.c;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.getPiece(nr, nc);
            if (!target || target.color === opponentColor) moves.push({ row: nr, col: nc });
          }
        }

        // Castling
        if (includeCastling && !this.isInCheck(color)) {
          const rights = this.castlingRights[color];
          if (rights.kingSide) {
            if (!this.isSquareOccupied(row, col + 1) && !this.isSquareOccupied(row, col + 2) &&
                !this.isSquareAttackedSimple(row, col + 1, opponentColor)) {
              moves.push({ row, col: col + 2, isCastling: true });
            }
          }
          if (rights.queenSide) {
            if (!this.isSquareOccupied(row, col - 1) && !this.isSquareOccupied(row, col - 2) && !this.isSquareOccupied(row, col - 3) &&
                !this.isSquareAttackedSimple(row, col - 1, opponentColor)) {
              moves.push({ row, col: col - 2, isCastling: true });
            }
          }
        }
        break;
    }
    return moves;
  }

  getLegalMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece || piece.color !== this.turn) return [];

    const pseudoMoves = this.getPseudoLegalMoves(row, col);
    const legalMoves = [];

    for (const move of pseudoMoves) {
      // Simulate move
      const originalTarget = this.board[move.row][move.col];
      this.board[move.row][move.col] = piece;
      this.board[row][col] = null;

      if (!this.isInCheck(piece.color)) {
        legalMoves.push(move);
      }

      // Undo move
      this.board[row][col] = piece;
      this.board[move.row][move.col] = originalTarget;
    }

    return legalMoves;
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.getPiece(fromRow, fromCol);
    const target = this.getPiece(toRow, toCol);
    
    // Update castling rights
    if (piece.type === "king") {
      this.castlingRights[piece.color].kingSide = false;
      this.castlingRights[piece.color].queenSide = false;
    } else if (piece.type === "rook") {
      if (fromCol === 0) this.castlingRights[piece.color].queenSide = false;
      if (fromCol === 7) this.castlingRights[piece.color].kingSide = false;
    }

    // Handle special moves like castling
    let castlingRookMove = null;
    if (piece.type === "king" && Math.abs(toCol - fromCol) === 2) {
      if (toCol > fromCol) { // King side
        const rook = this.getPiece(fromRow, 7);
        this.board[fromRow][5] = rook;
        this.board[fromRow][7] = null;
        castlingRookMove = { from: { r: fromRow, c: 7 }, to: { r: fromRow, c: 5 } };
      } else { // Queen side
        const rook = this.getPiece(fromRow, 0);
        this.board[fromRow][3] = rook;
        this.board[fromRow][0] = null;
        castlingRookMove = { from: { r: fromRow, c: 0 }, to: { r: fromRow, c: 3 } };
      }
    }

    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    this.turn = this.turn === "white" ? "black" : "white";

    this.updateGameState();
    return { captured: target, castlingRookMove };
  }

  updateGameState() {
    const hasLegalMoves = this.hasAnyLegalMoves(this.turn);
    const inCheck = this.isInCheck(this.turn);

    if (!hasLegalMoves) {
      if (inCheck) this.gameState = "checkmate";
      else this.gameState = "stalemate";
    } else if (inCheck) {
      this.gameState = "check";
    } else {
      this.gameState = "active";
    }
  }

  hasAnyLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === color) {
          if (this.getLegalMoves(r, c).length > 0) return true;
        }
      }
    }
    return false;
  }
}

/**
 * UI Manager
 * Handles game phases: Start Screen, Login, Dashboard, and HUD
 */
class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.scene = gameManager.scene;
    this.advancedTexture = BABYLON_GUI.AdvancedDynamicTexture.CreateFullscreenUI("MainUI");
    
    this.user = null;
    this.currentPhase = "start"; // start, login, dashboard, playing
    this.mainContainer = null;
    
    this.setupStartScreen();
  }

  clearUI() {
    if (this.mainContainer) {
      this.mainContainer.dispose();
      this.mainContainer = null;
    }
    this.advancedTexture.rootContainer.children.forEach(c => c.dispose());
  }

  setupStartScreen() {
    this.clearUI();
    this.currentPhase = "start";

    const container = new BABYLON_GUI.Rectangle();
    container.width = "100%";
    container.height = "100%";
    container.thickness = 0;
    container.background = "rgba(0, 0, 0, 0.75)";
    this.advancedTexture.addControl(container);
    this.mainContainer = container;

    const title = new BABYLON_GUI.TextBlock();
    title.text = "3D CHESS";
    title.color = "#4CAF50";
    title.fontSize = 84;
    title.fontWeight = "bold";
    title.fontFamily = "Segoe UI, Arial";
    title.top = "-120px";
    container.addControl(title);

    const subtitle = new BABYLON_GUI.TextBlock();
    subtitle.text = "Master the board in a new dimension";
    subtitle.color = "white";
    subtitle.fontSize = 24;
    subtitle.top = "-40px";
    container.addControl(subtitle);

    const startBtn = this.createButton("PLAY NOW", "60px", () => this.setupLoginModal());
    container.addControl(startBtn);
    
    // Aesthetic 3D title pieces
    this.gameManager.showTitlePieces();
  }

  setupLoginModal() {
    this.clearUI();
    this.currentPhase = "login";

    const bg = new BABYLON_GUI.Rectangle();
    bg.width = "100%";
    bg.height = "100%";
    bg.thickness = 0;
    bg.background = "rgba(0,0,0,0.5)";
    this.advancedTexture.addControl(bg);
    this.mainContainer = bg;

    const modal = new BABYLON_GUI.Rectangle();
    modal.width = "450px";
    modal.height = "350px";
    modal.cornerRadius = 20;
    modal.background = "#1a1a1a";
    modal.color = "#4CAF50";
    modal.thickness = 2;
    bg.addControl(modal);

    const title = new BABYLON_GUI.TextBlock();
    title.text = "PLAYER LOGIN";
    title.color = "white";
    title.fontSize = 28;
    title.fontWeight = "bold";
    title.top = "-110px";
    modal.addControl(title);

    const info = new BABYLON_GUI.TextBlock();
    info.text = "Join the grandmasters arena";
    info.color = "#888";
    info.fontSize = 16;
    info.top = "-70px";
    modal.addControl(info);

    const loginBtn = this.createButton("LOGIN AS GUEST", "20px", () => this.handleLogin());
    modal.addControl(loginBtn);

    const signupBtn = this.createButton("CREATE ACCOUNT", "90px", () => this.handleLogin());
    signupBtn.background = "transparent";
    signupBtn.color = "#4CAF50";
    modal.addControl(signupBtn);
  }

  handleLogin() {
    const names = ["Magnus_Fan", "ChessKing_2026", "DeepBlue_V2", "CheckmatePro", "GambitMaster", "KnightWatcher"];
    this.user = {
      name: names[Math.floor(Math.random() * names.length)],
      rating: 100,
      stats: { wins: 0, losses: 0, draws: 0 }
    };
    this.setupDashboard();
  }

  setupDashboard() {
    this.clearUI();
    this.currentPhase = "dashboard";

    const container = new BABYLON_GUI.Rectangle();
    container.width = "700px";
    container.height = "550px";
    container.cornerRadius = 25;
    container.background = "rgba(20, 20, 20, 0.95)";
    container.color = "#4CAF50";
    container.thickness = 1;
    this.advancedTexture.addControl(container);
    this.mainContainer = container;

    // Header
    const header = new BABYLON_GUI.TextBlock();
    header.text = "PLAYER DASHBOARD";
    header.color = "#4CAF50";
    header.fontSize = 32;
    header.fontWeight = "bold";
    header.top = "-220px";
    container.addControl(header);

    // Profile Section
    const profileBox = new BABYLON_GUI.Rectangle();
    profileBox.width = "600px";
    profileBox.height = "120px";
    profileBox.top = "-120px";
    profileBox.thickness = 0;
    profileBox.background = "rgba(255,255,255,0.05)";
    profileBox.cornerRadius = 10;
    container.addControl(profileBox);

    const welcome = new BABYLON_GUI.TextBlock();
    welcome.text = `Welcome back, ${this.user.name}`;
    welcome.color = "white";
    welcome.fontSize = 24;
    welcome.left = "-140px";
    welcome.top = "-20px";
    profileBox.addControl(welcome);

    const rating = new BABYLON_GUI.TextBlock();
    rating.text = `Rating: ${this.user.rating} ELO`;
    rating.color = "#4CAF50";
    rating.fontSize = 20;
    rating.left = "-140px";
    rating.top = "20px";
    profileBox.addControl(rating);

    // Difficulty selection
    const diffLabel = new BABYLON_GUI.TextBlock();
    diffLabel.text = "SELECT AI DIFFICULTY";
    diffLabel.color = "#888";
    diffLabel.fontSize = 18;
    diffLabel.top = "10px";
    container.addControl(diffLabel);

    const difficulties = ["easy", "medium", "hard"];
    difficulties.forEach((diff, i) => {
      const btn = this.createButton(diff.toUpperCase(), `${80 + i * 60}px`, () => {
        this.gameManager.aiDifficulty = diff;
        this.startGame();
      });
      btn.width = "250px";
      btn.height = "45px";
      btn.background = diff === this.gameManager.aiDifficulty ? "#4CAF50" : "#333";
      container.addControl(btn);
    });
  }

  startGame() {
    this.clearUI();
    this.currentPhase = "playing";
    this.gameManager.hideTitlePieces();
    this.gameManager.setupFullBoard();
    this.gameManager.setupHUD();
  }

  createButton(text, top, callback) {
    const button = BABYLON_GUI.Button.CreateSimpleButton("btn", text);
    button.width = "220px";
    button.height = "50px";
    button.color = "white";
    button.background = "#4CAF50";
    button.cornerRadius = 8;
    button.thickness = 0;
    button.top = top;
    button.fontSize = 18;
    button.fontWeight = "bold";
    button.onPointerClickObservable.add(callback);
    
    // Hover effect
    button.onPointerEnterObservable.add(() => {
      button.background = "#66bb6a";
    });
    button.onPointerOutObservable.add(() => {
      button.background = "#4CAF50";
    });
    
    return button;
  }
}

/**
 * Chess Game State and Interaction Manager
 * Handles piece selection, movement, and animations
 */
class ChessGameManager {
  constructor(scene, shadowGenerator, getSquarePos, squareSize, offset) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.getSquarePosition = getSquarePos;
    this.squareSize = squareSize;
    this.offset = offset;
    
    // Chess Engine
    this.engine = new ChessEngine();
    
    // AI
    this.aiWorker = null;
    this.isAIThinking = false;
    this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    this.playerColor = 'white'; // Player plays white, AI plays black
    
    // Game state
    this.pieces = new Map(); // key: "row,col", value: { mesh, type, isWhite }
    this.selectedPiece = null;
    this.selectedPieceKey = null;
    this.moveHighlights = [];
    this.selectionIndicator = null;
    this.kingCheckHighlight = null;
    this.thinkingIndicator = null;
    this.titlePieces = [];
    
    // UI
    this.hudText = null;
    this.uiManager = new UIManager(this);
    
    this.setupMaterials();
    this.setupInteraction();
    this.setupAI();
  }
  
  setupMaterials() {
    // Green highlight material for legal moves
    this.highlightMaterial = new BABYLON.StandardMaterial("highlight", this.scene);
    this.highlightMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
    this.highlightMaterial.alpha = 0.4;
    this.highlightMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.15);
    
    // Glowing green circle material for selection
    this.selectionCircleMaterial = new BABYLON.StandardMaterial("selectionCircle", this.scene);
    this.selectionCircleMaterial.diffuseColor = new BABYLON.Color3(0.3, 1.0, 0.4);
    this.selectionCircleMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.7, 0.3);
    this.selectionCircleMaterial.alpha = 0.6;

    // Red highlight for King in check
    this.checkMaterial = new BABYLON.StandardMaterial("checkHighlight", this.scene);
    this.checkMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.1, 0.1);
    this.checkMaterial.alpha = 0.6;
    this.checkMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.0, 0.0);

    // Thinking indicator material
    this.thinkingMaterial = new BABYLON.StandardMaterial("thinking", this.scene);
    this.thinkingMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
    this.thinkingMaterial.alpha = 0.7;
    this.thinkingMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.8);
    
    // PBR Wood materials
    this.whitePieceMat = new BABYLON.PBRMaterial("whitePiece", this.scene);
    this.whitePieceMat.albedoColor = new BABYLON.Color3(0.95, 0.88, 0.78);
    this.whitePieceMat.metallic = 0.0;
    this.whitePieceMat.roughness = 0.4;
    this.whitePieceMat.clearCoat.isEnabled = true;
    this.whitePieceMat.clearCoat.intensity = 0.1;

    this.blackPieceMat = new BABYLON.PBRMaterial("blackPiece", this.scene);
    this.blackPieceMat.albedoColor = new BABYLON.Color3(0.22, 0.12, 0.06);
    this.blackPieceMat.metallic = 0.0;
    this.blackPieceMat.roughness = 0.35;
    this.blackPieceMat.clearCoat.isEnabled = true;
    this.blackPieceMat.clearCoat.intensity = 0.15;
  }

  showTitlePieces() {
    this.hideTitlePieces();
    const types = ["king", "queen", "knight", "rook", "bishop", "pawn"];
    types.forEach((type, i) => {
      const piece = createChessPiece(type, this.scene, i % 2 === 0 ? this.whitePieceMat : this.blackPieceMat, this.shadowGenerator);
      piece.position.set(-3.5 + i * 1.4, 0.5, 2);
      piece.scaling.set(1.5, 1.5, 1.5);
      this.titlePieces.push(piece);
      
      // Floating animation
      const frameRate = 60;
      const moveAnim = new BABYLON.Animation("float", "position.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
      moveAnim.setKeys([
        { frame: 0, value: 0.5 },
        { frame: 60, value: 1.0 },
        { frame: 120, value: 0.5 }
      ]);
      piece.animations.push(moveAnim);
      
      const rotAnim = new BABYLON.Animation("spin", "rotation.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
      rotAnim.setKeys([
        { frame: 0, value: 0 },
        { frame: 120, value: Math.PI * 2 }
      ]);
      piece.animations.push(rotAnim);
      
      this.scene.beginAnimation(piece, 0, 120, true);
    });
  }

  hideTitlePieces() {
    this.titlePieces.forEach(p => p.dispose());
    this.titlePieces = [];
  }

  setupAI() {
    this.aiWorker = new Worker(new URL('./chessAI.worker.js', import.meta.url), { type: 'module' });
    this.aiWorker.onmessage = (e) => {
      const { type, move } = e.data;
      if (type === 'complete') {
        this.isAIThinking = false;
        this.hideThinkingIndicator();
        if (move) this.executeAIMove(move);
      }
    };
  }

  showThinkingIndicator() {
    this.hideThinkingIndicator();
    const indicator = BABYLON.MeshBuilder.CreateTorus("thinkingIndicator", { diameter: 2, thickness: 0.1 }, this.scene);
    indicator.position.y = 3;
    indicator.material = this.thinkingMaterial;
    BABYLON.Animation.CreateAndStartAnimation("rotate", indicator, "rotation.y", 60, 60, 0, Math.PI * 2, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    this.thinkingIndicator = indicator;
  }

  hideThinkingIndicator() {
    if (this.thinkingIndicator) { this.thinkingIndicator.dispose(); this.thinkingIndicator = null; }
  }

  requestAIMove() {
    if (this.engine.gameState === 'checkmate' || this.engine.gameState === 'stalemate' || this.engine.turn !== 'black') return;
    this.isAIThinking = true;
    this.showThinkingIndicator();
    const boardData = this.engine.board.map(row => row.map(p => p ? { type: p.type, color: p.color } : null));
    this.aiWorker.postMessage({ board: boardData, color: 'black', castlingRights: this.engine.castlingRights, difficulty: this.aiDifficulty });
  }

  executeAIMove(move) {
    if (!move) return;
    const piece = this.pieces.get(`${move.from.r},${move.from.c}`);
    if (piece) { this.selectedPiece = piece; this.selectedPieceKey = `${move.from.r},${move.from.c}`; this.executeMove(move.to.r, move.to.c); }
  }

  setupHUD() {
    this.uiManager.advancedTexture.rootContainer.children.forEach(c => {
      if (c.name === "HUD_CONTAINER") c.dispose();
    });

    const hudContainer = new BABYLON_GUI.Rectangle("HUD_CONTAINER");
    hudContainer.width = "100%";
    hudContainer.height = "100%";
    hudContainer.thickness = 0;
    this.uiManager.advancedTexture.addControl(hudContainer);

    this.hudText = new BABYLON_GUI.TextBlock();
    this.hudText.text = "White's Turn";
    this.hudText.color = "white";
    this.hudText.fontSize = 28;
    this.hudText.fontWeight = "bold";
    this.hudText.top = "-42%";
    hudContainer.addControl(this.hudText);
    
    const userDisplay = new BABYLON_GUI.TextBlock();
    userDisplay.text = `${this.uiManager.user.name} (${this.uiManager.user.rating})`;
    userDisplay.color = "#4CAF50";
    userDisplay.fontSize = 18;
    userDisplay.top = "-46%";
    hudContainer.addControl(userDisplay);

    const menuBtn = this.uiManager.createButton("MAIN MENU", "45%", () => {
      this.pieces.forEach(p => p.mesh.dispose());
      this.pieces.clear();
      this.uiManager.setupDashboard();
    });
    menuBtn.width = "150px";
    menuBtn.height = "40px";
    menuBtn.fontSize = 14;
    menuBtn.horizontalAlignment = BABYLON_GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    menuBtn.left = "-20px";
    hudContainer.addControl(menuBtn);
  }

  updateHUD() {
    let status = this.engine.turn === "white" ? "White's Turn" : "Black's Turn";
    if (this.engine.gameState === "check") status += " (CHECK!)";
    else if (this.engine.gameState === "checkmate") status = "CHECKMATE! " + (this.engine.turn === "white" ? "Black" : "White") + " Wins!";
    else if (this.engine.gameState === "stalemate") status = "STALEMATE! Draw.";
    if (this.hudText) this.hudText.text = status;
    this.clearCheckHighlight();
    if (this.engine.gameState === "check" || this.engine.gameState === "checkmate") this.showCheckHighlight();
  }

  showCheckHighlight() {
    let kingKey = null;
    for (const [key, piece] of this.pieces.entries()) {
      if (piece.type === "king" && piece.isWhite === (this.engine.turn === "white")) { kingKey = key; break; }
    }
    if (kingKey) {
      const [r, c] = kingKey.split(",").map(Number);
      const pos = this.getSquarePosition(r, c);
      const highlight = BABYLON.MeshBuilder.CreatePlane("checkHighlight", { width: 0.95, height: 0.95 }, this.scene);
      highlight.position.set(pos.x, 0.015, pos.z);
      highlight.rotation.x = Math.PI / 2;
      highlight.material = this.checkMaterial;
      BABYLON.Animation.CreateAndStartAnimation("checkPulse", highlight, "visibility", 60, 30, 0.6, 0.2, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE, new BABYLON.SineEase());
      this.kingCheckHighlight = highlight;
    }
  }

  clearCheckHighlight() {
    if (this.kingCheckHighlight) { this.kingCheckHighlight.dispose(); this.kingCheckHighlight = null; }
  }
  
  registerPiece(row, col, mesh, type, isWhite) {
    const key = `${row},${col}`;
    this.pieces.set(key, { mesh, type, isWhite, row, col });
    this.engine.setPiece(row, col, { type, color: isWhite ? "white" : "black" });
    mesh.metadata = { pieceKey: key, type, isWhite, row, col };
  }
  
  setupInteraction() {
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        if (this.uiManager.currentPhase !== "playing" || this.isAIThinking) return;
        if (this.engine.gameState === "checkmate" || this.engine.gameState === "stalemate") return;
        if (this.engine.turn !== this.playerColor) return;

        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh.metadata?.pieceKey || mesh.name.startsWith("highlight_"));
        if (pickResult.hit) {
          const mesh = pickResult.pickedMesh;
          if (mesh.metadata?.pieceKey) this.handlePieceClick(mesh.metadata.pieceKey);
          else if (mesh.name.startsWith("highlight_") && this.selectedPiece) this.executeMove(mesh.metadata.row, mesh.metadata.col);
        } else this.deselectPiece();
      }
    });
  }
  
  handlePieceClick(pieceKey) {
    const piece = this.pieces.get(pieceKey);
    if (!piece) return;
    
    // Only allow selecting own pieces
    const currentTurnIsWhite = this.engine.turn === "white";
    if (piece.isWhite !== currentTurnIsWhite) {
      // If clicking opponent piece and it's a legal move, execute capture
      if (this.selectedPiece) {
        const [r, c] = pieceKey.split(",").map(Number);
        const legalMoves = this.engine.getLegalMoves(this.selectedPiece.row, this.selectedPiece.col);
        if (legalMoves.some(m => m.row === r && m.col === c)) {
          this.executeMove(r, c);
          return;
        }
      }
      this.deselectPiece();
      return;
    }
    
    if (this.selectedPieceKey === pieceKey) {
      this.deselectPiece();
      return;
    }
    
    this.deselectPiece();
    this.selectedPiece = piece;
    this.selectedPieceKey = pieceKey;
    
    this.animateSelection(piece.mesh, true);
    this.showSelectionIndicator(piece);
    this.showLegalMoves(piece);
  }
  
  animateSelection(mesh, isSelecting) {
    const targetY = isSelecting ? 0.3 : 0;
    BABYLON.Animation.CreateAndStartAnimation("selectLift", mesh, "position.y", 60, 9, mesh.position.y, targetY, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
  }
  
  showSelectionIndicator(piece) {
    this.hideSelectionIndicator();
    const indicator = BABYLON.MeshBuilder.CreateDisc("selectionIndicator", { radius: 0.45 }, this.scene);
    indicator.position.copyFrom(piece.mesh.position);
    indicator.position.y = 0.02;
    indicator.rotation.x = Math.PI / 2;
    indicator.material = this.selectionCircleMaterial;
    
    BABYLON.Animation.CreateAndStartAnimation("glowPulse", indicator, "scaling.x", 60, 30, 1, 1.1, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation("glowPulseZ", indicator, "scaling.y", 60, 30, 1, 1.1, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE, new BABYLON.SineEase());
    this.selectionIndicator = indicator;
  }
  
  hideSelectionIndicator() {
    if (this.selectionIndicator) { this.selectionIndicator.dispose(); this.selectionIndicator = null; }
  }
  
  showLegalMoves(piece) {
    this.clearMoveHighlights();
    const legalMoves = this.engine.getLegalMoves(piece.row, piece.col);
    for (const move of legalMoves) {
      this.createMoveHighlight(move.row, move.col);
    }
  }
  
  createMoveHighlight(row, col) {
    const pos = this.getSquarePosition(row, col);
    const highlight = BABYLON.MeshBuilder.CreatePlane(`highlight_${row}_${col}`, { width: 0.8, height: 0.8 }, this.scene);
    highlight.position.set(pos.x, 0.01, pos.z);
    highlight.rotation.x = Math.PI / 2;
    highlight.material = this.highlightMaterial;
    highlight.metadata = { row, col };
    this.moveHighlights.push(highlight);
  }
  
  clearMoveHighlights() {
    this.moveHighlights.forEach(h => h.dispose());
    this.moveHighlights = [];
  }
  
  deselectPiece() {
    if (this.selectedPiece) this.animateSelection(this.selectedPiece.mesh, false);
    this.selectedPiece = null;
    this.selectedPieceKey = null;
    this.hideSelectionIndicator();
    this.clearMoveHighlights();
  }
  
  executeMove(targetRow, targetCol) {
    if (!this.selectedPiece) return;
    
    const piece = this.selectedPiece;
    const oldRow = piece.row;
    const oldCol = piece.col;
    const { captured, castlingRookMove } = this.engine.makeMove(oldRow, oldCol, targetRow, targetCol);
    
    if (captured) {
      const capturedPiece = this.pieces.get(`${targetRow},${targetCol}`);
      this.animateCapture(capturedPiece);
      this.pieces.delete(`${targetRow},${targetCol}`);
    }

    // Handle visual rook move for castling
    if (castlingRookMove) {
      const rook = this.pieces.get(`${castlingRookMove.from.r},${castlingRookMove.from.c}`);
      this.animateMove(rook, castlingRookMove.to.r, castlingRookMove.to.c);
      this.pieces.delete(`${castlingRookMove.from.r},${castlingRookMove.from.c}`);
      this.pieces.set(`${castlingRookMove.to.r},${castlingRookMove.to.c}`, rook);
      rook.row = castlingRookMove.to.r;
      rook.col = castlingRookMove.to.c;
      rook.mesh.metadata.row = rook.row;
      rook.mesh.metadata.col = rook.col;
      rook.mesh.metadata.pieceKey = `${rook.row},${rook.col}`;
    }
    
    this.animateMove(piece, targetRow, targetCol, () => {
      this.pieces.delete(`${oldRow},${oldCol}`);
      piece.row = targetRow;
      piece.col = targetCol;
      piece.mesh.metadata.row = targetRow;
      piece.mesh.metadata.col = targetCol;
      piece.mesh.metadata.pieceKey = `${targetRow},${targetCol}`;
      this.pieces.set(`${targetRow},${targetCol}`, piece);
      
      this.deselectPiece();
      this.updateHUD();
      
      // Trigger AI move if it's AI's turn
      if (this.engine.turn === 'black' && this.engine.gameState !== 'checkmate' && this.engine.gameState !== 'stalemate') {
        setTimeout(() => this.requestAIMove(), 500);
      }
    });
  }
  
  animateMove(piece, targetRow, targetCol, onComplete) {
    const targetPos = this.getSquarePosition(targetRow, targetCol);
    const mesh = piece.mesh;
    const frameRate = 60;
    
    BABYLON.Animation.CreateAndStartAnimation("moveLift", mesh, "position.y", frameRate, 12, mesh.position.y, 0.8, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
    
    setTimeout(() => {
      BABYLON.Animation.CreateAndStartAnimation("moveX", mesh, "position.x", frameRate, 18, mesh.position.x, targetPos.x, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
      BABYLON.Animation.CreateAndStartAnimation("moveZ", mesh, "position.z", frameRate, 18, mesh.position.z, targetPos.z, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
      
      setTimeout(() => {
        BABYLON.Animation.CreateAndStartAnimation("moveDescend", mesh, "position.y", frameRate, 12, 0.8, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase(), onComplete);
      }, 300);
    }, 200);
  }
  
  animateCapture(targetPiece) {
    const mesh = targetPiece.mesh;
    const frameRate = 60;
    const direction = targetPiece.isWhite ? 1 : -1;
    const targetX = mesh.position.x + (Math.random() - 0.5) * 2;
    const targetZ = mesh.position.z + direction * 4;
    
    BABYLON.Animation.CreateAndStartAnimation("captureFallX", mesh, "position.x", frameRate, 30, mesh.position.x, targetX, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
    BABYLON.Animation.CreateAndStartAnimation("captureFallZ", mesh, "position.z", frameRate, 30, mesh.position.z, targetZ, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
    BABYLON.Animation.CreateAndStartAnimation("captureFallY", mesh, "position.y", frameRate, 30, mesh.position.y, -2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.QuadraticEase());
    BABYLON.Animation.CreateAndStartAnimation("captureRotX", mesh, "rotation.x", frameRate, 30, mesh.rotation.x, mesh.rotation.x + Math.PI * 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    BABYLON.Animation.CreateAndStartAnimation("captureRotZ", mesh, "rotation.z", frameRate, 30, mesh.rotation.z, mesh.rotation.z + Math.PI * 3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    
    setTimeout(() => mesh.dispose(), 500);
  }

  setupFullBoard() {
    // Clear existing pieces if any
    this.pieces.forEach(p => p.mesh.dispose());
    this.pieces.clear();
    this.engine = new ChessEngine(); // Reset engine state

    const layout = [
      ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
      ["pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn"],
      [], [], [], [],
      ["pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn"],
      ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
    ];

    for (let row = 0; row < 8; row++) {
      if (!layout[row]) continue;
      for (let col = 0; col < 8; col++) {
        const pieceType = layout[row][col];
        if (!pieceType) continue;

        const isWhite = row >= 6;
        const material = isWhite ? this.whitePieceMat : this.blackPieceMat;
        const piece = createChessPiece(pieceType, this.scene, material, this.shadowGenerator);
        
        if (piece) {
          const pos = this.getSquarePosition(row, col);
          piece.position.set(pos.x, 0, pos.z);
          if (!isWhite) piece.rotation.y = Math.PI;
          this.registerPiece(row, col, piece, pieceType, isWhite);
        }
      }
    }
    this.updateHUD();
  }
}


/**
 * Create a chess piece mesh using lathe geometry and additional components
 * @param {string} type - Piece type ('pawn', 'rook', 'knight', 'bishop', 'queen', 'king')
 * @param {BABYLON.Scene} scene - The Babylon scene
 * @param {BABYLON.Material} material - Material to apply
 * @param {BABYLON.ShadowGenerator} shadowGenerator - Shadow generator
 * @returns {BABYLON.Mesh} The created piece mesh
 */
function createChessPiece(type, scene, material, shadowGenerator) {
  const profile = PIECE_PROFILES[type];
  if (!profile) {
    console.error(`Unknown piece type: ${type}`);
    return null;
  }

  // Create the base lathe mesh
  const latheMesh = BABYLON.MeshBuilder.CreateLathe(
    `${type}_lathe_${Date.now()}`,
    {
      shape: profile,
      radius: 0,
      tessellation: 64,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    },
    scene
  );

  let finalMesh = latheMesh;
  const meshesToMerge = [latheMesh];

  // Add specific details for complex pieces
  if (type === "rook") {
    // Add battlements (crenellations) - adjusted for narrower profile
    const topHeight = 1.10;
    const battlementCount = 6;
    const battlementRadius = 0.32;
    for (let i = 0; i < battlementCount; i++) {
      const angle = (i / battlementCount) * Math.PI * 2;
      const merlon = BABYLON.MeshBuilder.CreateBox(
        `rook_merlon_${i}`,
        { width: 0.12, height: 0.15, depth: 0.15 },
        scene
      );
      merlon.position.y = topHeight;
      merlon.position.x = Math.cos(angle) * battlementRadius;
      merlon.position.z = Math.sin(angle) * battlementRadius;
      merlon.rotation.y = -angle;
      meshesToMerge.push(merlon);
    }
  } else if (type === "knight") {
    // Add knight head details - scaled for narrower profile
    const head = BABYLON.MeshBuilder.CreateSphere(
      "knight_head",
      { diameterX: 0.32, diameterY: 0.40, diameterZ: 0.50 },
      scene
    );
    head.position.y = 1.05;
    head.position.z = 0.08;
    head.rotation.x = Math.PI / 6;
    meshesToMerge.push(head);

    const snout = BABYLON.MeshBuilder.CreateBox(
      "knight_snout",
      { width: 0.20, height: 0.20, depth: 0.32 },
      scene
    );
    snout.position.y = 1.0;
    snout.position.z = 0.32;
    snout.rotation.x = Math.PI / 4;
    meshesToMerge.push(snout);
  } else if (type === "queen") {
    // Add small spheres around the crown - adjusted for narrower profile
    const crownRadius = 0.22;
    const crownHeight = 1.60;
    const ballCount = 8;
    for (let i = 0; i < ballCount; i++) {
      const angle = (i / ballCount) * Math.PI * 2;
      const ball = BABYLON.MeshBuilder.CreateSphere(
        `queen_ball_${i}`,
        { diameter: 0.10 },
        scene
      );
      ball.position.y = crownHeight;
      ball.position.x = Math.cos(angle) * crownRadius;
      ball.position.z = Math.sin(angle) * crownRadius;
      meshesToMerge.push(ball);
    }
    const topBall = BABYLON.MeshBuilder.CreateSphere(
      "queen_top_ball",
      { diameter: 0.12 },
      scene
    );
    topBall.position.y = 1.88;
    meshesToMerge.push(topBall);
  } else if (type === "king") {
    // Add cross on top - adjusted for narrower profile
    const crossVert = BABYLON.MeshBuilder.CreateBox(
      "king_cross_v",
      { width: 0.06, height: 0.35, depth: 0.06 },
      scene
    );
    crossVert.position.y = 2.25;
    meshesToMerge.push(crossVert);

    const crossHoriz = BABYLON.MeshBuilder.CreateBox(
      "king_cross_h",
      { width: 0.22, height: 0.06, depth: 0.06 },
      scene
    );
    crossHoriz.position.y = 2.30;
    meshesToMerge.push(crossHoriz);
  } else if (type === "bishop") {
    const topBall = BABYLON.MeshBuilder.CreateSphere(
      "bishop_top_ball",
      { diameter: 0.10 },
      scene
    );
    topBall.position.y = 1.68;
    meshesToMerge.push(topBall);
  }

  if (meshesToMerge.length > 1) {
    finalMesh = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
    finalMesh.name = `${type}_merged_${Date.now()}`;
  }

  finalMesh.material = material;
  finalMesh.receiveShadows = true;
  shadowGenerator.addShadowCaster(finalMesh);

  return finalMesh;
}

/**
 * 3D Chess Game - Babylon.js Scene
 *
 * Renders an 8x8 checkerboard chessboard with proper lighting, camera controls,
 * chess pieces with realistic lathe geometry, and board notation.
 */
export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine
    const engine = new BABYLON.Engine(canvasRef.current, true);
    engineRef.current = engine;

    // Create scene
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.1); // Darker background

    // Create camera with orbit controls
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2, // alpha (horizontal rotation)
      Math.PI / 3, // beta (vertical angle)
      12,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 25;

    // Create hemispheric light (ambient)
    const hemiLight = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemiLight.intensity = 0.5;
    hemiLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Create directional light with shadows
    const dirLight = new BABYLON.DirectionalLight(
      "dirLight",
      new BABYLON.Vector3(-1, -2, 1),
      scene
    );
    dirLight.intensity = 0.7;
    dirLight.position = new BABYLON.Vector3(5, 10, -5);

    // Enable shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Create materials for chessboard
    const lightSquareMat = new BABYLON.StandardMaterial("lightSquare", scene);
    lightSquareMat.diffuseColor = new BABYLON.Color3(0.95, 0.9, 0.8); // Cream white
    lightSquareMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const darkSquareMat = new BABYLON.StandardMaterial("darkSquare", scene);
    darkSquareMat.diffuseColor = new BABYLON.Color3(0.35, 0.18, 0.08); // Deep brown
    darkSquareMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Create materials for pieces using PBR for realistic wood look
    const whitePieceMat = new BABYLON.PBRMaterial("whitePiece", scene);
    // Light maple wood - warm, creamy with subtle grain
    whitePieceMat.albedoColor = new BABYLON.Color3(0.95, 0.88, 0.78);
    whitePieceMat.metallic = 0.0;
    whitePieceMat.roughness = 0.4; // Slightly polished wood
    whitePieceMat.subSurface.isRefractionEnabled = false;
    whitePieceMat.subSurface.isTranslucencyEnabled = false;
    // Add subtle clear coat for polished finish
    whitePieceMat.clearCoat.isEnabled = true;
    whitePieceMat.clearCoat.intensity = 0.1;
    whitePieceMat.clearCoat.roughness = 0.3;

    const blackPieceMat = new BABYLON.PBRMaterial("blackPiece", scene);
    // Dark walnut wood - rich, deep brown
    blackPieceMat.albedoColor = new BABYLON.Color3(0.22, 0.12, 0.06);
    blackPieceMat.metallic = 0.0;
    blackPieceMat.roughness = 0.35; // Slightly more polished
    blackPieceMat.subSurface.isRefractionEnabled = false;
    blackPieceMat.subSurface.isTranslucencyEnabled = false;
    // Add subtle clear coat for polished finish
    blackPieceMat.clearCoat.isEnabled = true;
    blackPieceMat.clearCoat.intensity = 0.15;
    blackPieceMat.clearCoat.roughness = 0.25;

    // Create 8x8 checkerboard
    const squareSize = 1;
    const boardSize = 8;
    const offset = (boardSize * squareSize) / 2 - squareSize / 2;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isDark = (row + col) % 2 === 1;
        const square = BABYLON.MeshBuilder.CreateBox(
          `square_${row}_${col}`,
          { width: squareSize, height: 0.15, depth: squareSize },
          scene
        );
        square.position.x = col * squareSize - offset;
        square.position.z = row * squareSize - offset;
        square.position.y = -0.075;
        square.material = isDark ? darkSquareMat : lightSquareMat;
        square.receiveShadows = true;
      }
    }

    // Create ground plane for shadows
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 30, height: 30 },
      scene
    );
    ground.position.y = -0.15;
    ground.receiveShadows = true;
    const groundMat = new BABYLON.StandardMaterial("ground", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    ground.material = groundMat;

    // Helper function to get square position
    const getSquarePosition = (row, col) => {
      return {
        x: col * squareSize - offset,
        z: (7 - row) * squareSize - offset, // Invert row for standard chess notation (1 at bottom)
      };
    };

    // Initialize game manager (starts the UIManager and Start Screen)
    const gameManager = new ChessGameManager(
      scene, 
      shadowGenerator, 
      getSquarePosition, 
      squareSize, 
      offset
    );

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        outline: "none",
      }}
    />
  );
}
