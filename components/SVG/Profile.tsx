import * as React from 'react'
import { SVGProps } from './types'

const Profile = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3C16.9 3 21 7 21 12C21 17 17 21 12 21C7 21 3 17 3 12C3 7 7.1 3 12 3ZM12 1C5.9 1 1 5.9 1 12C1 18.1 5.9 23 12 23C18.1 23 23 18.1 23 12C23 5.9 18.1 1 12 1Z"
      fill={color}
    />
    <path
      d="M12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7ZM12 5C9.8 5 8 6.8 8 9C8 11.2 9.8 13 12 13C14.2 13 16 11.2 16 9C16 6.8 14.2 5 12 5Z"
      fill={color}
    />
    <path
      d="M12 15C17 15 19.1 19.3 19.1 19.3"
      stroke={color}
      strokeWidth="2"
      strokeMiterlimit="10"
    />
    <path
      d="M12 15C7.00002 15 4.90002 19.3 4.90002 19.3"
      stroke={color}
      strokeWidth="2"
      strokeMiterlimit="10"
    />
  </svg>
)

Profile.defaultProps = {
  color: '#38667A',
}

export default Profile
