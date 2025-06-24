import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWindowDimensions } from "react-native";
import { API_URL } from "../../data/ApiUrl";
import logo1 from "../../assets/man.png";

const ExpertDetails = ({ expertType, onSwitch }) => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [Details, setDetails] = useState({});
  const [PostedBy, setPostedBy] = useState("");

  const { width } = useWindowDimensions();
  const isMobileView = Platform.OS !== "web" || width < 450;

  useEffect(() => {
    if (!expertType) return;

    fetch(`${API_URL}/expert/getexpert/${expertType}`)
      .then((response) => response.json())
      .then((data) => {
        setExperts(data.experts || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch experts. Please try again later.");
        setLoading(false);
      });
  }, [expertType]);

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/agent/AgentDetails`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      const newDetails = await response.json();
      setPostedBy(newDetails.MobileNumber);
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  const requestExpert = async (expert) => {
    try {
      const response = await fetch(`${API_URL}/requestexpert/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Name: Details.FullName ? Details.FullName : "name",
          MobileNumber: Details.MobileNumber
            ? Details.MobileNumber
            : "MobileNumber",
          ExpertType: expertType,
          ExpertName: expert.name,
          ExpertNo: expert.mobile,
          RequestedBy: "WealthAssociate",
        }),
      });

      const result = await response.json();
      if (response.ok) {
        if (Platform.OS === "web") {
          window.alert("Expert Requested Successfully");
        } else {
          Alert.alert("Expert Requested");
        }
      } else {
        Alert.alert(
          "Request Failed",
          result.message || "Something went wrong."
        );
      }
    } catch (error) {
      console.error("Request error:", error);
      Alert.alert(
        "Network error",
        "Please check your internet connection and try again."
      );
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#D8E3E7" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.container,
            {
              width: isMobileView ? "100%" : "80%",
            },
          ]}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onSwitch(null)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.header}>{expertType} Experts</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : experts.length > 0 ? (
            <View style={styles.cardContainer}>
              {experts.map((item, index) => (
                <View
                  key={item._id}
                  style={[
                    styles.expertCard,
                    {
                      width: isMobileView ? "90%" : "30%",
                    },
                  ]}
                >
                  <Image
                    source={
                      item.photo ? { uri: `${API_URL}${item.photo}` } : logo1
                    }
                    style={styles.profileImage}
                  />

                  <Text style={styles.expertName}>{item.name}</Text>
                  <Text style={styles.expertDetails}>
                    <Text style={styles.label}>Qualification:</Text>{" "}
                    {item.qualification}
                  </Text>
                  <Text style={styles.expertDetails}>
                    <Text style={styles.label}>Experience:</Text>{" "}
                    {item.experience} Years
                  </Text>
                  <Text style={styles.expertDetails}>
                    <Text style={styles.label}>Location:</Text> {item.location}
                  </Text>
                  <TouchableOpacity
                    style={styles.requestButton}
                    onPress={() => requestExpert(item)}
                  >
                    <Text style={styles.requestButtonText}>Request Expert</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noExperts}>
              No experts found for this category.
            </Text>
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: Platform.OS === "web" ? "80%" : "100%",
    alignSelf: "center",
  },
  headerContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: "#A9BCD0",
    paddingTop: 14, // increased top padding
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 20, // more spacing from top
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: "center", // centers content vertically
    alignItems: "center", // centers content horizontally
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#282D42",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
  },
  scrollView: {
    width: "100%",
    marginBottom: 20,
    flexGrow: 1,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    paddingBottom: 20,
  },
  expertCard: {
    width: Platform.OS === "web" ? "30%" : "90%",
    backgroundColor: "#FDFDFD",
    padding: 16,
    margin: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  expertName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  expertDetails: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  noExperts: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
    marginTop: 20,
    marginBottom: 20,
  },
  requestButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ExpertDetails;
