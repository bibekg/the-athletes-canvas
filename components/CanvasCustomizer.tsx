import { css } from "@emotion/react"
import Box from "components/Box"
import Button from "components/Button"
import * as Form from "components/Form"
import {
  RouteMap,
  RouteMapDoneDrawingCallback,
  RouteMapRef,
} from "components/RouteMap"
import * as Text from "components/Text"
import dateFormat from "dateformat"
import _ from "lodash"
import mapboxgl from "mapbox-gl"
import * as React from "react"
import { AlphaPicker, CompactPicker, RGBColor } from "react-color"
import { Controller, useForm } from "react-hook-form"
import { colors } from "styles"
import shadows from "styles/shadows"
import { GeoBounds, Route } from "types/geo"
import { SummaryActivity } from "types/strava"
import { ActivityType } from "types/strava/enums"
import { FALLBACK_GEO_BOUNDS, getGeoBoundsForRoutes } from "utils/geo"
import { activitiesToRoutes, activityTypeEmojis } from "utils/strava"
import { hasOwnProperty } from "utils/typecheck"
import Image from "./Image"
import Link from "./Link"
import MapboxMap from "./MapboxMap"
import SegmentedController, { TabActionType } from "./SegmentedController"

const geoBoundsMemo: Record<string, GeoBounds> = {}
const memoizedGeoBounds = (bounds: GeoBounds) => {
  const key = [bounds.west, bounds.east, bounds.north, bounds.south].join("-")
  if (!geoBoundsMemo.hasOwnProperty(key)) {
    geoBoundsMemo[key] = bounds
  }
  return geoBoundsMemo[key]
}

