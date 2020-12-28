import * as React from "react";
import { colors } from "styles";
import { SVGProps } from "./types";

const Pen = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.7197 1.91083C17.3942 1.58539 16.8666 1.58539 16.5411 1.91083L15.8142 2.63779C14.8849 2.19387 13.7382 2.35676 12.9685 3.12645L4.12965 11.9653L8.8437 16.6793L17.6825 7.8405C18.4522 7.0708 18.6151 5.92408 18.1712 4.99481L18.8982 4.26785C19.2236 3.94241 19.2236 3.41477 18.8982 3.08934L17.7197 1.91083ZM14.163 9.00302L8.8437 14.3223L6.48668 11.9653L11.806 6.646L14.163 9.00302ZM15.6782 7.48779L16.504 6.66199C16.8295 6.33655 16.8295 5.80891 16.504 5.48348L15.3255 4.30496C15.0001 3.97953 14.4724 3.97953 14.147 4.30496L13.3212 5.13077L15.6782 7.48779Z"
      fill={color}
    />
    <path d="M1.66675 19.1253L3.43484 12.6431L8.14856 17.3575L1.66675 19.1253Z" fill={color} />
  </svg>
);

Pen.defaultProps = {
  color: colors.nomusBlue,
};

export default Pen;
