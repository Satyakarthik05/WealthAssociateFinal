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

const CoreClients = () => {
  const [coreClients, setCoreClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoreClients = async () => {
    try {
      const response = await fetch(`${API_URL}/coreclient/getallcoreclients`);
      const data = await response.json();
      setCoreClients(data);
    } catch (error) {
      console.error("Error fetching core clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoreClients();
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
        <ActivityIndicator size="large" color="#3E5C76" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {coreClients.length === 0 ? (
        <Text style={styles.emptyText}>No core clients available</Text>
      ) : (
        <View style={styles.clientsWrapper}>
          {coreClients.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.clientCard}
              onPress={() => handleOpenLink(item.website)}
            >
              <Image
                source={{ uri: item.newImageUrl }}
                style={styles.clientImage}
              />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  clientsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  clientCard: {
    width: "48%",
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    padding: 10,
    marginBottom: 5,
  },
  clientImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});

export default CoreClients;
