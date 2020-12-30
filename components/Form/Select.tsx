import styled from "@emotion/styled"
import { FieldError } from "react-hook-form"
import theme from "styles/theme"
import {
  border,
  BorderProps,
  color,
  ColorProps,
  flexbox,
  FlexboxProps,
  fontSize,
  FontSizeProps,
  grid,
  GridProps,
  layout,
  LayoutProps,
  lineHeight,
  LineHeightProps,
  position,
  PositionProps,
  space,
  SpaceProps,
  typography,
  TypographyProps,
} from "styled-system"

interface SelectProps
  extends SpaceProps,
    PositionProps,
    ColorProps,
    BorderProps,
    LayoutProps,
    FlexboxProps,
    GridProps,
    FontSizeProps,
    LineHeightProps,
    TypographyProps {
  error?: FieldError | boolean
}

const Select = styled("select")<SelectProps>(
  {
    borderRadius: "6px",
    padding: "10px 8px",
    border: `1px solid ${theme.colors.africanElephant}`,
    "&::placeholder": {
      color: theme.colors.africanElephant,
    },
    "&:disabled": {
      backgroundColor: theme.colors.superlightGray,
    },
  },
  space,
  position,
  color,
  border,
  layout,
  flexbox,
  grid,
  fontSize,
  lineHeight,
  typography,
  (props) =>
    props.error
      ? {
          border: `2px solid ${theme.colors.invalidRed}`,
        }
      : undefined
)

Select.defaultProps = {
  ...theme.textStyles.input,
}

export default Select
