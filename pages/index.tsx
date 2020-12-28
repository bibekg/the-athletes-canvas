import Head from "next/head";
import { css, Global } from "@emotion/react";
import React from "react";
import { Route } from "components/RouteMap";
import { MapViewer } from "components/MapViewer";
import polyline from "@mapbox/polyline";

export default function App() {
  const [routes, setRoutes] = React.useState<Array<Route> | null>(null);

  React.useEffect(() => {
    const getRoutesFromStrava = async () => {
      const result = await fetch("/api/strava/activities");
      if (result.status === 401) {
        window.location.replace("/api/auth/login");
      }
      const data = await result.json();
      const _routes = data.activities
        .map((act: any) => {
          if (act.map.summary_polyline == null) {
            console.log("skipping due to missing summary_polyline");
            return null;
          }

          try {
            const decodedPolyline = polyline.decode(act.map.summary_polyline);
            const waypoints = decodedPolyline.map(([lat, lon]) => ({
              lat,
              lon,
            }));
            return {
              id: act.id,
              waypoints,
            };
          } catch (err) {
            console.log(err);
            return null;
          }
        })
        .filter(Boolean);
      console.log({ _routes });
      setRoutes(_routes);
    };
    getRoutesFromStrava();
  }, []);

  return (
    <>
      <Head>
        <title>Strava Activity Visualizer</title>
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
      {routes ? <MapViewer routes={routes} /> : null}
    </>
  );
}
