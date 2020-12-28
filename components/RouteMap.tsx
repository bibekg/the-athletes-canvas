import { css, SerializedStyles } from "@emotion/react";
import * as React from "react";

const normalizeLat = (lat: number) => 90 - lat;
const normalizeLon = (lon: number) => 180 + lon;

interface Coords {
  lat: number;
  lon: number;
}

const normalizeCoordinates = ({ lat, lon }: Coords) => ({
  x: normalizeLon(lon),
  y: normalizeLat(lat),
});

export interface GeoBounds {
  leftLon: number;
  rightLon: number;
  upperLat: number;
  lowerLat: number;
}

// Determines where on the specified canvas a {lat, lon} pair corresponds to such that
// the canvas represents a window into canvasBounds
const coordinatesToBoundedCanvasPoint = (
  { lat, lon }: Coords,
  context: CanvasRenderingContext2D,
  geoBounds: GeoBounds,
) => {
  const normalizedCoords = normalizeCoordinates({ lat, lon });
  const normalizedMinX = normalizeLon(geoBounds.leftLon);
  const normalizedMaxX = normalizeLon(geoBounds.rightLon);
  const normalizedMinY = normalizeLat(geoBounds.upperLat);
  const normalizedMaxY = normalizeLat(geoBounds.lowerLat);

  const xRange = normalizedMaxX - normalizedMinX;
  const yRange = normalizedMaxY - normalizedMinY;

  const xRelativeToBounds = (normalizedCoords.x - normalizedMinX) / xRange;
  const yRelativeToBounds = (normalizedCoords.y - normalizedMinY) / yRange;

  const canvas = context.canvas;
  const x = Math.round(xRelativeToBounds * canvas.width);
  const y = Math.round(yRelativeToBounds * canvas.height);
  return { x, y };
};

export type Waypoint = any;

export type Route = {
  id: any;
  waypoints: Array<Waypoint>;
};

export interface Props {
  routes: Array<Route>;
  geoBounds?: GeoBounds;
  pathResolution?: number;
  duration?: number;
  thickness?: number;
  // Pixels per degree
  mapResolution?: number;
  bgColor?: string | null;
  pathColor?: string;
  canvasStyles?: SerializedStyles;
}

