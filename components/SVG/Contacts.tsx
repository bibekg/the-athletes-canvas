import * as React from 'react'
import { SVGProps } from './types'

const Contacts = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 7C14.4 7 15.5 8.1 15.5 9.5C15.5 10.9 14.4 12 13 12C11.6 12 10.5 10.9 10.5 9.5C10.5 8.1 11.6 7 13 7ZM13 5C10.5 5 8.5 7 8.5 9.5C8.5 12 10.5 14 13 14C15.5 14 17.5 12 17.5 9.5C17.5 7 15.5 5 13 5Z"
      fill={color}
    />
    <path
      d="M20 1H4C2.3 1 1 2.3 1 4V20C1 21.7 2.3 23 4 23H20C21.7 23 23 21.7 23 20V4C23 2.3 21.7 1 20 1ZM5 19.2V3H20C20.5 3 21 3.5 21 4V19.1C19.8 17.5 17.2 15.2 13 15.2C8.8 15.2 6.2 17.6 5 19.2ZM6.2 21C6.9 19.9 9.1 17.2 13 17.2C17 17.2 19.1 19.9 19.9 21H6.2Z"
      fill={color}
    />
  </svg>
)

Contacts.defaultProps = {
  color: 'white',
}

export default Contacts
