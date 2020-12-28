import * as React from "react";
import { colors } from "styles";
import { SVGProps } from "./types";

const Stack = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 4V16H22V2H8V4H20Z" fill={color} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 8V22H16V8H2ZM14 10H4V20H14V10Z"
      fill={color}
    />
    <path d="M17 7H5V5H19V19H17V7Z" fill={color} />
  </svg>
);

Stack.defaultProps = {
  color: colors.white,
};

export default Stack;
