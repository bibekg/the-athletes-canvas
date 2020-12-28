import * as React from "react";
import { SVGProps } from "./types";
import { colors } from "styles";

const Caret = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.6569 16.2426L19.0711 14.8284L12 7.75735L4.92892 14.8285L6.34314 16.2427L12 10.5858L17.6569 16.2426Z"
      fill={color}
    />
  </svg>
);

Caret.defaultProps = {
  color: colors.white,
};

export default Caret;
