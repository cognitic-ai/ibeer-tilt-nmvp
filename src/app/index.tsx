import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import BeerGlass from "@/components/beer-glass";

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
  const [message, setMessage] = useState("Tilt your phone to drink!");

  const handleDrink = useCallback(
    (level: number) => {
      if (level <= 1 && !isEmpty) {
        setIsEmpty(true);
        setMessage("Empty! Tap the glass to refill.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [isEmpty]
  );

  const handleRefill = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBeerKey((k) => k + 1);
    setIsEmpty(false);
    const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setMessage(randomMsg);
    setTimeout(() => {
      setMessage("Tilt your phone to drink!");
    }, 2500);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1A1207",
      }}
    >
      <StatusBar style="light" />

      {/* Background ambient glow */}
      <View
        style={{
          position: "absolute",
          top: "30%",
          left: "20%",
          right: "20%",
          height: 300,
          borderRadius: 200,
          backgroundColor: "rgba(245, 166, 35, 0.06)",
        }}
      />

      {/* Top message */}
      <Animated.View
        key={message}
        entering={FadeIn.duration(400)}
        style={{
          paddingTop: 80,
          paddingBottom: 20,
          alignItems: "center",
        }}
      >
        <Text
          selectable
          style={{
            color: "rgba(255,248,231,0.8)",
            fontSize: 18,
            fontWeight: "500",
            letterSpacing: 0.5,
          }}
        >
          {message}
        </Text>
      </Animated.View>

      {/* Beer glass */}
      <Pressable
        onPress={handleRefill}
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        <BeerGlass key={beerKey} onDrink={handleDrink} />
      </Pressable>

      {/* Refill hint when empty */}
      {isEmpty && (
        <Animated.View
          entering={ZoomIn.delay(300).springify()}
          exiting={FadeOut.duration(200)}
          style={{
            position: "absolute",
            bottom: 100,
            alignSelf: "center",
            backgroundColor: "rgba(245, 166, 35, 0.2)",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
            borderCurve: "continuous",
          }}
        >
          <Text
            style={{
              color: "rgba(255,248,231,0.9)",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Tap to refill
          </Text>
        </Animated.View>
      )}

      {/* Bottom branding */}
      <View
        style={{
          paddingBottom: 50,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "rgba(255,248,231,0.25)",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          iBeer
        </Text>
      </View>
    </View>
  );
}
