import { css } from "@emotion/react";
import { decode } from "@mapbox/polyline";
import Box from "components/Box";
import Button from "components/Button";
import * as Form from "components/Form";
import * as Text from "components/Text";
import { GeoBounds, Props as RouteMapProps, RouteMap } from "components/RouteMap";
import * as React from "react";
import { ChromePicker, RGBColor } from "react-color";
import { Controller, useForm } from "react-hook-form";
import { colors } from "styles";
import { SummaryActivity } from "types/strava";
import { ActivityType } from "types/strava/enums";
import SegmentedController, { TabActionType } from "./SegmentedController";
import Image from "./Image";

const makeColorString = (color: RGBColor) => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

interface ActivityFilteringOptions {
  startDate: string;
  endDate: string;
  activityTypes: Array<ActivityType>;
}
interface VisualizationOptions extends GeoBounds {
  useCustomCoords: boolean;
  thickness: number;
  duration: number;
  mapResolution: number;
  pathResolution: number;
  bgColor: RGBColor | null;
  pathColor: RGBColor;
}

interface CustomizationOptions extends ActivityFilteringOptions, VisualizationOptions {}

interface Props {
  activities: Array<SummaryActivity>;
}

const activityTypeOptionsWithEmoji = [
  { value: ActivityType.Run, label: "🏃 Run" },
  { value: ActivityType.Ride, label: "🚴🏻 Ride" },
  { value: ActivityType.Walk, label: "🚶 Walk" },
  { value: ActivityType.Hike, label: "🥾 Hike" },
  { value: ActivityType.Workout, label: "🏋️ Workout" },
  { value: ActivityType.Swim, label: "🏊 Swim" },
];

