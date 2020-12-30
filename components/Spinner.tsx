import * as React from "react"
import styled from "@emotion/styled"
import { animations, colors } from "styles"

interface Props {
  size?: string
}

const SpinnerStyledComponent = styled("div")<Props>`
  width: ${(props: Props) => props.size || "50px"};
  height: ${(props: Props) => props.size || "50px"};
  border-radius: 50%;
  border: calc(${(props) => props.size || "50px"} / 12.5) solid transparent;
  border-top: calc(${(props) => props.size || "50px"} / 12.5) solid
    ${colors.primaryGreen};
  animation: ${animations.rotate360} 1s ease infinite;
`

const Spinner = (props: Props) => (
  <SpinnerStyledComponent data-testid="spinner" {...props} />
)

export default Spinner
