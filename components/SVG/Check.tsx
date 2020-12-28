import * as React from 'react'
import { SVGProps } from './types'

const Check = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5859 13.4142L7.75748 10.5858L6.34326 12L10.5859 16.2426L17.657 9.17158L16.2428 7.75736L10.5859 13.4142Z"
      fill={color}
    />
  </svg>
)

Check.defaultProps = {
  color: '#38667A',
}

export default Check
