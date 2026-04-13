import { pieceType, colorType } from "@myproject/chess-logic";

export interface SquareData {
  type: pieceType;
  color: colorType;
}

/**
 * Parse the piece-placement section of a FEN string into an 8x8 board.
 * Returns board[rank][file] where rank 0 = rank 8 (top) and file 0 = a-file.
 */
export function parseFen(fen: string): (SquareData | null)[][] {
  const placement = fen.split(" ")[0];
  const fenCharToType: Record<string, pieceType> = {
    k: pieceType.KING,
    q: pieceType.QUEEN,
    r: pieceType.ROOK,
    b: pieceType.BISHOP,
    n: pieceType.KNIGHT,
    p: pieceType.PAWN,
  };

  const board: (SquareData | null)[][] = [];

  for (const rankStr of placement.split("/")) {
    const row: (SquareData | null)[] = [];
    for (const ch of rankStr) {
      if (ch >= "1" && ch <= "8") {
        for (let i = 0; i < parseInt(ch, 10); i++) row.push(null);
      } else {
        const lower = ch.toLowerCase();
        const type = fenCharToType[lower];
        if (type) {
          const color: colorType = ch === ch.toUpperCase() ? "light" : "dark";
          row.push({ type, color });
        }
      }
    }
    board.push(row);
  }

  return board;
}
