import * as React from "react";
import { SVGProps } from "./types";
import { colors } from "styles";

const SlashO = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path d="M8 16L16 8" stroke={color} strokeWidth="2" />
  </svg>
);

SlashO.defaultProps = {
  color: colors.invalidRed,
};

export default SlashO;
