import { css } from "@emotion/react"
import { decode } from "@mapbox/polyline"
import Box from "components/Box"
import Button from "components/Button"
import * as Form from "components/Form"
import {
  GeoBounds,
  Props as RouteMapProps,
  Route,
  RouteMap,
  RouteMapDoneDrawingCallback,
  RouteMapRef,
} from "components/RouteMap"
import * as Text from "components/Text"
import dateFormat from "dateformat"
import * as React from "react"
import { AlphaPicker, CompactPicker, RGBColor } from "react-color"
import { Controller, useForm } from "react-hook-form"
import { colors } from "styles"
import shadows from "styles/shadows"
import { SummaryActivity } from "types/strava"
import { ActivityType } from "types/strava/enums"
import { activityTypeEmojis } from "utils/strava"
import { hasOwnProperty } from "utils/typecheck"
import Image from "./Image"
import Link from "./Link"
import SegmentedController, { TabActionType } from "./SegmentedController"

const makeColorString = (color: RGBColor) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`

const roundToPlaces = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places

// The whole globe -- this might be unsafe since it'll make a gigantic canvas...
const fallbackGeoBounds: GeoBounds = {
  leftLon: -180,
  rightLon: 180,
  upperLat: 90,
  lowerLat: -90,
}

const resolutionOptions = [
  { value: 0.1, label: "Low" },
  { value: 0.25, label: "Medium" },
  { value: 1.0, label: "High" },
]

interface ActivityFilteringOptions {
  startDate: string
  endDate: string
  activityTypes: Array<ActivityType>
}
interface VisualizationOptions extends GeoBounds {
  useCustomCoords: boolean
  thickness: number
  animationDuration: number
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

const animationDurationOptions = [
  { value: 0, label: "None" },
  { value: 100, label: "Quick" },
  { value: 300, label: "Medium" },
  { value: 500, label: "Slow" },
]

const activitiesToRoutes = (
  activities: Array<SummaryActivity>,
  activityFilterPredicate?: (activity: SummaryActivity) => boolean
): Array<Route> => {
  const filteredActivities = activityFilterPredicate
    ? activities.filter(activityFilterPredicate)
    : activities

  return filteredActivities.reduce<Array<Route>>((arr, activity) => {
    if (activity.map.summary_polyline) {
      arr.push({
        id: activity.id,
        name: activity.name,
        startDate: activity.start_date,
        type: activity.type,
        waypoints: decode(activity.map.summary_polyline).map(([lat, lon]) => ({
          lat,
          lon,
        })),
      })
    }
    return arr
  }, [])
}

// Determine the GeoBounds that will contain all the routes with a small padding (5%)
const getGeoBoundsForRoutes = (routes: Array<Route>): GeoBounds | null => {
  let minLat = 90
  let maxLat = -90
  let minLon = 180
  let maxLon = -180

  let somePointsExist = false
  routes.forEach((route) => {
    route.waypoints.forEach((waypoint) => {
      somePointsExist = true
      minLat = Math.min(waypoint.lat, minLat)
      maxLat = Math.max(waypoint.lat, maxLat)
      minLon = Math.min(waypoint.lon, minLon)
      maxLon = Math.max(waypoint.lon, maxLon)
    })
  })

  const latRange = Math.abs(maxLat - minLat)
  const lonRange = Math.abs(maxLon - minLon)
  const latBuffer = 0.05 * latRange
  const lonBuffer = 0.05 * lonRange

  return somePointsExist
    ? {
        leftLon: roundToPlaces(minLon - lonBuffer, 4),
        rightLon: roundToPlaces(maxLon + lonBuffer, 4),
        upperLat: roundToPlaces(maxLat + latBuffer, 4),
        lowerLat: roundToPlaces(minLat - latBuffer, 4),
      }
    : null
}

const toTimestamp = (d: Date | string) => new Date(d).getTime() / 1000

export const MapViewer = ({ activities }: Props) => {
  const [imageResolution, setImageResolution] = React.useState<{
    width: number
    height: number
  } | null>(null)

  const [isDrawing, setIsDrawing] = React.useState(true)

  const routeMapRef = React.useRef<RouteMapRef | null>(null)

  const routes = React.useMemo(() => activitiesToRoutes(activities), [
    activities,
  ])

  const geoBoundsForProvidedRoutes = React.useMemo(
    () => getGeoBoundsForRoutes(routes) ?? { lowerLat: -90 },
    [routes]
  )

  // Generate list of activity type options {value, label} that there are activities for
  const activityTypeOptions: Array<{
    value: ActivityType
    label: string
  }> = activities
    .map((activity) => activity.type)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .map((item) => ({
      value: item,
      label: getActivityTypeLabel(item),
    }))

  const defaultValues: CustomizationOptions = {
    activityTypes: activityTypeOptions.map((o) => o.value),
    startDate: "2020-01-01",
    endDate: new Date().toISOString().substr(0, 10),
    animationDuration:
      animationDurationOptions.find((opt) => opt.label === "Quick")?.value ?? 0,
    thickness: 0.5,
    mapResolution: resolutionOptions[1].value,
    pathResolution: 1,
    bgColor: { r: 255, g: 255, b: 255, a: 0 },
    pathColor: { r: 0, g: 0, b: 0, a: 0.2 },
    useCustomCoords: false,
    ...fallbackGeoBounds,
    // This may or may not be present and override fallbackGeoBounds
    ...geoBoundsForProvidedRoutes,
  }
  const [mode, setMode] = React.useState<"routes" | "visualization">("routes")
  const {
    register,
    watch,
    control,
    handleSubmit,
    setValue,
  } = useForm<CustomizationOptions>({
    mode: "onBlur",
    defaultValues,
  })
  const values = watch()

  const routesToRender = React.useMemo(
    () =>
      routes.filter(
        (route) =>
          // Filter for date range
          toTimestamp(route.startDate) > toTimestamp(values.startDate) &&
          toTimestamp(route.startDate) < toTimestamp(values.endDate) &&
          // Filter for activity type
          values.activityTypes.includes(route.type) &&
          // If user wants to use custom coords, filter using those
          (!values.useCustomCoords ||
            route.waypoints.some(
              (waypoint) =>
                waypoint.lat > values.lowerLat &&
                waypoint.lat < values.upperLat &&
                waypoint.lon > values.leftLon &&
                waypoint.lon < values.rightLon
            ))
      ),
    [
      routes,
      values.startDate,
      values.endDate,
      values.activityTypes,
      values.leftLon,
      values.rightLon,
      values.upperLat,
      values.lowerLat,
      values.useCustomCoords,
    ]
  )

  // When we've determined a new set of routes to render, if the user isn't specifying
  // custom coords, recalculate the geo bounds for the routes and update the form fields
  React.useEffect(() => {
    if (!values.useCustomCoords) {
      const autoGeneratedBounds = getGeoBoundsForRoutes(routesToRender)
      if (
        autoGeneratedBounds?.leftLon !== values.leftLon ||
        autoGeneratedBounds?.rightLon !== values.rightLon ||
        autoGeneratedBounds?.upperLat !== values.upperLat ||
        autoGeneratedBounds?.lowerLat !== values.lowerLat
      ) {
        setValue(
          "leftLon",
          autoGeneratedBounds?.leftLon ?? fallbackGeoBounds.leftLon
        )
        setValue(
          "rightLon",
          autoGeneratedBounds?.rightLon ?? fallbackGeoBounds.rightLon
        )
        setValue(
          "upperLat",
          autoGeneratedBounds?.upperLat ?? fallbackGeoBounds.upperLat
        )
        setValue(
          "lowerLat",
          autoGeneratedBounds?.lowerLat ?? fallbackGeoBounds.lowerLat
        )
      }
    }
  }, [routesToRender, values.useCustomCoords])

  const createRouteMapProps = (
    options: CustomizationOptions
  ): RouteMapProps => {
    return {
      routes: routesToRender,
      geoBounds: {
        leftLon: values.leftLon,
        rightLon: values.rightLon,
        upperLat: values.upperLat,
        lowerLat: values.lowerLat,
      },
      animationDuration: options.animationDuration,
      thickness: options.thickness,
      pathResolution: options.pathResolution,
      mapResolution: options.mapResolution,
      bgColor: options.bgColor ? makeColorString(options.bgColor) : null,
      pathColor: makeColorString(options.pathColor),
    }
  }

  const [propsToPass, setPropsToPass] = React.useState<RouteMapProps>(
    createRouteMapProps(defaultValues)
  )

  const handleRouteMapDoneDrawing: RouteMapDoneDrawingCallback = ({
    resolution,
  }) => {
    setImageResolution(resolution)
    console.log("false")
    setIsDrawing(false)
  }

  const onSubmit = (data: CustomizationOptions) => {
    const newProps = createRouteMapProps(data)
    setPropsToPass(newProps)
    console.log("true")
    setIsDrawing(true)
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns="350px 300px 1fr"
      height="100vh"
      gridTemplateAreas={`
      "header header map"
      "options routeList map"
      "buttons buttons map"
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
          <Text.PageHeader color={colors.primaryBlue}>
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

        <Form.Form onSubmit={handleSubmit(onSubmit)} id="customizations">
          {/* Activity filtering options */}
          <Box
            display={mode === "routes" ? "grid" : "none"}
            gridTemplateAreas={`
                  "startDate endDate"
                  "activityTypes activityTypes"
                  "useCustomCoords useCustomCoords"
                  "leftLon rightLon"
                  "upperLat lowerLat"
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
            <Form.Item gridArea="useCustomCoords">
              <Form.Label>Use custom coordinate bounds?</Form.Label>
              <Form.FieldDescription>
                By default, the coordinate bounds are automatically determined
                to fit the selected activities. If you'd like, you can override
                the bounds yourself.
              </Form.FieldDescription>
              <Form.Input
                name="useCustomCoords"
                type="checkbox"
                ref={register()}
              />
            </Form.Item>

            <Form.Item gridArea="leftLon">
              <Form.Label>Left Longitude</Form.Label>
              <Form.Input
                name="leftLon"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={-180}
                max={values.rightLon}
                step="any"
                disabled={!values.useCustomCoords}
              />
            </Form.Item>
            <Form.Item gridArea="rightLon">
              <Form.Label>Right Longitude</Form.Label>
              <Form.Input
                name="rightLon"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={values.leftLon}
                max={180}
                step="any"
                disabled={!values.useCustomCoords}
              />
            </Form.Item>
            <Form.Item gridArea="upperLat">
              <Form.Label>Upper Latitude</Form.Label>
              <Form.Input
                name="upperLat"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={values.lowerLat}
                max={90}
                step="any"
                disabled={!values.useCustomCoords}
              />
            </Form.Item>
            <Form.Item gridArea="lowerLat">
              <Form.Label>Lower Latitude</Form.Label>
              <Form.Input
                name="lowerLat"
                type="number"
                ref={register({ valueAsNumber: true })}
                min={-90}
                max={values.upperLat}
                step="any"
                disabled={!values.useCustomCoords}
              />
            </Form.Item>
          </Box>
          {/* Visualization Options */}

          <Box
            display={mode === "visualization" ? "grid" : "none"}
            gridTemplateAreas={`
                "animationDuration animationDuration"
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
            <Form.Item gridArea="animationDuration">
              <Form.Label>Animation</Form.Label>
              <Form.FieldDescription>
                Controls whether (and at what speed) the rendering process will
                gradually animate your paths being drawn.
              </Form.FieldDescription>
              <Form.Select
                name="animationDuration"
                ref={register({ valueAsNumber: true })}
              >
                {animationDurationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Item>
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
          {routesToRender.map((route) => (
            <Link
              key={route.id}
              href={`https://www.strava.com/activities/${route.id}`}
            >
              <Box
                p={2}
                mb={2}
                flexShrink={0}
                boxShadow={shadows.knob}
                borderRadius={2}
                width="100%"
                bg="white"
              >
                <Text.Body2>{route.name}</Text.Body2>
                <Text.Body3>
                  {dateFormat(route.startDate, "mmmm d, yyyy 'at' h:MM TT")}
                </Text.Body3>
                <Text.Body3>{getActivityTypeLabel(route.type)}</Text.Body3>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>

      <Box gridArea="buttons" bg="white" p={3}>
        {isDrawing && values.animationDuration !== 0 ? (
          <Button
            // There's a weird React bug(?) that was causing this button being clicked to trigger a form submission (the other button's job)
            // Requires specifying key to fix. See https://github.com/facebook/react/issues/8554 for more details.
            key="stop"
            size="big"
            width="100%"
            type="button"
            variant="danger"
            form="none"
            onClick={() => {
              routeMapRef.current?.cancelDrawing()
              setIsDrawing(false)
            }}
          >
            Stop plotting {routesToRender.length} activities
          </Button>
        ) : (
          <Button
            mb={1}
            key="update"
            type="submit"
            size="big"
            width="100%"
            form="customizations"
            onClick={() => {
              console.log("clicked submit")
            }}
            disabled={isDrawing}
            inProgress={isDrawing}
            inProgressText="Drawing..."
          >
            Plot {routesToRender.length} activities
          </Button>
        )}
      </Box>

      <Box
        gridArea="map"
        flexGrow={0}
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={3}
        borderLeft={`1px solid ${colors.africanElephant}`}
        bg={propsToPass.bgColor}
      >
        <RouteMap
          {...propsToPass}
          ref={routeMapRef}
          onDoneDrawing={handleRouteMapDoneDrawing}
          canvasStyles={css({
            border: `20px solid ${colors.midnightGray}`,
            maxHeight: "100%",
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
