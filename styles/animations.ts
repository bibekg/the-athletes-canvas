import { keyframes } from "@emotion/react";

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const growIn = keyframes`
  from { transform: scale(0); }
  to { transform: scale(1); }
`;

export const rotate360 = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
