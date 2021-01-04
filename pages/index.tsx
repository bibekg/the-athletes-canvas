import { css } from "@emotion/react"
import Box from "components/Box"
import Button from "components/Button"
import Image from "components/Image"
import { Link } from "components/Link"
import { RouteMap } from "components/RouteMap"
import * as Text from "components/Text"
import Head from "next/head"
import React from "react"
import { colors } from "styles"
import { FALLBACK_GEO_BOUNDS, getGeoBoundsForRoutes } from "utils/geo"
import { activitiesToRoutes } from "utils/strava"
import { useStravaData } from "utils/useStravaData"

const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://athlete-canvas.vercel.app"
    : `http://localhost:${process.env.PORT}`

const stravaOauthUrlParams = new URLSearchParams()
stravaOauthUrlParams.set("client_id", "58724")
stravaOauthUrlParams.set("redirect_uri", baseUrl + "/api/auth/strava-callback")
stravaOauthUrlParams.set("response_type", "code")
stravaOauthUrlParams.set("scope", "activity:read_all")
const stravaOauthURL = `https://www.strava.com/oauth/authorize?${stravaOauthUrlParams.toString()}`

export default function App() {
  const { activities, isLoggedIn } = useStravaData()

  const routeMapProps = React.useMemo(() => {
    if (activities) {
      const routes = activitiesToRoutes(activities)
      const geoBounds = getGeoBoundsForRoutes(routes) ?? FALLBACK_GEO_BOUNDS
      return { routes, geoBounds }
    } else {
      return null
    }
  }, [activities])

  return (
    <>
      <Head>
        <title>The Athlete's Canvas</title>
      </Head>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        position="relative"
        bg={colors.offWhite}
      >
        {isLoggedIn && routeMapProps && (
          <Box
            display="flex"
            position="fixed"
            top="0"
            left="0"
            width="100%"
            height="100%"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <RouteMap
              {...routeMapProps}
              animationDuration={300}
              mapResolution={0.2}
              bgColor={colors.offWhite}
              pathColor="rgba(0,0,0,0.1)"
              canvasStyles={css({
                width: "100%",
              })}
            />
          </Box>
        )}

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          position="relative"
          p={3}
          bg={colors.offWhite}
        >
          <Text.BrandHeader color={colors.primaryGreen}>
            The Athlete's Canvas
          </Text.BrandHeader>
          {isLoggedIn && (
            <Link href="/customize">
              <Button px={4} variant="secondary" size="big">
                Customize your canvas
              </Button>
            </Link>
          )}
          {isLoggedIn === false && (
            <a href={stravaOauthURL}>
              <Image
                role="button"
                src="/images/connect-with-strava-button.svg"
              />
            </a>
          )}
          {isLoggedIn === null && (
            <Text.Body2>Fetching your activities...</Text.Body2>
          )}
        </Box>
      </Box>
    </>
  )
}
