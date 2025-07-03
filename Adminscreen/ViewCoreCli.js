import React, { useState, useEffect } from "react";
// import { StyleSheet, Text, View } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { API_URL } from "../data/ApiUrl";
const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const Core_Clients = () => {
  const [coreClients, setCoreClients] = useState([]);
  useEffect(() => {
    // Fetch data from the backend
    const fetchCoreCProject = async () => {
      try {
        const response = await fetch(`${API_URL}/coreclient/getallcoreclients`);
        const data = await response.json();
        setCoreClients(data);
      } catch (error) {
        console.error("Error fetching core clients:", error);
      }
    };

    fetchCoreCProject();
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>Core Clients</Text>
      <View style={styles.cardContainer}>
        {coreClients.map((client, index) => (
          <View key={index} style={styles.card}>
            <Image
              source={{ uri: client.newImageUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default Core_Clients;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    marginTop: Platform.OS === "web" ? 40 : 40,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: isWeb ? 200 : 150, // Fixed width for horizontal scrolling
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginRight: 10, // Add margin between cards
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  logo: { width: "80%", height: "80%" },
});
