import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StartingScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 450;

  const handleLoginTypeSelection = async (loginType) => {
    try {
      await AsyncStorage.setItem("loginType", loginType);
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error storing login type:", error);
    }
  };

  const loginOptions = [
    {
      name: "Wealth Associate",
      icon: (
        <MaterialIcons name="real-estate-agent" size={hp("4%")} color="white" />
      ),
      loginType: "WealthAssociate",
    },
    {
      name: "Wealth Customer",
      icon: <FontAwesome5 name="user" size={hp("4%")} color="white" />,
      loginType: "Customer",
    },
    {
      name: "Core Member",
      icon: <Ionicons name="link" size={hp("4%")} color="white" />,
      loginType: "CoreMember",
    },
    {
      name: "Referral Associate",
      icon: <FontAwesome5 name="users" size={hp("4%")} color="white" />,
      loginType: "ReferralAssociate",
    },
    {
      name: "Wealth Investor",
      icon: (
        <FontAwesome5 name="hand-holding-usd" size={hp("4%")} color="white" />
      ),
      loginType: "Investor",
    },
    {
      name: "Wealth NRI",
      icon: <MaterialIcons name="flight" size={hp("4%")} color="white" />,
      loginType: "NRI",
    },
    {
      name: "Skilled Resource",
      icon: <FontAwesome5 name="user-tie" size={hp("4%")} color="white" />,
      loginType: "SkilledResource",
    },
    ...(Platform.OS === "web"
      ? [
          {
            name: "Call Center Login",
            icon: <Ionicons name="lock-closed" size={hp("4%")} color="white" />,
            loginType: "CallCenter",
          },
        ]
      : []),
  ];

  const shouldUseMobileStyles = Platform.OS !== "web" || isMobileWidth;

  return (
    <View style={styles.container}>
      <Image source={require("./assets/logo.png")} style={styles.logo} />
      <Text style={styles.welcomeText}>Welcome To Wealth Associates</Text>
      <Text style={styles.loginAsText}>Login as</Text>

      {shouldUseMobileStyles ? (
        <View style={styles.gridContainer}>
          {loginOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                shouldUseMobileStyles && styles.mobileSpecificButton,
              ]}
              onPress={() => handleLoginTypeSelection(option.loginType)}
            >
              {option.icon}
              <Text style={styles.buttonText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.gridContainer}>
            {loginOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.button}
                onPress={() => handleLoginTypeSelection(option.loginType)}
              >
                {option.icon}
                <Text style={styles.buttonText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? hp("3%") : hp("5%"),
  },
  logo: {
    width: wp("50%"),
    height: hp("20%"),
    resizeMode: "contain",
    marginBottom: hp("3%"),
  },
  welcomeText: {
    fontSize:
      Platform.OS === "android" || Platform.OS === "ios"
        ? hp("2.59%")
        : hp("3%"),
    fontWeight: "bold",
    color: "#2B2D42",
    marginBottom: hp("1%"),
  },
  loginAsText: {
    fontSize:
      Platform.OS === "android" || Platform.OS === "ios" ? hp("3%") : hp("3%"),
    fontWeight: "600",
    marginBottom:
      Platform.OS === "android" || Platform.OS === "ios" ? hp("2%") : hp("2%"),
    color: "#2B2D42",
  },
  card: {
    backgroundColor: "#FDFDFD",
    padding: hp("3%"),
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: wp("60%"),
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp("2%"),
    height: "400px",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: Platform.OS === "web" ? "100%" : "40px",
  },
  button: {
    width: Platform.OS === "web" ? "15%" : wp("38%"),
    maxWidth: Platform.OS === "web" ? 200 : 180,
    height: hp("12%"),
    maxHeight: 120,
    backgroundColor: "#3E5C76",
    borderRadius: Platform.OS === "web" ? 15 : wp("3%"),
    alignItems: "center",
    justifyContent: "center",
    margin: Platform.OS === "web" ? "1.5%" : hp("1.5%"),
    elevation: Platform.OS === "android" ? 5 : 0,
    shadowColor: "#000",
    shadowOffset:
      Platform.OS === "ios" || Platform.OS === "web"
        ? { width: 0, height: 3 }
        : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === "ios" || Platform.OS === "web" ? 0.2 : 0,
    shadowRadius: Platform.OS === "ios" || Platform.OS === "web" ? 5 : 0,
    marginBottom:
      Platform.OS === "android" || Platform.OS === "ios" ? hp("0%") : hp("10%"),
  },
  mobileSpecificButton: {
    width: wp("38%"),
    maxWidth: 180,
    borderRadius: wp("3%"),
    margin: hp("1.5%"),
    elevation: Platform.OS === "android" ? 5 : 0,
    shadowOffset:
      Platform.OS === "ios" ? { width: 0, height: 3 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === "ios" ? 0.2 : 0,
    shadowRadius: Platform.OS === "ios" ? 5 : 0,
    marginBottom: hp("0%"),
  },
  buttonText: {
    color: "white",
    fontSize: hp("2%"),
    marginTop: hp("1%"),
    textAlign: "center",
  },
});

export default StartingScreen;