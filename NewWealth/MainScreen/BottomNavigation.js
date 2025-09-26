import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const notchHeight = 45;
const barHeight = 75;
const radius = 32;

const BottomNavigation = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 450;
  const [activeTab, setActiveTab] = useState("newhome");

  if (Platform.OS !== "web" && !isMobile) {
    return null;
  }

  const tabCount = 5;
  const tabWidth = width / tabCount;

  const tabs = [
    {
      label: "Home",
      icon: "home-outline",
      screenName: "newhome",
      iconActive: "home",
    },
    {
      label: "Add Member",
      icon: "person-add-outline",
      screenName: "addmember",
      iconActive: "person-add",
    },
    {
      label: "Property",
      icon: "business-outline",
      screenName: "propertyhome",
      iconActive: "business",
    },
    {
      label: "Expert Panel",
      icon: "people-outline",
      screenName: "expertpanel",
      iconActive: "people",
    },
    {
      label: "Core Projects",
      icon: "star-outline",
      screenName: "coreclipro",
      iconActive: "star",
    },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.screenName === activeTab);
  const centerX = tabWidth * activeIndex + tabWidth / 2;

  // Path for the curved notch background
  const getPath = (index) => {
    const centerX = tabWidth * index + tabWidth / 2;
    return `
      M0 0 
      H${centerX - radius - 15} 
      C${centerX - radius} 0 ${
      centerX - radius
    } ${notchHeight} ${centerX} ${notchHeight} 
      C${centerX + radius} ${notchHeight} ${centerX + radius} 0 ${
      centerX + radius + 15
    } 0 
      H${width} 
      V${barHeight} 
      H0 
      Z
    `;
  };

  const handleTabPress = (screenName) => {
    setActiveTab(screenName);
    navigation.navigate("Main", { screen: screenName });
  };

  if (!isMobile) return null;

  return (
    <View style={styles.wrapper}>
      {/* Curved background path */}
      <Svg width={width} height={barHeight} style={StyleSheet.absoluteFill}>
        <Path d={getPath(activeIndex)} fill="#ffffff" />
      </Svg>

      {/* Floating active icon perfectly centered inside the U notch */}
      <TouchableOpacity
        style={[styles.activeIconContainer, { left: centerX - 30 }]}
        onPress={() => handleTabPress(tabs[activeIndex].screenName)}
        activeOpacity={0.8}
      >
        <View style={styles.activeCircle}>
          <Ionicons
            name={tabs[activeIndex].iconActive}
            size={28}
            color="#3E5C76"
          />
        </View>
      </TouchableOpacity>

      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => {
          const isFocused = activeTab === tab.screenName;
          const color = isFocused ? "transparent" : "#B0B0B0"; // Make active tab icon transparent

          return (
            <TouchableOpacity
              key={index}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.screenName)}
              activeOpacity={0.8}
            >
              <View>
                <Ionicons name={tab.icon} size={24} color={color} />
              </View>
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: barHeight,
    backgroundColor: "transparent",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: barHeight,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    position: "absolute",
    top: -notchHeight + 15,
    zIndex: 10,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCircle: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 35,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tabLabel: {
    fontSize: 8,
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default BottomNavigation;
