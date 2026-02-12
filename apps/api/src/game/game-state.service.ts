import { Injectable } from '@nestjs/common';
import {
    IPiece,
    IBoxPosition,
    IPosition,
    IGetAllPossibleMove,
    ICastlingData,
    ICastlingBox,
    pieceType,
    piecePoint,
    allColorType,
    colorType,
    HorizontalKeys,
    VerticalKeys,
    getLabel,
    getPossibleMove,
    isInDanger,
    castlingData as initialCastlingData,
    getUpdatedCastlingData,
    getCastlingBox,
} from '@myproject/chess-logic';
import { IServerGameState, IMoveRecord } from '@myproject/shared';

@Injectable()
export class GameStateService {
    private gameStates = new Map<string, IServerGameState>();

    initializeGame(roomId: string): IServerGameState {
        const pieces = this.createInitialPieces();
        const allPositions = this.createInitialPositions(pieces);
        const castlingDataCopy: Record<colorType, ICastlingData> = {
            [allColorType.LIGHT_COLOR]: JSON.parse(JSON.stringify(initialCastlingData[allColorType.LIGHT_COLOR])),
            [allColorType.DARK_COLOR]: JSON.parse(JSON.stringify(initialCastlingData[allColorType.DARK_COLOR])),
        };

        const gameState: IServerGameState = {
            pieces,
            allPositions,
            castlingData: castlingDataCopy,
            activeColor: allColorType.LIGHT_COLOR,
            check: undefined,
            checkmate: undefined,
            moveHistory: [],
        };

        this.gameStates.set(roomId, gameState);
        return gameState;
    }

    validateAndExecuteMove(
        roomId: string,
        piecePosition: IPosition,
        targetPosition: IPosition,
        playerColor: colorType,
    ): { success: boolean; gameState?: IServerGameState; error?: string; captured?: pieceType } {
        const state = this.gameStates.get(roomId);
        if (!state) return { success: false, error: 'Game not found' };

        if (state.activeColor !== playerColor) {
            return { success: false, error: 'Not your turn' };
        }

        const pieceLabel = getLabel(piecePosition.x, piecePosition.y);
        const box = state.allPositions[pieceLabel];
        if (!box || !box.piece) {
            return { success: false, error: 'No piece at position' };
        }

        const piece = box.piece;
        if (piece.color !== playerColor) {
            return { success: false, error: 'Not your piece' };
        }

        // Get possible moves
        const getPossibleMoveArgs: IGetAllPossibleMove = {
            allBoxes: { ...state.allPositions },
            piece,
        };
        const { allPossibleKillBoxes, allPossibleVisitingBoxes } = getPossibleMove(getPossibleMoveArgs);

        // Filter invalid moves (moves that leave own king in check)
        const validKillBoxes = this.filterInvalidMoves(piece, state.pieces, state.allPositions, piece.color, allPossibleKillBoxes);
        const validVisitBoxes = this.filterInvalidMoves(piece, state.pieces, state.allPositions, piece.color, allPossibleVisitingBoxes);

        const targetLabel = getLabel(targetPosition.x, targetPosition.y);
        const isValidMove = validVisitBoxes[targetLabel] || validKillBoxes[targetLabel];

        if (!isValidMove) {
            return { success: false, error: 'Invalid move' };
        }

        // Check if capturing a piece
        const targetBox = state.allPositions[targetLabel];
        const capturedPieceType = targetBox?.piece?.type;

        // Execute the move
        state.pieces = this.updatePiecesAfterMovement(state.pieces, piece, targetPosition);
        state.allPositions = this.updatePositionsAfterMove(state.allPositions, piece, targetPosition);

        // Update castling data
        state.castlingData[piece.color] = getUpdatedCastlingData(state.castlingData[piece.color], piece);

        // Check/checkmate detection
        const { check, checkmate } = this.getCheckAndCheckmate(
            state.pieces, state.allPositions, piece, targetPosition, piece.color,
        );
        state.check = check;
        state.checkmate = checkmate;

        // Record move
        state.moveHistory.push({
            pieceType: piece.type,
            from: piecePosition,
            to: targetPosition,
            color: piece.color,
            captured: capturedPieceType,
            timestamp: Date.now(),
        });

        // Switch active color
        state.activeColor = this.getOppositeColor(state.activeColor);

        return { success: true, gameState: state, captured: capturedPieceType };
    }

