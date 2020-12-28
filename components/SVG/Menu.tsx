import * as React from "react";
import { SVGProps } from "./types";
import { colors } from "styles";

const Menu = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2 5H22M2 12H22M2 19H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

Menu.defaultProps = {
  color: colors.white,
};

export default Menu;
