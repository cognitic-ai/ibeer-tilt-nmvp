import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import BeerGlass from "@/components/beer-glass";

const isWeb = process.env.EXPO_OS === "web";

const MESSAGES = [
  "Cheers! 🍺",
  "Sláinte!",
  "Prost!",
  "Salud!",
  "Santé!",
  "Skål!",
  "乾杯!",
  "Na zdorovie!",
];

export default function BeerScreen() {
  const [beerKey, setBeerKey] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Auto-hide the initial hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDrink = useCallback(
    (level: number) => {
      if (level <= 1 && !isEmpty) {
        setIsEmpty(true);
        setShowHint(false);
        if (!isWeb) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    },
    [isEmpty]
  );

  const handleRefill = useCallback(() => {
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setBeerKey((k) => k + 1);
    setIsEmpty(false);
    setShowHint(false);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1A1207",
      }}
    >
      <StatusBar style="light" hidden />

      {/* Beer glass — fullscreen */}
      <Pressable
        onPress={handleRefill}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <BeerGlass key={beerKey} onDrink={handleDrink} />
      </Pressable>

      {/* Initial hint overlay */}
      {showHint && (
        <Animated.View
          entering={FadeIn.duration(600)}
          exiting={FadeOut.duration(400)}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              paddingHorizontal: 28,
              paddingVertical: 16,
              borderRadius: 16,
              borderCurve: "continuous",
            }}
          >
            <Text
              style={{
                color: "rgba(255,248,231,0.9)",
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {isWeb ? "Tap to drink!" : "Tilt to drink!"}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Refill prompt when empty */}
      {isEmpty && (
        <Animated.View
          entering={ZoomIn.delay(300).springify()}
          exiting={FadeOut.duration(200)}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              paddingHorizontal: 32,
              paddingVertical: 18,
              borderRadius: 20,
              borderCurve: "continuous",
            }}
          >
            <Text
              style={{
                color: "rgba(255,248,231,0.95)",
                fontSize: 22,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              🍺
            </Text>
            <Text
              style={{
                color: "rgba(255,248,231,0.9)",
                fontSize: 18,
                fontWeight: "600",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Tap to refill
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
