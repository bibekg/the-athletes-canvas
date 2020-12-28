import * as React from "react";
import { SVGProps } from "./types";
import { colors } from "styles";

const PathBack = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 14H4V4H14V9H19V19H9V14ZM6 6H12V12H6V6Z"
      fill={color}
    />
  </svg>
);

PathBack.defaultProps = {
  color: colors.white,
};

export default PathBack;