    validateAndExecuteCastling(
        roomId: string,
        kingPosition: IPosition,
        rookPosition: IPosition,
        playerColor: colorType,
    ): { success: boolean; gameState?: IServerGameState; error?: string } {
        const state = this.gameStates.get(roomId);
        if (!state) return { success: false, error: 'Game not found' };

        if (state.activeColor !== playerColor) {
            return { success: false, error: 'Not your turn' };
        }

        const kingLabel = getLabel(kingPosition.x, kingPosition.y);
        const kingBox = state.allPositions[kingLabel];
        if (!kingBox?.piece || kingBox.piece.type !== pieceType.KING || kingBox.piece.color !== playerColor) {
            return { success: false, error: 'Invalid king position' };
        }

        const king = kingBox.piece;
        const colorCastlingData = state.castlingData[playerColor];

        if (colorCastlingData.isDone || colorCastlingData.isKingMoved) {
            return { success: false, error: 'Castling not available' };
        }

        // Verify the rook hasn't moved
        const rookMoved = colorCastlingData.rook.find(
            r => r.position.x === rookPosition.x && r.position.y === rookPosition.y,
        );
        if (!rookMoved || rookMoved.isMoved) {
            return { success: false, error: 'Rook has moved, castling not available' };
        }

        // Use chess-logic to compute castling box
        const getPossibleMoveArgs: IGetAllPossibleMove = {
            allBoxes: { ...state.allPositions },
            piece: king,
        };
        const { value } = getCastlingBox(getPossibleMoveArgs, rookPosition);

        if (!value) {
            return { success: false, error: 'Castling path is blocked' };
        }

        const { kingNextPosition, rookNextPosition } = value;

        // Execute castling: update positions
        const rookLabel = getLabel(rookPosition.x, rookPosition.y);
        const newKingLabel = getLabel(kingNextPosition.x, kingNextPosition.y);
        const newRookLabel = getLabel(rookNextPosition.x, rookNextPosition.y);

        const rookPiece = state.allPositions[rookLabel]?.piece;
        if (!rookPiece) {
            return { success: false, error: 'Rook not found' };
        }

        // Update allPositions
        state.allPositions[newKingLabel] = {
            ...state.allPositions[newKingLabel],
            piece: { ...king, position: kingNextPosition },
        };
        state.allPositions[newRookLabel] = {
            ...state.allPositions[newRookLabel],
            piece: { ...rookPiece, position: rookNextPosition },
        };
        state.allPositions[kingLabel] = { ...state.allPositions[kingLabel], piece: undefined };
        state.allPositions[rookLabel] = { ...state.allPositions[rookLabel], piece: undefined };

        // Update pieces array
        state.pieces = state.pieces.map(p => {
            if (p.position.x === kingPosition.x && p.position.y === kingPosition.y) {
                return { ...p, position: kingNextPosition };
            }
            if (p.position.x === rookPosition.x && p.position.y === rookPosition.y) {
                return { ...p, position: rookNextPosition };
            }
            return p;
        });

        // Mark castling as done
        state.castlingData[playerColor] = {
            isDone: true,
            isKingMoved: true,
            rook: colorCastlingData.rook.map(r => ({ ...r, isMoved: true })),
        };

        // Check/checkmate detection after castling
        const { check, checkmate } = this.getCheckAndCheckmate(
            state.pieces, state.allPositions, king, kingNextPosition, playerColor,
        );
        state.check = check;
        state.checkmate = checkmate;

        // Record move
        state.moveHistory.push({
            pieceType: pieceType.KING,
            from: kingPosition,
            to: kingNextPosition,
            color: playerColor,
            timestamp: Date.now(),
        });

        // Switch active color
        state.activeColor = this.getOppositeColor(state.activeColor);

        return { success: true, gameState: state };
    }

    removeGame(roomId: string): void {
        this.gameStates.delete(roomId);
    }

    getGameState(roomId: string): IServerGameState | undefined {
        return this.gameStates.get(roomId);
    }