const makeColorString = (color: RGBColor) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`

const resolutionOptions = [
  { value: 0.1, label: "Low (best for spread-out activities)" },
  { value: 0.25, label: "Medium" },
  { value: 1.0, label: "High (best for tightly-grouped activities)" },
]

const getOptimalResolutionForBounds = (bounds: GeoBounds) => {
  const width = Math.abs(bounds.west - bounds.east)
  const height = Math.abs(bounds.north - bounds.south)
  const area = width * height
  if (area > 5) return resolutionOptions[0]
  if (area > 2.5) return resolutionOptions[1]
  return resolutionOptions[2]
}

interface ActivityFilteringOptions {
  startDate: string
  endDate: string
  activityTypes: Array<ActivityType>
  west: number
  east: number
  north: number
  south: number
}
interface VisualizationOptions extends GeoBounds {
  thickness: number
  mapResolution: number
  pathResolution: number
  bgColor: RGBColor | null
  pathColor: RGBColor
}

interface CustomizationOptions
  extends ActivityFilteringOptions,
    VisualizationOptions {}

interface Props {
  activities: Array<SummaryActivity>
}

const getActivityTypeLabel = (activityType: ActivityType) =>
  `${activityTypeEmojis[activityType]} ${activityType}`

const toTimestamp = (d: Date | string) => new Date(d).getTime() / 1000

const optionsFromQueryParams = (() => {
  // Skip this for server-side rendering calls
  if (!process.browser) {
    return {}
  }
  const params = new URLSearchParams(window.location.search)
  const west = params.get("west")
  const east = params.get("east")
  const north = params.get("north")
  const south = params.get("south")
  const hasCustomCoords =
    west != null && east != null && north != null && south != null

  return {
    startDate: params.get("startDate") ?? undefined,
    endDate: params.get("endDate") ?? undefined,
    activityTypes: (params
      .get("activityTypes")
      ?.split(",")
      .filter((at) => hasOwnProperty(activityTypeEmojis, at)) ?? undefined) as
      | Array<ActivityType>
      | undefined,
    geoBounds: hasCustomCoords
      ? {
          west: Number(west),
          east: Number(east),
          north: Number(north),
          south: Number(south),
        }
      : null,
  }
})()

const routesFilterer = (options: Partial<ActivityFilteringOptions>) => (
  route: Route
) =>
  // Filter for date range
  (options.startDate == null ||
    toTimestamp(route.startDate) > toTimestamp(options.startDate)) &&
  (options.endDate == null ||
    toTimestamp(route.startDate) < toTimestamp(options.endDate)) &&
  // Filter for activity type
  (options.activityTypes == null ||
    options.activityTypes.includes(route.type)) &&
  // If user wants to use custom coords, filter using those
  route.waypoints.some(
    (waypoint) =>
      (options.south == null || waypoint.lat > options.south) &&
      (options.north == null || waypoint.lat < options.north) &&
      (options.west == null || waypoint.lon > options.west) &&
      (options.east == null || waypoint.lon < options.east)
  )

export const CanvasCustomizer = ({ activities }: Props) => {
  // Generate list of activity type options {value, label} that there are activities for
  const activityTypeOptions: Array<{
    value: ActivityType
    label: string
  }> = React.useMemo(
    () =>
      activities
        .map((activity) => activity.type)
        .filter((item, index, arr) => arr.indexOf(item) === index)
        .map((item) => ({
          value: item,
          label: getActivityTypeLabel(item),
        })),
    [activities]
  )
  const [imageResolution, setImageResolution] = React.useState<{
    width: number
    height: number
  } | null>(null)

  const routeMapRef = React.useRef<RouteMapRef | null>(null)
  const coordinateBoundsMapRef = React.useRef<mapboxgl.Map | null>(null)

  const routes = React.useMemo(() => activitiesToRoutes(activities), [
    activities,
  ])

  const geoBoundsForAllRoutes = React.useMemo(
    () => getGeoBoundsForRoutes(routes),
    [routes]
  )

  const defaultActivityTypes =
    optionsFromQueryParams.activityTypes ??
    activityTypeOptions.map((o) => o.value)
  const defaultStartDate = optionsFromQueryParams.startDate ?? "2020-01-01"
  const defaultEndDate =
    optionsFromQueryParams.endDate ?? new Date().toISOString().substr(0, 10)

  const defaultRoutesToRender = React.useMemo(
    () =>
      geoBoundsForAllRoutes
        ? routes.filter(
            routesFilterer({
              activityTypes: defaultActivityTypes,
              startDate: defaultStartDate,
              endDate: defaultEndDate,
            })
          )
        : routes,
    [routes, geoBoundsForAllRoutes]
  )
  const geoBoundsForDefaultRoutesToRender = React.useMemo(
    () => getGeoBoundsForRoutes(defaultRoutesToRender),
    [routes]
  )

  const defaultGeoBounds = {
    // We waterfall through a few different options
    ...FALLBACK_GEO_BOUNDS,
    ...geoBoundsForDefaultRoutesToRender,
    ...optionsFromQueryParams.geoBounds,
  }

  const defaultValues: CustomizationOptions = {
    activityTypes: defaultActivityTypes,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    thickness: 0.5,
    mapResolution: getOptimalResolutionForBounds(defaultGeoBounds).value,
    pathResolution: 1,
    bgColor: { r: 255, g: 255, b: 255, a: 1.0 },
    pathColor: { r: 0, g: 0, b: 0, a: 0.2 },
    ...defaultGeoBounds,
  }
  const [mode, setMode] = React.useState<"routes" | "visualization">("routes")
  const {
    register,
    watch,
    control,
    handleSubmit,
    setValue,
  } = useForm<CustomizationOptions>({
    mode: "onChange",
    defaultValues,
  })

  React.useEffect(() => {
    // Register virtual inputs for coordinate bounds
    register("west")
    register("east")
    register("north")
    register("south")
  }, [])

  const values = watch()

  const routesToRender = React.useMemo(
    () => routes.filter(routesFilterer(values)),
    [
      routes,
      values.startDate,
      values.endDate,
      // Need to turn array into a string so memoization works since identically-populated but distinct arrays won't pass the === test
      values.activityTypes.join("&"),
      values.west,
      values.east,
      values.north,
      values.south,
    ]
  )

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(window.location.search)
    queryParams.set("startDate", values.startDate)
    queryParams.set("endDate", values.endDate)
    queryParams.set("activityTypes", values.activityTypes.join(","))
    queryParams.set("west", String(values.west))
    queryParams.set("east", String(values.east))
    queryParams.set("north", String(values.north))
    queryParams.set("south", String(values.south))
    const queryParamString = queryParams.toString()
    window.history.replaceState(null, "", `?${queryParamString}`)
  }

  const routeMapProps = React.useMemo(() => {
    updateQueryParams()
    return {
      routes: routesToRender,
      geoBounds: memoizedGeoBounds({
        west: values.west,
        east: values.east,
        north: values.north,
        south: values.south,
      }),
      thickness: values.thickness,
      pathResolution: values.pathResolution,
      mapResolution: values.mapResolution,
      bgColor: values.bgColor ? makeColorString(values.bgColor) : null,
      pathColor: makeColorString(values.pathColor),
    }
  }, [
    routesToRender,
    values.west,
    values.east,
    values.north,
    values.south,
    values.thickness,
    values.pathResolution,
    values.mapResolution,
    values.bgColor,
    values.pathColor,
  ])

  const updateBoundsValues = React.useMemo(
    () =>
      _.debounce((bounds: GeoBounds) => {
        // Update the form value
        if (
          bounds.west !== values.west ||
          bounds.east !== values.east ||
          bounds.north !== values.north ||
          bounds.south !== values.south
        ) {
          setValue("north", bounds.north)
          setValue("south", bounds.south)
          setValue("west", bounds.west)
          setValue("east", bounds.east)
        }
        // Need to debounce this so the MapBox map doesn't overwhelm react-hook-form
      }, 500),
    [values]
  )

  const updateBoundsInputMap = React.useCallback(
    (bounds: GeoBounds) => {
      // Update the coordinate specification map
      coordinateBoundsMapRef.current?.fitBounds([
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ])
    },
    [coordinateBoundsMapRef]
  )

  const handleRouteMapDoneDrawing: RouteMapDoneDrawingCallback = React.useCallback(
    ({ resolution }) => {
      setImageResolution(resolution)
    },
    [setImageResolution]
  )

  return (
    <Box
      display="grid"
      gridTemplateColumns="380px 300px 1fr"
      gridTemplateRows="auto auto 1fr"
      height="100vh"
      gridTemplateAreas={`
      "header header map"
      "options routeList map"
      "summary summary map"
    `}
    >
      <Box
        gridArea="header"
        display="grid"
        gridTemplateColumns="1fr"
        gridTemplateRows="auto auto 1fr auto"
        width="100%"
        bg={colors.offWhite}
        flexShrink={0}
      >
        <Box p={3} bg="white">
          <Text.PageHeader color={colors.primaryGreen}>
            The Athlete's Canvas
          </Text.PageHeader>
          <Text.Body3>
            Create a minimalist heatmap of your activities. After tweaking the
            visualization to your preferences, you can right-click and save it
            to a PNG.
          </Text.Body3>
        </Box>
      </Box>

      {/* Options */}
      <Box
        gridArea="options"
        flexGrow={0}
        overflow="auto"
        bg={colors.offWhite}
        borderTop={`1px solid ${colors.africanElephant}`}
        borderBottom={`1px solid ${colors.africanElephant}`}
        p={3}
      >
        {/* SegmentedController */}

        <Box mb={3}>
          <SegmentedController
            tabs={[
              {
                id: "routes",
                title: "Select activities",
                actionType: TabActionType.OnClick,
                onClick: () => setMode("routes"),
              },
              {
                id: "visualization",
                title: "Configure canvas",
                actionType: TabActionType.OnClick,
                onClick: () => setMode("visualization"),
              },
            ]}
            selectedTabId={mode}
          />
        </Box>

        <Form.Form id="customizations">
          {/* Activity filtering options */}
          <Box
            display={mode === "routes" ? "grid" : "none"}
            gridTemplateAreas={`
                  "startDate endDate"
                  "map map"
                  "activityTypes activityTypes"
                `}
            gridTemplateColumns="1fr 1fr"
            gridTemplateRows="auto"
            placeContent="start"
            gridRowGap={4}
            gridColumnGap={2}
            flexShrink={0}
            flexGrow={0}
            width="100%"
          >
            <Form.Item gridArea="startDate">
              <Form.Label>Start date</Form.Label>
              <Form.Input name="startDate" type="date" ref={register()} />
            </Form.Item>
            <Form.Item gridArea="endDate">
              <Form.Label>End date</Form.Label>
              <Form.Input name="endDate" type="date" ref={register()} />
            </Form.Item>
            <Form.Item gridArea="activityTypes">
              <Form.Label>Activity Types</Form.Label>
              {activityTypeOptions.map((option) => (
                <Box display="flex" key={option.value}>
                  <Form.Input
                    type="checkbox"
                    name="activityTypes"
                    value={option.value}
                    ref={register()}
                  />
                  <Text.Body3 ml={2}>{option.label}</Text.Body3>
                </Box>
              ))}
            </Form.Item>

            <Form.Item gridArea="map">
              <Form.Label>Coordinate bounds</Form.Label>
              <Form.FieldDescription>
                Move the map below to cover the area you'd like to draw. You can
                also click and drag on the canvas itself to draw a rectangle to
                narrow down the drawing.
              </Form.FieldDescription>
              <Box mb={2}>
                {geoBoundsForAllRoutes && (
                  <MapboxMap
                    width="100%"
                    height="250px"
                    mapRef={coordinateBoundsMapRef}
                    initialCoordinateBounds={defaultGeoBounds}
                    onMove={updateBoundsValues}
                  />
                )}
              </Box>

              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  if (geoBoundsForDefaultRoutesToRender) {
                    updateBoundsInputMap(geoBoundsForDefaultRoutesToRender)
                  }
                }}
              >
                Reset coordinate bounds
              </Button>
            </Form.Item>
          </Box>
          {/* Visualization Options */}

          <Box
            display={mode === "visualization" ? "grid" : "none"}
            gridTemplateAreas={`
                "mapResolution mapResolution"
                "thickness thickness"
                "bgColor bgColor"
                "pathColor pathColor"
                `}
            gridTemplateColumns="1fr 1fr"
            gridTemplateRows="auto"
            placeContent="start"
            gridRowGap={4}
            gridColumnGap={2}
            flexShrink={0}
            flexGrow={0}
            width="100%"
          >
            <Form.Item gridArea="thickness">
              <Form.Label>Line Thickness</Form.Label>
              <Form.FieldDescription>
                Controls how thick the route path lines are.
              </Form.FieldDescription>
              <Form.Input
                name="thickness"
                type="range"
                ref={register({ valueAsNumber: true })}
                min={0.1}
                max={1}
                step={0.1}
              />
            </Form.Item>
            <Form.Item gridArea="mapResolution">
              <Form.Label>Map Resolution</Form.Label>
              <Form.FieldDescription>
                Controls the resolution of the image, relative to the amount of
                geographical area the map covers. The maximum width is 20,000
                pixels.
              </Form.FieldDescription>

              <Form.Select
                name="mapResolution"
                ref={register({ valueAsNumber: true })}
              >
                {resolutionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Form.Select>
              {imageResolution && (
                <Text.Body3 mt={2}>
                  Current Resolution:{" "}
                  <span css={css({ fontWeight: 500 })}>
                    {imageResolution.width} x {imageResolution.height}
                  </span>
                </Text.Body3>
              )}
            </Form.Item>
            <Form.Item gridArea="bgColor">
              <Form.Label>Background Color</Form.Label>
              <Controller
                name="bgColor"
                control={control}
                render={(props) => (
                  <>
                    <CompactPicker
                      css={css({
                        width: "100% !important",
                      })}
                      color={props.value ?? undefined}
                      onChange={(color) => props.onChange(color.rgb)}
                    />
                    <AlphaPicker
                      css={css({
                        width: "100% !important",
                        marginTop: "8px",
                      })}
                      color={props.value ?? undefined}
                      onChange={(color) => props.onChange(color.rgb)}
                    />
                  </>
                )}
              />
            </Form.Item>
            <Form.Item gridArea="pathColor">
              <Form.Label>Path Color</Form.Label>
              <Controller
                name="pathColor"
                control={control}
                render={(props) => (
                  <>
                    <CompactPicker
                      css={css({
                        width: "100% !important",
                        fontFamily: "Rubik !important",
                      })}
                      color={props.value ?? undefined}
                      onChange={(color) => props.onChange(color.rgb)}
                    />
                    <AlphaPicker
                      css={css({
                        width: "100% !important",
                        marginTop: "8px",
                      })}
                      color={props.value ?? undefined}
                      onChange={(color) => props.onChange(color.rgb)}
                    />
                  </>
                )}
              />
            </Form.Item>
          </Box>
        </Form.Form>
      </Box>

      <Box
        gridArea="routeList"
        height="100%"
        display="grid"
        overflowY="auto"
        gridTemplateColumns="1fr"
        gridTemplateRows="1fr auto"
        borderTop={`1px solid ${colors.africanElephant}`}
        borderBottom={`1px solid ${colors.africanElephant}`}
        borderLeft={`1px solid ${colors.africanElephant}`}
        bg={colors.offWhite}
      >
        <Box
          display="flex"
          flexDirection="column"
          flex={0}
          overflowY="auto"
          p={3}
          boxShadow={shadows.inner}
        >
          {routesToRender
            // Sort activities in recent-first order
            .sort((routeA, routeB) =>
              routeB.startDate.localeCompare(routeA.startDate)
            )
            .map((route) => (
              <Box
                key={route.id}
                p={2}
                mb={2}
                flexShrink={0}
                boxShadow={shadows.knob}
                borderRadius={2}
                width="100%"
                bg="white"
              >
                <Text.Body2>
                  {activityTypeEmojis[route.type]} {route.name}
                </Text.Body2>
                <Text.Body3 color={colors.lightGray}>
                  {dateFormat(route.startDate, "mmmm d, yyyy 'at' h:MM TT")}
                </Text.Body3>
                <Link
                  href={`https://www.strava.com/activities/${route.id}`}
                  fontSize={12}
                >
                  View activity in Strava
                </Link>
              </Box>
            ))}
        </Box>
      </Box>

      <Box gridArea="summary" bg="white" p={3}>
        <Text.Body2>
          There are {routesToRender.length} activities matching your current
          filters.
        </Text.Body2>
      </Box>

      <Box
        gridArea="map"
        flexGrow={0}
        width="100%"
        height="100%"
        overflowY="hidden"
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={3}
        borderLeft={`1px solid ${colors.africanElephant}`}
        bg={colors.offWhite}
      >
        <RouteMap
          {...routeMapProps}
          // No animations for the customizer... it's too awkward to support
          animationDuration={0}
          ref={routeMapRef}
          onDoneDrawing={handleRouteMapDoneDrawing}
          onBoundsDrawn={(bounds) => {
            updateBoundsInputMap(bounds)
          }}
          canvasStyles={css({
            outline: `20px solid ${colors.midnightGray}`,
            maxHeight: "calc(100vh - 40px - 2vh)",
            maxWidth: "100%",
          })}
        />
      </Box>

      <Box position="fixed" zIndex={1} bottom="10px" right="10px" width="100px">
        <Image src="/images/powered-by-strava-light.svg" />
      </Box>
    </Box>
  )
}
