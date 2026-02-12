import { useEffect, useRef, useCallback } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";

const BEER_COLOR = "#F5A623";
const BEER_DARK = "#C8850F";
const FOAM_COLOR = "#FFF8E7";
const FOAM_SHADOW = "#E8D9B8";
const GLASS_BORDER = "rgba(255,255,255,0.3)";
const GLASS_HIGHLIGHT = "rgba(255,255,255,0.15)";

const BUBBLE_COUNT = 25;
const FOAM_BLOB_COUNT = 10;

const isWeb = process.env.EXPO_OS === "web";

function Bubble({
  index,
  beerLevel,
  glassHeight,
}: {
  index: number;
  beerLevel: Animated.SharedValue<number>;
  glassHeight: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const size = 3 + Math.random() * 6;
  const left = 10 + Math.random() * 80;
  const delay = Math.random() * 4000;
  const duration = 2000 + Math.random() * 3000;

  useEffect(() => {
    translateY.value = 0;
    opacity.value = 0;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-glassHeight * 0.7, {
            duration,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: duration * 0.1 }),
          withTiming(0.7, { duration: duration * 0.7 }),
          withTiming(0, { duration: duration * 0.2 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, [glassHeight]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    bottom: glassHeight * 0.05,
    left: `${left}%`,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    transform: [
      { translateY: translateY.value },
      { translateX: Math.sin(index) * 3 },
    ],
    opacity: opacity.value * Math.min(beerLevel.value / 30, 1),
  }));

  return <Animated.View style={style} />;
}

function FoamBlob({
  index,
  tiltX,
  beerLevel,
}: {
  index: number;
  tiltX: Animated.SharedValue<number>;
  beerLevel: Animated.SharedValue<number>;
}) {
  const baseSize = 30 + Math.random() * 45;
  const baseLeft = (index / FOAM_BLOB_COUNT) * 100 - 10 + Math.random() * 20;
  const yOffset = Math.random() * 18;

  const style = useAnimatedStyle(() => {
    const foamScale = interpolate(beerLevel.value, [0, 20, 100], [0, 0.5, 1]);
    return {
      position: "absolute" as const,
      width: baseSize,
      height: baseSize * 0.7,
      borderRadius: baseSize / 2,
      backgroundColor: FOAM_COLOR,
      left: `${baseLeft + tiltX.value * 3}%`,
      top: -baseSize * 0.25 + yOffset,
      transform: [{ scale: foamScale }],
      opacity: foamScale,
    };
  });

  return <Animated.View style={style} />;
}

export default function BeerGlass({
  onDrink,
}: {
  onDrink?: (level: number) => void;
}) {
  const { width, height } = useWindowDimensions();
  // Fullscreen: glass fills most of the screen
  const glassWidth = width;
  const glassHeight = height;

  const beerLevel = useSharedValue(100);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const surfaceTilt = useSharedValue(0);
  const isDrinking = useRef(false);
  const lastHaptic = useRef(0);

  const triggerHaptic = useCallback(() => {
    if (isWeb) return;
    const now = Date.now();
    if (now - lastHaptic.current > 300) {
      lastHaptic.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    if (isWeb) return;

    Accelerometer.setUpdateInterval(50);

    const sub = Accelerometer.addListener(({ x, y }) => {
      // Tilt affects the beer surface angle
      tiltX.value = withSpring(x * 15, { damping: 8, stiffness: 120 });
      surfaceTilt.value = withSpring(x * 12, { damping: 6, stiffness: 100 });

      // Detect "drinking" — phone tilted upward significantly
      const drinkThreshold = 0.45;
      if (y > drinkThreshold && beerLevel.value > 0) {
        if (!isDrinking.current) {
          isDrinking.current = true;
          runOnJS(triggerHaptic)();
        }
        const drinkRate = (y - drinkThreshold) * 1.2;
        beerLevel.value = withTiming(
          Math.max(0, beerLevel.value - drinkRate),
          { duration: 50 }
        );
        if (onDrink) {
          runOnJS(onDrink)(beerLevel.value);
        }
      } else {
        isDrinking.current = false;
      }

      tiltY.value = withSpring(y * 5, { damping: 10, stiffness: 80 });
    });

    return () => sub.remove();
  }, []);

  // Glass container style
  const glassStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateZ: `${tiltX.value * -0.5}deg` },
    ],
  }));

  // Beer fill style
  const beerStyle = useAnimatedStyle(() => ({
    height: `${beerLevel.value}%`,
    transform: [{ rotateZ: `${surfaceTilt.value}deg` }, { scaleX: 1.1 }],
  }));

  // Foam style
  const foamStyle = useAnimatedStyle(() => {
    const foamHeight = interpolate(
      beerLevel.value,
      [0, 10, 100],
      [0, 20, 50]
    );
    return {
      height: foamHeight,
      transform: [{ rotateZ: `${surfaceTilt.value * 0.5}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: glassWidth,
          height: glassHeight,
          alignSelf: "center",
        },
        glassStyle,
      ]}
    >
      {/* Glass body — no border, edge-to-edge */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Glass highlight — left */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 12,
            width: 24,
            height: "100%",
            backgroundColor: GLASS_HIGHLIGHT,
            borderRadius: 12,
            zIndex: 10,
          }}
        />
        {/* Glass highlight — right */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 16,
            width: 10,
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 10,
            zIndex: 10,
          }}
        />

        {/* Beer fill area */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: -15,
            right: -15,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <Animated.View
            style={[
              {
                width: "100%",
                overflow: "hidden",
              },
              beerStyle,
            ]}
          >
            {/* Beer body */}
            <View
              style={{
                flex: 1,
                backgroundColor: BEER_COLOR,
              }}
            >
              {/* Darker beer at bottom */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  backgroundColor: BEER_DARK,
                  opacity: 0.4,
                }}
              />
            </View>

            {/* Foam on top */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: -2,
                  left: -10,
                  right: -10,
                  overflow: "visible",
                },
                foamStyle,
              ]}
            >
              {/* Foam base */}
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: -8,
                  backgroundColor: FOAM_SHADOW,
                  borderRadius: 0,
                }}
              />
              {/* Foam blobs */}
              {Array.from({ length: FOAM_BLOB_COUNT }).map((_, i) => (
                <FoamBlob
                  key={i}
                  index={i}
                  tiltX={tiltX}
                  beerLevel={beerLevel}
                />
              ))}
            </Animated.View>
          </Animated.View>
        </View>

        {/* Bubbles */}
        {Array.from({ length: BUBBLE_COUNT }).map((_, i) => (
          <Bubble
            key={i}
            index={i}
            beerLevel={beerLevel}
            glassHeight={glassHeight}
          />
        ))}
      </View>
    </Animated.View>
  );
}