    // --- Private helpers ---

    private filterInvalidMoves(
        piece: IPiece,
        pieces: IPiece[],
        allPositions: Record<string, IBoxPosition>,
        color: colorType,
        boxes: Record<string, IBoxPosition>,
    ): Record<string, IBoxPosition> {
        const validBoxes: Record<string, IBoxPosition> = {};
        for (const [key, value] of Object.entries(boxes)) {
            const updatedPieces = this.updatePiecesAfterMovement(pieces, piece, value.position);
            const allPositionsAfterMove = this.updatePositionsAfterMove(allPositions, piece, value.position);
            if (this.checkKingInDanger(updatedPieces, allPositionsAfterMove, color) === false) {
                validBoxes[key] = value;
            }
        }
        return validBoxes;
    }

    private updatePiecesAfterMovement(pieces: IPiece[], movedPiece: IPiece, newPosition: IPosition): IPiece[] {
        return pieces.map(item => {
            if (item.position.x === movedPiece.position.x && item.position.y === movedPiece.position.y) {
                return { ...movedPiece, position: newPosition };
            }
            if (item.position.x === newPosition.x && item.position.y === newPosition.y) {
                return { ...item, isAlive: false, position: { x: -1, y: -1 } };
            }
            return item;
        });
    }

    private updatePositionsAfterMove(
        allPositions: Record<string, IBoxPosition>,
        movedPiece: IPiece,
        newPosition: IPosition,
    ): Record<string, IBoxPosition> {
        const updated = { ...allPositions };
        const label = getLabel(newPosition.x, newPosition.y);
        const activePieceLabel = getLabel(movedPiece.position.x, movedPiece.position.y);
        updated[label] = { ...updated[label], piece: { ...movedPiece, position: newPosition } };
        updated[activePieceLabel] = { ...updated[activePieceLabel], piece: undefined };
        return updated;
    }

    private checkKingInDanger(
        pieces: IPiece[],
        allPositions: Record<string, IBoxPosition>,
        color: colorType,
    ): boolean {
        const king = pieces.find(p => p.color === color && p.type === pieceType.KING);
        if (!king) return false;
        const enemyPieces = pieces.filter(p => p.color !== color && p.isAlive);
        return isInDanger(enemyPieces, allPositions, king.position) as boolean;
    }

    private getCheckAndCheckmate(
        pieces: IPiece[],
        allPositions: Record<string, IBoxPosition>,
        movedPiece: IPiece,
        newPosition: IPosition,
        color: colorType,
    ): { check: colorType | undefined; checkmate: colorType | undefined } {
        let check: colorType | undefined = undefined;
        let checkmate: colorType | undefined = undefined;
        const oppositeColor = this.getOppositeColor(color);

        const king = pieces.find(p => p.color === oppositeColor && p.type === pieceType.KING);
        if (!king) return { check, checkmate };

        const enemyPieces = pieces.filter(p => p.color !== oppositeColor && p.isAlive);

        if (isInDanger(enemyPieces, allPositions, king.position)) {
            check = oppositeColor;
            const allPositionsAfterMove = this.updatePositionsAfterMove(allPositions, movedPiece, newPosition);

            const getPossibleMoveArgs: IGetAllPossibleMove = {
                allBoxes: allPositionsAfterMove,
                piece: king,
            };
            const { allPossibleKillBoxes, allPossibleVisitingBoxes } = getPossibleMove(getPossibleMoveArgs);
            checkmate = oppositeColor;
            for (const move of Object.values({ ...allPossibleKillBoxes, ...allPossibleVisitingBoxes })) {
                if (!isInDanger(enemyPieces, allPositions, move.position)) {
                    checkmate = undefined;
                    break;
                }
            }
        }
        return { check, checkmate };
    }

    private getOppositeColor(color: colorType): colorType {
        return color === allColorType.LIGHT_COLOR ? allColorType.DARK_COLOR : allColorType.LIGHT_COLOR;
    }

