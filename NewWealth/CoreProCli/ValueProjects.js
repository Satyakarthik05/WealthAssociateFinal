import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  ActivityIndicator,
} from "react-native";
import { API_URL } from "../../data/ApiUrl";

const { width } = Dimensions.get("window");

const ValueProjects = () => {
  const [coreProjects, setCoreProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoreProjects = async () => {
    try {
      const response = await fetch(
        `${API_URL}/coreproject/getallValueprojects`
      );
      const data = await response.json();
      setCoreProjects(data);
    } catch (error) {
      console.error("Error fetching core projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoreProjects();
  }, []);

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Couldn't load page", err)
      );
    } else {
      alert("Website link not available");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D81B60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {coreProjects.length === 0 ? (
        <Text style={styles.emptyText}>No value projects available</Text>
      ) : (
        <View style={styles.projectsWrapper}>
          {coreProjects.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.projectCard}
              onPress={() => handleOpenLink(item.website)}
            >
              <Image
                source={{ uri: item.newImageUrl }}
                style={styles.projectImage}
              />
              <Text style={styles.projectTitle}>{item.city}</Text>
              <Text style={styles.projectSubtitle}>{item.projectName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    padding: 10,
    marginBottom: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  projectsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  projectCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 15,
  },
  projectImage: {
    width: "100%",
    height: 90,
    resizeMode: "contain",
    borderRadius: 8,
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  projectSubtitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});

export default ValueProjects;
