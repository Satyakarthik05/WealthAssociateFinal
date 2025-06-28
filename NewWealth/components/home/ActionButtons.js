import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const ActionButtons = ({ navigation }) => {
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem("userType");
        setUserType(storedUserType);
      } catch (error) {
        console.error("Error retrieving userType:", error);
      }
    };
    fetchUserType();
  }, []);

  const actionButton = (
    iconName,
    label,
    bgColor,
    IconComponent = Ionicons,
    screenName
  ) => (
    <TouchableOpacity
      key={label}
      style={styles.actionButtonWrapper}
      onPress={() => navigation.navigate(screenName)}
    >
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <IconComponent name={iconName} size={28} color="#1B4D3E" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.actionRow}>
        {actionButton(
          "home",
          "Post\nProperty",
          "#E3F2FD",
          Ionicons,
          "postproperty"
        )}
        {actionButton(
          "home-search",
          "Request\nProperty",
          "#E8F5E9",
          MaterialCommunityIcons,
          "requestproperty"
        )}
        {actionButton(
          "account-check",
          "Request\nExpert",
          "#FFF3E0",
          MaterialCommunityIcons,
          "requestexpert"
        )}
      </View>

      <View style={styles.compactActionRow}>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => navigation.navigate("suppliersvendors")}
        >
          <MaterialIcons name="store" size={20} color="#fff" />
          <Text style={styles.compactButtonText}>Suppliers & Vendors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => navigation.navigate("skilledresources")}
        >
          <Ionicons name="people" size={20} color="#fff" />
          <Text style={styles.compactButtonText}>Skilled Resources</Text>
        </TouchableOpacity>
      </View>

      {userType === "CoreMember" && (
        <View style={[styles.compactActionRow, { marginTop: 10 }]}>
          <TouchableOpacity
            style={styles.compactButton}
            onPress={() => navigation.navigate("callexestatus")}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.compactButtonText}>Call Exec Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.compactButton}
            onPress={() => navigation.navigate("analytics")}
          >
            <Ionicons name="analytics" size={20} color="#fff" />
            <Text style={styles.compactButtonText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  actionButtonWrapper: {
    alignItems: "center",
    width: 90,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
    color: "#444",
  },
  compactActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3E5C76",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    elevation: 3,
  },
  compactButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
});

export default ActionButtons;