    private createInitialPieces(): IPiece[] {
        const pieces: IPiece[] = [];

        // Kings
        pieces.push({ position: { x: 4, y: 0 }, isAlive: true, type: pieceType.KING, color: allColorType.LIGHT_COLOR, points: piecePoint.KING });
        pieces.push({ position: { x: 4, y: 7 }, isAlive: true, type: pieceType.KING, color: allColorType.DARK_COLOR, points: piecePoint.KING });

        // Queens
        pieces.push({ position: { x: 3, y: 0 }, isAlive: true, type: pieceType.QUEEN, color: allColorType.LIGHT_COLOR, points: piecePoint.QUEEN });
        pieces.push({ position: { x: 3, y: 7 }, isAlive: true, type: pieceType.QUEEN, color: allColorType.DARK_COLOR, points: piecePoint.QUEEN });

        // Rooks
        pieces.push({ position: { x: 0, y: 0 }, isAlive: true, type: pieceType.ROOK, color: allColorType.LIGHT_COLOR, points: piecePoint.ROOK });
        pieces.push({ position: { x: 7, y: 0 }, isAlive: true, type: pieceType.ROOK, color: allColorType.LIGHT_COLOR, points: piecePoint.ROOK });
        pieces.push({ position: { x: 0, y: 7 }, isAlive: true, type: pieceType.ROOK, color: allColorType.DARK_COLOR, points: piecePoint.ROOK });
        pieces.push({ position: { x: 7, y: 7 }, isAlive: true, type: pieceType.ROOK, color: allColorType.DARK_COLOR, points: piecePoint.ROOK });

        // Bishops
        pieces.push({ position: { x: 2, y: 0 }, isAlive: true, type: pieceType.BISHOP, color: allColorType.LIGHT_COLOR, points: piecePoint.BISHOP });
        pieces.push({ position: { x: 5, y: 0 }, isAlive: true, type: pieceType.BISHOP, color: allColorType.LIGHT_COLOR, points: piecePoint.BISHOP });
        pieces.push({ position: { x: 2, y: 7 }, isAlive: true, type: pieceType.BISHOP, color: allColorType.DARK_COLOR, points: piecePoint.BISHOP });
        pieces.push({ position: { x: 5, y: 7 }, isAlive: true, type: pieceType.BISHOP, color: allColorType.DARK_COLOR, points: piecePoint.BISHOP });

        // Knights
        pieces.push({ position: { x: 1, y: 0 }, isAlive: true, type: pieceType.KNIGHT, color: allColorType.LIGHT_COLOR, points: piecePoint.KNIGHT });
        pieces.push({ position: { x: 6, y: 0 }, isAlive: true, type: pieceType.KNIGHT, color: allColorType.LIGHT_COLOR, points: piecePoint.KNIGHT });
        pieces.push({ position: { x: 1, y: 7 }, isAlive: true, type: pieceType.KNIGHT, color: allColorType.DARK_COLOR, points: piecePoint.KNIGHT });
        pieces.push({ position: { x: 6, y: 7 }, isAlive: true, type: pieceType.KNIGHT, color: allColorType.DARK_COLOR, points: piecePoint.KNIGHT });

        // Pawns
        for (let i = 0; i < 8; i++) {
            pieces.push({ position: { x: i, y: 1 }, isAlive: true, type: pieceType.PAWN, color: allColorType.LIGHT_COLOR, points: piecePoint.PAWN });
            pieces.push({ position: { x: i, y: 6 }, isAlive: true, type: pieceType.PAWN, color: allColorType.DARK_COLOR, points: piecePoint.PAWN });
        }

        return pieces;
    }

    private createInitialPositions(pieces: IPiece[]): Record<string, IBoxPosition> {
        const allBoxAsObj: Record<string, IBoxPosition> = {};

        for (let j = VerticalKeys.length - 1; j >= 0; j--) {
            for (let i = 0; i < HorizontalKeys.length; i++) {
                const position: IPosition = { x: i, y: j };
                const label = getLabel(i, j);
                allBoxAsObj[label] = { label, position };
            }
        }

        for (const piece of pieces) {
            const label = getLabel(piece.position.x, piece.position.y);
            if (allBoxAsObj[label]) {
                allBoxAsObj[label] = { ...allBoxAsObj[label], piece };
            }
        }

        return allBoxAsObj;
    }
}
