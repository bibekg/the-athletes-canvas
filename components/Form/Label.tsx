import styled from "@emotion/styled";
import { variant } from "styled-system";

import theme from "styles/theme";
import { LabelHTMLAttributes } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  variant?: keyof typeof theme.textStyles | null;
}

// @ts-ignore
const Label = styled<"label", LabelProps>("label")(
  {
    textTransform: "uppercase",
    display: "block",
  },
  variant({
    variants: theme.textStyles,
  }),
);

Label.defaultProps = {
  variant: "label",
};

export default Label;
