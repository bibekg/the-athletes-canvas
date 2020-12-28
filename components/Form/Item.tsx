import * as React from "react";
import Box from "components/Box";

interface Props extends React.ComponentProps<typeof Box> {
  children: React.ReactNode;
}

const Item = ({ children, ...boxProps }: Props) => (
  <Box display="flex" flexDirection="column" {...boxProps}>
    {children}
  </Box>
);

export default Item;
