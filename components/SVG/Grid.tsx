import * as React from "react";
import { colors } from "styles";
import { SVGProps } from "./types";

const Grid = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11 6H5V11H11V6Z" fill={color} />
    <path d="M19 6H13V11H19V6Z" fill={color} />
    <path d="M11 13H5V18H11V13Z" fill={color} />
    <path d="M19 13H13V18H19V13Z" fill={color} />
    <path
      d="M21 4V20H3V4H21ZM21 2H3C1.895 2 1 2.895 1 4V20C1 21.105 1.895 22 3 22H21C22.105 22 23 21.105 23 20V4C23 2.895 22.105 2 21 2Z"
      fill={color}
    />
  </svg>
);

Grid.defaultProps = {
  color: colors.nomusBlue,
};

export default Grid;
