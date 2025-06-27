import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Text, Animated } from "react-native";
import LottieView from "lottie-react-native";

const LoadingScreen = () => {
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/home[1].json")}
        autoPlay
        loop
        style={styles.animation}
      />
      <Animated.Text
        style={[styles.text, { transform: [{ translateY: bounceValue }] }]}
      >
        Wealth Properties Loading...
      </Animated.Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D8E3E7",
  },
  animation: {
    width: 200,
    height: 200,
  },
  text: {
    // marginTop: 20,
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
});
