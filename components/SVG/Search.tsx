import * as React from "react";
import { colors } from "styles";
import { SVGProps } from "./types";

const Search = ({ color, className }: SVGProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.319 14.4326C20.7628 11.2941 20.542 6.75345 17.6569 3.86827C14.5327 0.744079 9.46734 0.744079 6.34315 3.86827C3.21895 6.99247 3.21895 12.0578 6.34315 15.182C9.22833 18.0672 13.769 18.2879 16.9075 15.8442C16.921 15.8595 16.9351 15.8744 16.9497 15.8891L21.1924 20.1317C21.5829 20.5223 22.2161 20.5223 22.6066 20.1317C22.9971 19.7412 22.9971 19.108 22.6066 18.7175L18.364 14.4749C18.3493 14.4602 18.3343 14.4461 18.319 14.4326ZM16.2426 5.28249C18.5858 7.62563 18.5858 11.4246 16.2426 13.7678C13.8995 16.1109 10.1005 16.1109 7.75736 13.7678C5.41421 11.4246 5.41421 7.62563 7.75736 5.28249C10.1005 2.93934 13.8995 2.93934 16.2426 5.28249Z"
      fill={color}
    />
  </svg>
);

Search.defaultProps = {
  color: colors.africanElephant,
};

export default Search;
