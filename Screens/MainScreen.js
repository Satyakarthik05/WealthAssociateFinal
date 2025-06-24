import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Platform,
  width,
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo1 from "../assets/exp_and.jpg";
import logo2 from "../assets/exp.jpg";
import logo3 from "../assets/logosubW.png";
import logo4 from "../assets/quote.png";
import logo5 from "../assets/cardbg.png";
const isSmallDevice = width < 450;

const LoginScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 450;

  return (
    <ImageBackground
      source={
        Platform.OS === "ios" || Platform.OS === "android" || isSmallDevice
          ? logo1
          : logo2
      }
      style={styles.container}
      resizeMode="cover"
    >
      {/* Logo */}
      <View
        style={[
          styles.logoContainer,
          {
            top: isSmallDevice ? 60 : 40, // ⬅ push down in mobile
          },
        ]}
      >
        <Image
          source={logo3}
          style={{
            width: isSmallDevice ? 130 : 200,
            height: isSmallDevice ? 80 : 100,
            resizeMode: "contain",
          }}
        />
      </View>

      <View
        style={[
          styles.quoteContainer,
          {
            top: isSmallDevice ? 170 : 120, // ⬅ push down
            right: isSmallDevice ? -15 : 20,
          },
        ]}
      >
        <Image
          source={logo4}
          style={[
            styles.quote,
            {
              width: isSmallDevice ? 260 : 360,
              height: isSmallDevice ? 100 : 180,
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Card with PNG background */}
      <ImageBackground
        source={require("../assets/cardbg.png")}
        style={[
          styles.card,
          {
            top: isSmallDevice ? 90 : 100,
            width: isSmallDevice ? 325 : 580,
            height: isSmallDevice ? 200 : 330,
          },
        ]}
        resizeMode="stretch"
      >
        <Text
          style={[
            styles.welcomeText,
            {
              fontSize: isSmallDevice ? 15 : 18,
              bottom: isSmallDevice ? -25 : 30,
            },
          ]}
        >
          Welcome to Wealth Associates
        </Text>

        {/* Buttons */}
        <View
          style={[
            styles.buttonContainer,
            {
              marginTop: isSmallDevice ? "20%" : 10,
              marginLeft: isSmallDevice ? 8 : 18,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                paddingVertical: isSmallDevice ? 10 : 15,
                paddingHorizontal: isSmallDevice ? 25 : 45,
              },
            ]}
            onPress={() => navigation.navigate("Starting Screen")}
          >
            <Text style={styles.buttonText}> Login </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              {
                paddingVertical: isSmallDevice ? 10 : 15,
                paddingHorizontal: isSmallDevice ? 25 : 45,
              },
            ]}
            onPress={() => navigation.navigate("RegisterAS")}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerTextContainer}>
          <Text
            style={[
              styles.footerText,
              {
                fontSize: isSmallDevice ? 12 : 14,
                marginLeft: isSmallDevice ? 34 : 110,
                marginTop: isSmallDevice ? -2 : 5,
              },
            ]}
          >
            if already registered ?
          </Text>
          <Text
            style={[
              styles.footerText2,
              {
                fontSize: isSmallDevice ? 12 : 14,
                marginLeft: isSmallDevice ? 59 : 140,
                marginTop: isSmallDevice ? -2 : 5,
              },
            ]}
          >
            new user ?
          </Text>
        </View>

        <Text
          style={{
            zIndex: 10,
            top: "40%",
            color: "white",
            fontSize: 20,
            fontWeight: "600",
            marginTop: 20,
          }}
        >
          Paritala Naresh
        </Text>
        <Text
          style={{
            zIndex: 10,
            top: "40%",
            color: "white",
            fontSize: 14,
            fontWeight: "600",
            marginTop: 5,
          }}
        >
          Founder & Mentor
        </Text>
      </ImageBackground>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  logoContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },

  quoteContainer: {
    position: "absolute",
    alignItems: "flex-end",
  },

  card: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly",
  },
  button: {
    backgroundColor: "#3E5C76",
    borderWidth: 0.5,
    borderColor: "#A9BCD0",
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#FDFDFD",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerTextContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 15,
  },
  footerText: {
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  quote: {
    width: 250,
    height: 100,
    resizeMode: "contain",
  },
  logo: {
    width: 150,
    height: 60,
    resizeMode: "contain",
  },
  footerText2: {
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});

export default LoginScreen;
