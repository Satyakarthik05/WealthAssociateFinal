import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Text,
} from "react-native";
import CoreClients from "./CoreClients";
import CoreProjects from "./CoreProjects";
import ValueProjects from "./ValueProjects";

const ClientsAndProjectsScreen = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 450;

  return (
    <ScrollView
      style={[
        styles.container,
        {
          paddingBottom: isMobile ? 100 : "20%", // 👈 extra space in mobile
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Core Clients Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isMobile && styles.mobileTitle]}>
          Core Clients
        </Text>
        <CoreClients />
      </View>

      {/* Core Projects Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Projects</Text>
        <CoreProjects />
      </View>

      {/* Value Projects Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Value Projects</Text>
        <ValueProjects />
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    paddingTop: 20,
  },
  section: {
    marginBottom: 15,
    marginHorizontal: 10, // Adds space on left and right
    borderRadius: 10,
    width: "95%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 15,
    backgroundColor: "#D8E3E7",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
    borderRadius: 8,
  },
  mobileTitle: {
    fontSize: 16,
    padding: 12,
  },
});

export default ClientsAndProjectsScreen;
