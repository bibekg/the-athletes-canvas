import * as React from "react"
import isPropValid from "@emotion/is-prop-valid"
import styled from "@emotion/styled"
import { space, SpaceProps, layout, LayoutProps } from "styled-system"
import NextLink from "next/link"
import * as buttonlikeStyles from "styles/components/buttonlike"
import theme from "styles/theme"

const linkBaseStyles = (props: LinkStyleProps) => ({
  textDecoration: props.underline ? "underline" : "none",
  color: props.color ?? theme.colors.linkBlue,
})

interface LinkStyleProps extends SpaceProps, LayoutProps {
  buttonStyle?: keyof typeof buttonlikeStyles.styleVariants
  buttonSize?: keyof typeof buttonlikeStyles.sizeVariants
  underline?: boolean
  color?: string
  overrideStyles?: any
}

// We sometimes want to style Links identically to the way we style
// Buttons so this component creates an easy-use adapter via
// the buttonStyle, and buttonSize props

// We export both an internal and external link from this file
// They are styled identically but are based on a different
// underlying component (<a /> vs React Router's <Link />) so
// the styled component definition args are identical
const args = [
  space,
  layout,
  (props: LinkStyleProps) =>
    props.buttonStyle || props.buttonSize
      ? {
          ...buttonlikeStyles.baseButtonStyles,
          // Mimic button variants with a "button-" prefix
          ...(props.buttonStyle
            ? buttonlikeStyles.styleVariants[props.buttonStyle]
            : {}),
          ...(props.buttonSize
            ? buttonlikeStyles.sizeVariants[props.buttonSize]
            : {}),
          textDecoration: "none",
        }
      : linkBaseStyles(props),
  (props: LinkStyleProps) => props.overrideStyles,
] as const

interface InternalLinkProps
  extends React.ComponentProps<typeof NextLink>,
    LinkStyleProps {}

const ExternalLink = styled("a", {
  shouldForwardProp: (prop) => isPropValid(prop) && prop !== "underline",
})(...args)
const InternalLink = styled(NextLink, {
  shouldForwardProp: (prop) => isPropValid(prop) && prop !== "underline",
})(...args)

const defaultProps = {
  buttonStyle: undefined,
  buttonSize: undefined,
} as const
ExternalLink.defaultProps = defaultProps
InternalLink.defaultProps = defaultProps

interface UnifiedLinkProps extends InternalLinkProps, LinkStyleProps {
  href: string
  type?: "internal" | "external"
  ref?: any
  as?: any
}

const isExternalLink = (url: string) => {
  return (
    typeof url === "string" &&
    (url.startsWith("http") || url.startsWith("mailto"))
  )
}

// An isomorphic Link component where the link is always passed in via the "to" prop so that you
// don't have to decide whether to pass in "to" for the react-router InternalLink or "href" for
// the traditional <a /> ExternalLink
const UnifiedLink = ({ href, ref, ...props }: UnifiedLinkProps) => {
  // TODO: Figure out how to properly pass ref through, hasn't been necessary yet so punting on this
  return href != null && isExternalLink(href) ? (
    <ExternalLink ref={ref} {...props} href={href} />
  ) : (
    <InternalLink {...props} href={href} />
  )
}

export { ExternalLink, InternalLink, UnifiedLink as Link }
export default UnifiedLink

// const NewLink = styled(NextLink)
