"use client";

import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { pieceType, IPiece } from '@myproject/chess-logic';
import { RootState } from '../../store';
import { IGetCastingPayloadProps, positionActions } from '../../store/position.slice';
import { getImageUrl } from '../../helpers/piece.helper';

function Piece(props: IPiece): React.JSX.Element {
  const dispatch = useDispatch();
  const activeColor = useSelector((state: RootState) => state.game.activeColor);
  const castlingData = useSelector((state: RootState) => state.piece.castlingData[props.color])
  const pieces = useSelector((state: RootState) => state.piece.pieces);

  const handleClick = () => {
    if (activeColor !== props.color) {
      alert(`${activeColor} turn to play`);
      return;
    }
    dispatch(positionActions.makePieceActive({ piece: props, pieces }));
    if (props.type === pieceType.KING && (!castlingData.isDone && !castlingData.isKingMoved)) {
      const castingPayloadProps: IGetCastingPayloadProps = {
        piece: props,
        rooks: castlingData.rook.filter((item) => !item.isMoved).map((item) => item.position)
      }
      dispatch(positionActions.getKingCastlingBoxes(castingPayloadProps));
    }
  }
  const url = getImageUrl(props.type, props.color)
  return (
    <div
      onClick={() => handleClick()}
      className="absolute inset-0 bg-[length:60%] bg-no-repeat bg-center"
      style={{ backgroundImage: `url(${url})` }}
    />
  )
}

export { Piece }
