import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../data/ApiUrl";

const { width } = Dimensions.get("window");
const numColumns = width > 800 ? 4 : 1;

const RequestedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [referralDetails, setReferralDetails] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${API_URL}/requestProperty/getallrequestProperty`,
        {
          method: "GET",
          headers: { token: token },
        }
      );
      const data = await response.json();

      // Sort properties: non-approved first, then approved
      const sortedProperties = [...data].sort((a, b) => {
        if (a.Approved === "Pending" && b.Approved !== "Pending") return -1;
        if (a.Approved !== "Pending" && b.Approved === "Pending") return 1;
        return 0;
      });

      const formattedProperties = sortedProperties.map((item) => ({
        id: item._id,
        title: item.propertyTitle,
        type: item.propertyType,
        location: item.location,
        budget: `₹${item.Budget?.toLocaleString() || "0"}`,
        PostedBy: item.PostedBy,
        approved: item.Approved,
        image: getImageByPropertyType(item.propertyType),
      }));

      setProperties(formattedProperties);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchProperties, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchReferralDetails = async (postedByNumber) => {
    if (!postedByNumber) {
      Alert.alert("Error", "No PostedBy number available");
      return;
    }

    try {
      setReferralLoading(true);
      setReferralModalVisible(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        return;
      }

      const response = await fetch(
        `${API_URL}/properties/getreqreff/${postedByNumber}`,
        {
          method: "GET",
          headers: { token: token },
        }
      );

      const data = await response.json();
      setReferralDetails(data);
    } catch (error) {
      console.error("Error fetching referral details:", error);
      Alert.alert("Error", "Failed to fetch referral details");
    } finally {
      setReferralLoading(false);
    }
  };

  const deleteProperty = async (id) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        return;
      }
      await fetch(`${API_URL}/requestProperty/delete/${id}`, {
        method: "DELETE",
        headers: { token: token },
      });
      setProperties(properties.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const handleApprove = async (id) => {
    const confirmApproval = async () => {
      return new Promise((resolve) => {
        if (Platform.OS === "web") {
          resolve(
            window.confirm("Are you sure you want to approve this property?")
          );
        } else {
          Alert.alert(
            "Confirm Approval",
            "Are you sure you want to approve this property?",
            [
              {
                text: "Cancel",
                onPress: () => resolve(false),
                style: "cancel",
              },
              { text: "Approve", onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        }
      });
    };

    const isConfirmed = await confirmApproval();
    if (!isConfirmed) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        return;
      }

      const response = await fetch(`${API_URL}/requestProperty/approve/${id}`, {
        method: "PUT",
        headers: { token: token },
      });

      if (response.ok) {
        Alert.alert("Success", "Property approved successfully");
        // Refresh the list after approval
        fetchProperties();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Approval failed");
      }
    } catch (err) {
      console.error("Approve error:", err);
      Alert.alert("Error", "Failed to approve property");
    }
  };

  const getImageByPropertyType = (propertyType) => {
    switch (propertyType.toLowerCase()) {
      case "land":
        return require("../assets/Land.jpg");
      case "residential":
        return require("../assets/residntial.jpg");
      case "commercial":
        return require("../assets/commercial.jpg");
      case "villa":
        return require("../assets/villa.jpg");
      default:
        return require("../assets/house.png");
    }
  };

  const getLastFourChars = (id) => id?.slice(-4) || "N/A";

  const getApprovalStatus = (status) => {
    switch (status) {
      case "Done":
        return { text: "Approved", color: "#2ecc71" };
      case "Pending":
      default:
        return { text: "Pending", color: "#f39c12" };
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Requested Properties</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e91e63" />
            <Text style={styles.loadingText}>Fetching properties...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {properties.length === 0 ? (
              <Text style={styles.noPropertiesText}>No properties found</Text>
            ) : (
              properties.map((item) => {
                const approvalStatus = getApprovalStatus(item.approved);
                return (
                  <View key={item.id} style={styles.card}>
                    <Image source={item.image} style={styles.image} />
                    <View style={styles.details}>
                      <View style={styles.idContainer}>
                        <Text style={styles.idText}>
                          ID: {getLastFourChars(item.id)}
                        </Text>
                      </View>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.text}>
                        Property Type: {item.type}
                      </Text>
                      <Text style={styles.text}>Location: {item.location}</Text>
                      <Text style={styles.text}>Budget: {item.budget}</Text>
                      <Text style={styles.text}>
                        Posted By: {item.PostedBy || "N/A"}
                      </Text>
                      <View
                        style={[
                          styles.statusContainer,
                          { backgroundColor: approvalStatus.color },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {approvalStatus.text}
                        </Text>
                      </View>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={[styles.button, styles.referralButton]}
                          onPress={() => fetchReferralDetails(item.PostedBy)}
                        >
                          <Text style={styles.buttonText}>View Referral</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.deleteButton]}
                          onPress={() => deleteProperty(item.id)}
                        >
                          <Text style={styles.buttonText}>Delete</Text>
                        </TouchableOpacity>
                        {item.approved !== "Done" && (
                          <TouchableOpacity
                            style={[styles.button, styles.approveButton]}
                            onPress={() => handleApprove(item.id)}
                          >
                            <Text style={styles.buttonText}>Approve</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Referral Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={referralModalVisible}
        onRequestClose={() => {
          setReferralModalVisible(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setReferralModalVisible(false)}
        >
          <Pressable
            style={styles.modalView}
            onPress={(e) => e.stopPropagation()}
          >
            {referralLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#e91e63" />
                <Text style={styles.modalLoadingText}>
                  Fetching referral details...
                </Text>
              </View>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Referral Details</Text>

                {referralDetails ? (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Name:</Text>{" "}
                      {referralDetails.postedByName || "N/A"}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Phone:</Text>{" "}
                      {referralDetails.name || "N/A"}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Referral Phno:</Text>{" "}
                      {referralDetails.phone || "N/A"}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Collection:</Text>{" "}
                      {referralDetails.source || "N/A"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noDetailsText}>
                    No referral details available
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.button, styles.closeButton]}
                  onPress={() => setReferralModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "left",
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    margin: 8,
    width: Platform.OS === "android" ? width / numColumns - 100 : 230,
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  details: {
    padding: 10,
  },
  idContainer: {
    backgroundColor: "#2ecc71",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  idText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  statusContainer: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#888",
  },
  noPropertiesText: {
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 5,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: "center",
    minWidth: 80,
    marginVertical: 2,
  },
  referralButton: {
    backgroundColor: "#3498db",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
  },
  approveButton: {
    backgroundColor: "#2ecc71",
  },
  closeButton: {
    backgroundColor: "#e91e63",
    marginTop: 15,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  detailsContainer: {
    width: "100%",
    marginBottom: 15,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  noDetailsText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 15,
  },
  modalLoadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#888",
  },
});

export default RequestedProperties;
