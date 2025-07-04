import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ViewAllRequestedProperties from "./AllrequestedProperties";
import ViewAllProperties from "./ViewAllProperties";
import MyProperties from "./ViewPostedProperties";
import MyRequestedProperties from "./ViewRequestedProperties";
import { useNavigation } from "@react-navigation/native";

export default function PropertiesScreen() {
  const [activeTab, setActiveTab] = useState("all");
  const navigation = useNavigation();
  const [fabOpen, setFabOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    if (fabOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => setFabOpen(false));
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => setFabOpen(true));
    }
  };

  useEffect(() => {
    // Auto open
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFabOpen(true);
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => setFabOpen(false));
      }, 600); // Delay before closing
    });
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const slideUpInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const fabOptions = [
    {
      icon: "add",
      label: "Post Property",
      action: () => navigation.navigate("postproperty"),
    },
    {
      icon: "add-circle-outline",
      label: "Request Property",
      action: () => navigation.navigate("requestproperty"),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          <View style={styles.navItems}>
            <NavButton
              icon="home"
              label="All Properties"
              active={activeTab === "all"}
              onPress={() => setActiveTab("all")}
            />
            <NavButton
              icon="list"
              label="All Requested"
              active={activeTab === "requested"}
              onPress={() => setActiveTab("requested")}
            />
            <NavButton
              icon="person"
              label="My Properties"
              active={activeTab === "myProperties"}
              onPress={() => setActiveTab("myProperties")}
            />
            <NavButton
              icon="person-outline"
              label="My Requested"
              active={activeTab === "myRequested"}
              onPress={() => setActiveTab("myRequested")}
            />
          </View>
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <ScrollView style={styles.contentScroll} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
          {activeTab === "all" ? (
            <ViewAllProperties />
          ) : activeTab === "requested" ? (
            <ViewAllRequestedProperties />
          ) : activeTab === "myProperties" ? (
            <MyProperties />
          ) : (
            <MyRequestedProperties />
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        {fabOpen && (
          <Animated.View
            style={[
              styles.fabMenu,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpInterpolate }],
              },
            ]}
          >
            {fabOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={styles.fabOption}
                onPress={() => {
                  option.action();
                  toggleFab();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={option.icon} size={20} color="white" />
                <Text style={styles.fabOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={toggleFab}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons name="add" size={28} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const NavButton = React.memo(({ icon, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.navButton, active && styles.activeNavButton]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={20}
      color={active ? "#3f51b5" : "#757575"}
      style={styles.navIcon}
    />
    <Text style={[styles.navButtonText, active && styles.activeNavButtonText]}>
      {label}
    </Text>
    {active && <View style={styles.activeIndicator} />}
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    top:20
  },
  topNav: {
    backgroundColor: Platform.OS === 'web' ? "#D8E3E7" : "#FDFDFD",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 3,
    
    ...Platform.select({
      web: {
        position: "sticky",
        top: 0,
        zIndex: 100,
      },
    }),
  },
  navItems: {
    flexDirection: "row",
    paddingHorizontal: 10,
    
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 2,
    backgroundColor: "#f5f5f5",
  },
  activeNavButton: {
    backgroundColor: "#e8eaf6",
  },
  navIcon: {
    marginRight: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  activeNavButtonText: {
    color: "#3f51b5",
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -10,
    left: "50%",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3f51b5",
    transform: [{ translateX: -2 }],
  },
  mainContent: {
    flex: 1,
    padding: 15,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: "auto",
        width: "100%",
      },
    }),
  },
  contentScroll: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    bottom: "15%",
    right: 30,
    alignItems: "flex-end",
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3f51b5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabMenu: {
    backgroundColor: "rgba(63, 81, 181, 0.95)",
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabOptionText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
  },
});

// Web hover styles
if (Platform.OS === "web") {
  const hoverStyles = `
    .navButton:hover {
      background-color: #e0e0e0;
      transition: background-color 100ms ease-out;
    }
    .fabButton:hover {
      background-color: #303f9f;
      transform: scale(1.05);
      transition: all 100ms ease-out;
    }
    .fabOption:hover {
      background-color: rgba(255,255,255,0.1);
      transition: background-color 100ms ease-out;
    }
  `;
  const styleElement = document.createElement("style");
  styleElement.innerHTML = hoverStyles;
  document.head.appendChild(styleElement);
}
