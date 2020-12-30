import * as React from "react"
import { SVGProps } from "./types"
import { colors } from "styles"

const Info = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path
      d="M12 17L12 11H9.5M12 17H14.5M12 17H9.5M12 8L12 6"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
)

Info.defaultProps = {
  color: colors.primaryGreen,
}

export default Info