export const RouteMap = ({
  routes,
  geoBounds = {
    leftLon: -180,
    rightLon: 180,
    upperLat: 90,
    lowerLat: -90,
  },
  pathResolution = 1,
  duration = 750,
  thickness = 1,
  mapResolution = 5000,
  bgColor = null,
  pathColor = "rgb(0,0,0,0.25)",
  canvasStyles = css({}),
}: Props) => {
  const [hasPlottedRoutes, setHasPlottedRoutes] = React.useState();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const routeMetadata = React.useRef<{
    [routeId: string]: { context: CanvasRenderingContext2D; hasStartedDrawing: boolean };
  }>({});

  const getCanvasContextForSegment = (routeId: string) => {
    if (!routeMetadata.current.hasOwnProperty(routeId)) {
      routeMetadata.current[routeId] = {
        context: canvasRef.current!.getContext("2d")!,
        hasStartedDrawing: false,
      };
    }
    return routeMetadata.current[routeId];
  };

  const addPath = (from: Coords, to: Coords, context: CanvasRenderingContext2D) => {
    const { x: fromX, y: fromY } = coordinatesToBoundedCanvasPoint(from, context, geoBounds);
    const { x: toX, y: toY } = coordinatesToBoundedCanvasPoint(to, context, geoBounds);

    context.lineWidth = thickness;
    context.strokeStyle = pathColor;

    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
  };

  const animateRenderWaypoints = async (
    waypoints: Array<Waypoint>,
    context: CanvasRenderingContext2D,
  ) => {
    const pointsToRender = waypoints.length;
    const delay = (duration / pointsToRender) * 0.8;

    return new Promise<void>((resolve) => {
      let waypointIndex = 1;
      let lastPointAddedAtTime: number | null = null;
      let lastAnimationFrame: number | null = null;

      let step: FrameRequestCallback = null;
      step = (timestamp: number) => {
        // If this is the first time we're adding points for this id, just add 1
        if (lastPointAddedAtTime == null) {
          const wp = waypoints[waypointIndex];
          addPath(waypoints[waypointIndex - 1], waypoints[waypointIndex], context);
          waypointIndex += 1;
          lastPointAddedAtTime = performance.now();
        } else {
          const timeDiff = timestamp - lastPointAddedAtTime;
          if (timeDiff >= delay) {
            const numPointsToRenderThisFrame = Math.ceil(timeDiff / delay);
            for (let i = 0; i < numPointsToRenderThisFrame; i += 1) {
              const wp = waypoints[waypointIndex];
              if (wp) {
                addPath(waypoints[waypointIndex - 1], waypoints[waypointIndex], context);
                waypointIndex += 1;
                lastPointAddedAtTime = performance.now();
              }
            }
          }
        }

        if (waypointIndex < waypoints.length) {
          lastAnimationFrame = window.requestAnimationFrame(step);
        } else {
          if (lastAnimationFrame != null) {
            window.cancelAnimationFrame(lastAnimationFrame);
          }
          resolve();
        }
      };
      lastAnimationFrame = window.requestAnimationFrame(step);
    });
  };

  const renderRoutes = async (routesToRender: Array<Route>) => {
    const canvas = canvasRef.current;
    if (canvas == null) return null;

    // Create a new context to paint the bg with
    const bgContext = canvas.getContext("2d");
    if (bgContext == null) return null;
    // Start with a blank canvas
    bgContext.clearRect(0, 0, canvas.width, canvas.height);

    // Color the backround if one is specified
    if (bgColor) {
      bgContext.fillStyle = bgColor;
      bgContext.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const route of routesToRender) {
      const routeContext = canvas.getContext("2d");
      if (routeContext == null) return null;

      if (pathResolution <= 0 || pathResolution > 1) {
        throw new Error(
          `Invalid value for pathResolution: ${pathResolution}. Must be in the range (0, 1]`,
        );
      }
      const renderEveryNthPoint = Math.ceil(1 / pathResolution);

      const waypointsToRender = route.waypoints.filter(
        (_: any, i: number) =>
          i === 0 || i % renderEveryNthPoint === 0 || i === route.waypoints.length - 1,
      );

      if (duration == null || duration === 0) {
        // Even with a 0 duration, it'll probably animate since it takes so long to plot all those points
        for (let i = 1; i < waypointsToRender.length; i += 1) {
          addPath(waypointsToRender[i - 1], waypointsToRender[i], routeContext);
        }
      } else {
        // Need to await here to make sure routes are rendered sequentially
        // Otherwise it'll kick off all routes' renderings ~simultaneously
        await animateRenderWaypoints(waypointsToRender, routeContext);
      }
    }
  };

  // Re-render the routes if props have changed
  React.useEffect(() => {
    // Cancel all animation frames since the props may have changed mid-animation
    for (var i = 1; i < 99999; i++) {
      window.clearInterval(i);
      window.cancelAnimationFrame(i);
    }
    renderRoutes(routes);
  }, [routes, thickness, geoBounds, mapResolution, pathResolution, bgColor, pathColor]);

  const MAX_WIDTH = 20000;

  const widthInDegrees = Math.abs(geoBounds.leftLon - geoBounds.rightLon);
  const heightInDegrees = Math.abs(geoBounds.upperLat - geoBounds.lowerLat);
  const aspectRatio = widthInDegrees / heightInDegrees;

  const effectiveWidth = Math.min(widthInDegrees * mapResolution, MAX_WIDTH);
  const effectiveHeight = effectiveWidth / aspectRatio;

  return (
    <canvas
      // @ts-ignore
      css={css(canvasStyles)}
      ref={canvasRef}
      width={effectiveWidth}
      height={effectiveHeight}
    />
  );
};
