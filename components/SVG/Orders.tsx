import * as React from 'react'
import { SVGProps } from './types'

const Orders = ({ color, className }: SVGProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.8125 5.125H7.1875C6.6007 5.125 6.125 5.6007 6.125 6.1875V18.9375C6.125 19.5243 6.6007 20 7.1875 20H17.8125C18.3993 20 18.875 19.5243 18.875 18.9375V6.1875C18.875 5.6007 18.3993 5.125 17.8125 5.125ZM7.1875 3C5.42709 3 4 4.42709 4 6.1875V18.9375C4 20.6979 5.42709 22.125 7.1875 22.125H17.8125C19.5729 22.125 21 20.6979 21 18.9375V6.1875C21 4.42709 19.5729 3 17.8125 3H7.1875Z"
      fill={color}
    />
    <path d="M8.25 7.25H16.75V9.375H8.25V7.25Z" fill={color} />
    <path d="M8.25 11.5H16.75V13.625H8.25V11.5Z" fill={color} />
    <path d="M8.25 15.75H13.5625V17.875H8.25V15.75Z" fill={color} />
  </svg>
)

Orders.defaultProps = {
  color: '#38667A',
}

export default Orders
