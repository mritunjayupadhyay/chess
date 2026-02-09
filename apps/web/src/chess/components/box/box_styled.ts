import { allColorType } from '@myproject/chess-logic';
import type { colorType } from '@myproject/chess-logic';
import styled from 'styled-components';

export interface IBoxStyledProp {
  $color: colorType,
  $active: boolean,
  $clickable: boolean,
  $isChecked: boolean
}

export const BoxStyled = styled("div") <IBoxStyledProp>`
  position: relative;
  cursor: ${props => props.$clickable ? "pointer" : "default"};
  background-color: ${props => {
    if (props.$isChecked) {
      return 'rgba(255, 0, 0, 0.9)'
    }
    if (props.$active) {
      return 'rgba(255, 255, 0, 0.5)'
    }
    return props.$color === allColorType.LIGHT_COLOR ? props.theme.lightBackground : props.theme.darkBackground
  }};
`;

export const HiddenLabel = styled("label")`
 visibility: hidden;
`

export const CanVisitDiv = styled("div")`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 255, 0, 0.5);
`;

export const CanKillDiv = styled("div")`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(255, 0, 0, 0.5);
`;
