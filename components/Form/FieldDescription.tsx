import * as Text from "components/Text"

interface Props {
  children: React.ReactNode
}

export const FieldDescription = ({ children }: Props) => {
  return FieldDescription == null ? null : (
    <Text.Body3 my={1}>{children}</Text.Body3>
  )
}

export default FieldDescription