export const MapViewer = ({ activities }: Props) => {
  // Generate list of activity type options {value, label} that there are activities for
  const activityTypeOptions: Array<{ value: ActivityType; label: string }> = activities
    .map((activity) => activity.type)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .map((item) => ({
      value: item,
      // For some types, we have a custom label with an emoji; use that if present
      label: activityTypeOptionsWithEmoji.find((atwe) => atwe.value === item)?.label ?? item,
    }));

  const defaultValues: CustomizationOptions = {
    activityTypes: activityTypeOptions.map((o) => o.value),
    startDate: "2020-01-01",
    endDate: new Date().toISOString().substr(0, 10),
    duration: 0,
    thickness: 5,
    mapResolution: 5000,
    pathResolution: 0.5,
    bgColor: { r: 0, g: 0, b: 0, a: 1 },
    pathColor: { r: 255, g: 255, b: 255, a: 0.2 },
    useCustomCoords: false,
    leftLon: -122,
    rightLon: -121,
    upperLat: 38,
    lowerLat: 37,
  };
  const [mode, setMode] = React.useState<"routes" | "visualization">("routes");
  const { register, watch, control, handleSubmit } = useForm<CustomizationOptions>({
    mode: "onBlur",
    defaultValues,
  });

  const createRouteMapProps = (options: CustomizationOptions): RouteMapProps => {
    const { startDate, endDate, activityTypes } = options;
    const toTimestamp = (d: Date | string) => new Date(d).getTime() / 1000;

    return {
      routes: activities
        .filter(
          (activity) =>
            // Filter for date range
            toTimestamp(activity.start_date) > toTimestamp(startDate) &&
            toTimestamp(activity.start_date) < toTimestamp(endDate) &&
            // Filter for activity type
            activityTypes.includes(activity.type),
        )
        .map((activity) =>
          // Extract the waypoints from the activity
          activity.map.summary_polyline
            ? {
                id: activity.id,
                waypoints: decode(activity.map.summary_polyline).map(([lat, lon]) => ({
                  lat,
                  lon,
                })),
              }
            : null,
        )
        .filter(Boolean),
      duration: options.duration,
      geoBounds: options.useCustomCoords
        ? {
            leftLon: options.leftLon,
            rightLon: options.rightLon,
            upperLat: options.upperLat,
            lowerLat: options.lowerLat,
          }
        : undefined,
      thickness: options.thickness,
      pathResolution: options.pathResolution,
      mapResolution: options.mapResolution,
      bgColor: options.bgColor ? makeColorString(options.bgColor) : null,
      pathColor: makeColorString(options.pathColor),
    };
  };

  const [propsToPass, setPropsToPass] = React.useState<RouteMapProps>(
    createRouteMapProps(defaultValues),
  );

  const values = watch();

  const onSubmit = (data: CustomizationOptions) => {
    const newProps = createRouteMapProps(data);
    setPropsToPass(newProps);
  };

  return (
    <Box display="flex">
      <Box
        display="grid"
        gridTemplateColumns="1fr"
        gridTemplateRows="auto auto 1fr auto"
        width="520px"
        bg={colors.offWhite}
        flexShrink={0}
        height="100vh"
        borderRight={`1px solid ${colors.africanElephant}`}
      >
        <Box p={3} bg="white">
          <Text.SectionHeader color={colors.nomusBlue}>The Athlete's Canvas</Text.SectionHeader>
          <Text.Body3>
            Create a minimalist heatmap of your activities. After tweaking the visualization to your
            preferences, you can right-click and save it to a PNG.
          </Text.Body3>
        </Box>
        {activities == null && {}}
        {/* SegmentedController */}
        <Box p={3} width="100%" bg="white" flexGrow={0}>
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
                title: "Configure visualization",
                actionType: TabActionType.OnClick,
                onClick: () => setMode("visualization"),
              },
            ]}
            selectedTabId={mode}
          />
        </Box>

        {/* Options */}
        <Box
          flexGrow={0}
          overflow="auto"
          borderTop={`1px solid ${colors.africanElephant}`}
          borderBottom={`1px solid ${colors.africanElephant}`}
          py={3}
        >
          <Form.Form onSubmit={handleSubmit(onSubmit)} id="customizations">
            {/* Activity filtering options */}
            <Box
              display={mode === "routes" ? "grid" : "none"}
              gridTemplateAreas={`
                  "startDate endDate"
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
              p={3}
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
            </Box>
            {/* Visualization Options */}

            <Box
              display={mode === "visualization" ? "grid" : "none"}
              gridTemplateAreas={`
                  "duration thickness"
                  "mapResolution pathResolution"
                  "bgColor pathColor"
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
              p={3}
              height="100vh"
            >
              <Form.Item gridArea="duration">
                <Form.Label>Animation Duration</Form.Label>
                <Form.Input
                  name="duration"
                  type="range"
                  ref={register({ valueAsNumber: true })}
                  min={0}
                  max={3000}
                  step={250}
                />
              </Form.Item>
              <Form.Item gridArea="thickness">
                <Form.Label>Line Thickness</Form.Label>
                <Form.Input
                  name="thickness"
                  type="range"
                  ref={register({ valueAsNumber: true })}
                  min={1}
                  max={20}
                />
              </Form.Item>
              <Form.Item gridArea="mapResolution">
                <Form.Label>Map Resolution</Form.Label>
                <Form.Input
                  name="mapResolution"
                  type="range"
                  ref={register({ valueAsNumber: true })}
                  min={100}
                  max={100000}
                  step={100}
                />
              </Form.Item>
              <Form.Item gridArea="pathResolution">
                <Form.Label>Path Resolution</Form.Label>
                <Form.Input
                  name="pathResolution"
                  type="range"
                  ref={register({ valueAsNumber: true })}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                />
              </Form.Item>
              <Form.Item gridArea="bgColor">
                <Form.Label>Bg Color</Form.Label>
                <Controller
                  name="bgColor"
                  control={control}
                  render={(props) => (
                    <ChromePicker
                      color={props.value ?? undefined}
                      onChange={(color) => props.onChange(color.rgb)}
                    />
                  )} // props contains: onChange, onBlur and value
                />
              </Form.Item>
              <Form.Item gridArea="pathColor">
                <Form.Label>Path Color</Form.Label>
                {/* <Form.Input name="pathColor" type="color" ref={register()} /> */}
                <Controller
                  name="pathColor"
                  control={control}
                  render={(props) => (
                    <ChromePicker
                      color={props.value}
                      onChange={(color) => props.onChange(color.rgb)}
                    />
                  )} // props contains: onChange, onBlur and value
                />
              </Form.Item>

              <Form.Item gridArea="useCustomCoords">
                <Form.Label>Use custom coordinate bounds?</Form.Label>
                <Text.Body3>
                  By default, the coordinate bounds are automatically determined to fit the selected
                  activities. If you'd like, you can override the bounds yourself.
                </Text.Body3>
                <Form.Input name="useCustomCoords" type="checkbox" ref={register()} />
              </Form.Item>

              <Form.Item gridArea="leftLon">
                <Form.Label>Left Longituide</Form.Label>
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
                <Form.Label>Right Longituide</Form.Label>
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
          </Form.Form>
        </Box>

        <Box bg="white" p={3}>
          <Button mb={1} size="big" type="submit" width="100%" form="customizations">
            Re-render map
          </Button>
        </Box>
      </Box>

      <Box
        gridArea="map"
        flexGrow={0}
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={1}
        bg={propsToPass.bgColor}
      >
        <RouteMap
          {...propsToPass}
          canvasStyles={css({
            maxHeight: "100%",
            maxWidth: "100%",
          })}
        />
      </Box>

      <Box position="fixed" zIndex={1} bottom="10px" right="10px" width="100px">
        <Image src="/images/powered-by-strava-light.svg" />
      </Box>
    </Box>
  );
};
