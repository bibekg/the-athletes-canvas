import * as React from "react";
import * as Text from "components/Text";
import { FieldError as FieldErrorType } from "react-hook-form";

interface Props {
  fieldError: FieldErrorType | null | undefined;
}

export const FieldError = ({ fieldError }: Props) => {
  return fieldError == null ? null : (
    <Text.Body3 color="brightCoral" m={1}>
      {fieldError.message}
    </Text.Body3>
  );
};

export default FieldError;
