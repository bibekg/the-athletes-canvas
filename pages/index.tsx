import * as Text from "components/Text";
import Head from "next/head";
import { css, Global } from "@emotion/react";
import React from "react";
import { MapViewer } from "components/MapViewer";
import Spinner from "components/Spinner";
import Box from "components/Box";
import { SummaryActivity } from "types/strava";
import Image from "components/Image";
import { colors } from "styles";

export default function App() {
  const [unuathorized, setUnauthorized] = React.useState(false);
  const [activities, setActivities] = React.useState<Array<SummaryActivity> | null>(null);

  React.useEffect(() => {
    const tryToFetchActivities = async () => {
      const result = await fetch("/api/strava/activities");
      if (result.ok) {
        const data = await result.json();
        if (data?.activities) {
          setActivities(data.activities);
        }
      } else {
        setUnauthorized(true);
      }
    };
    tryToFetchActivities();
  }, []);

  return (
    <>
      <Head>
        <title>Activity Map Visualizer</title>
      </Head>
      <Global
        styles={css`
          *,
          body,
          *:before,
          *:after {
            margin: 0;
          }
        `}
      />
      {activities && <MapViewer activities={activities} />}

      {unuathorized && (
        <Box
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Text.PageHeader color={colors.nomusBlue}>Activity Map Visualizer</Text.PageHeader>
          <a href="/api/auth/login">
            <Image role="button" src="/images/connect-with-strava-button.svg" />
          </a>
        </Box>
      )}

      {!unuathorized && !activities && (
        <Box
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner />
        </Box>
      )}
    </>
  );
}
