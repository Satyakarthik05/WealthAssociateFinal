import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API_URL } from "../../../data/ApiUrl";
import logo1 from "../../../assets/logo.png";

const { width } = Dimensions.get("window");

const ViewLikedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState(null);
  const [idSearch, setIdSearch] = useState("");

  const formatImages = (property) => {
    if (!property) return [];

    if (Array.isArray(property.photo) && property.photo.length > 0) {
      return property.photo.map((photo) => ({
        uri: photo.startsWith("http") ? photo : `${API_URL}${photo}`,
      }));
    }

    if (typeof property.photo === "string") {
      return [
        {
          uri: property.photo.startsWith("http")
            ? property.photo
            : `${API_URL}${property.photo}`,
        },
      ];
    }

    return [logo1];
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch(
        `${API_URL}/properties/getalllikedproperties`
      );
      const data = await response.json();
      if (data && Array.isArray(data)) {
        // Sort properties: "Pending" first, then "Done"
        const sortedData = data.sort((a, b) => {
          if (
            a.CallExecutiveCall === "Pending" &&
            b.CallExecutiveCall !== "Pending"
          )
            return -1;
          if (
            a.CallExecutiveCall !== "Pending" &&
            b.CallExecutiveCall === "Pending"
          )
            return 1;
          return 0;
        });

        setProperties(
          sortedData.map((property) => ({
            ...property,
            images: formatImages(property),
          }))
        );
      } else {
        console.warn("API returned empty data.");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const getLastFourChars = (id) => {
    return id ? id.slice(-4) : "N/A";
  };

  const filteredProperties = properties.filter((property) => {
    const matchesId = idSearch
      ? getLastFourChars(property._id)
          .toLowerCase()
          .includes(idSearch.toLowerCase())
      : true;

    return matchesId;
  });

  const renderPropertyImage = (property) => {
    if (Array.isArray(property.photo) && property.photo.length > 0) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {property.photo.map((photo, index) => (
            <Image
              key={index}
              source={{
                uri:
                  typeof photo === "string"
                    ? photo.startsWith("http")
                      ? photo
                      : `${API_URL}${photo}`
                    : `${API_URL}${photo?.uri || ""}`,
              }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      );
    } else if (property.photo && typeof property.photo === "string") {
      return (
        <Image
          source={{
            uri: property.photo.startsWith("http")
              ? property.photo
              : `${API_URL}${property.photo}`,
          }}
          style={styles.image}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.image}
          resizeMode="contain"
        />
      );
    }
  };

  const handleDelete = async (id) => {
    if (Platform.OS === "web") {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this property?"
      );
      if (!confirmDelete) return;
    } else {
      const confirmDelete = await new Promise((resolve) => {
        Alert.alert(
          "Confirm",
          "Are you sure you want to delete this property?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Delete", onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirmDelete) return;
    }

    try {
      const response = await fetch(`${API_URL}/properties/likeddelete/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (response.ok) {
        setProperties(properties.filter((item) => item._id !== id));
        if (Platform.OS === "web") {
          alert("Property deleted successfully.");
        } else {
          Alert.alert("Success", "Property deleted successfully.");
        }
      } else {
        if (Platform.OS === "web") {
          alert(result.message || "Failed to delete.");
        } else {
          Alert.alert("Error", result.message || "Failed to delete.");
        }
      }
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const handleCallDone = async (id) => {
    const confirm = await new Promise((resolve) => {
      if (Platform.OS === "web") {
        resolve(
          window.confirm("Are you sure you want to mark this call as done?")
        );
      } else {
        Alert.alert("Confirm", "Mark this call as done?", [
          { text: "Cancel", onPress: () => resolve(false) },
          { text: "Mark as Done", onPress: () => resolve(true) },
        ]);
      }
    });

    if (!confirm) return;

    try {
      const response = await fetch(`${API_URL}/properties/callDone/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ CallExecutiveCall: "Done" }),
      });

      if (response.ok) {
        // Update the local state to reflect the change
        setProperties(
          properties.map((property) =>
            property._id === id
              ? { ...property, CallExecutiveCall: "Done" }
              : property
          )
        );
        Alert.alert("Success", "Call marked as done");
        // Re-fetch to get the updated sorted list
        fetchProperties();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.message || "Failed to mark call as done");
      }
    } catch (err) {
      console.error("Call done error:", err);
      Alert.alert("Error", "Failed to mark call as done");
    }
  };

  const handleViewDetails = (property) => {
    setSelectedPropertyDetails(property);
    setIsDetailsModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.heading}>Liked Properties</Text>
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedFilter}
                  onValueChange={(value) => setSelectedFilter(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Filter --" value="" />
                  <Picker.Item label="Price: High to Low" value="lowToHigh" />
                  <Picker.Item label="Price: Low to High" value="highToLow" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by last 4 digits of ID"
              value={idSearch}
              onChangeText={setIdSearch}
              maxLength={4}
            />
          </View>

          <View style={styles.grid}>
            {filteredProperties.map((item) => {
              const propertyId = getLastFourChars(item._id);

              return (
                <View
                  key={item._id}
                  style={[
                    styles.card,
                    item.CallExecutiveCall === "Done" && styles.doneCard,
                  ]}
                >
                  {renderPropertyImage(item)}

                  <View style={styles.details}>
                    <View
                      style={[
                        styles.idContainer,
                        item.CallExecutiveCall === "Done"
                          ? styles.doneIdContainer
                          : styles.pendingIdContainer,
                      ]}
                    >
                      <Text style={styles.idText}>ID: {propertyId}</Text>
                    </View>
                    <Text style={styles.title}>{item.propertyType}</Text>
                    <Text style={styles.title}>{item.propertyDetails}</Text>
                    <Text style={styles.title}>
                      LikedBy: {item.MobileNumber}
                    </Text>
                    <Text style={styles.title}>
                      LikedByName: {item.FullName}
                    </Text>
                    <Text style={styles.info}>Location: {item.location}</Text>
                    <Text style={styles.budget}>
                      ₹ {parseInt(item.price).toLocaleString()}
                    </Text>
                    <Text style={styles.callStatus}>
                      Status: {item.CallExecutiveCall || "Pending"}
                    </Text>
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.viewButton]}
                      onPress={() => handleViewDetails(item)}
                    >
                      <Text style={styles.buttonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.callButton,
                        item.CallExecutiveCall === "Done" &&
                          styles.callDoneButton,
                      ]}
                      onPress={() => handleCallDone(item._id)}
                      disabled={item.CallExecutiveCall === "Done"}
                    >
                      <Text style={styles.buttonText}>
                        {item.CallExecutiveCall === "Done"
                          ? "Called"
                          : "Call Done"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.deleteButton]}
                      onPress={() => handleDelete(item._id)}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Details Modal */}
          <Modal
            visible={isDetailsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsDetailsModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.detailsModalContent, { maxHeight: "90%" }]}>
                <Text style={styles.modalTitle}>Property Details</Text>

                {selectedPropertyDetails && (
                  <>
                    <View style={styles.detailImageContainer}>
                      {renderPropertyImage(selectedPropertyDetails)}
                    </View>

                    <ScrollView style={styles.detailsScrollView}>
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>
                          Basic Information
                        </Text>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Property ID:</Text>
                          <Text style={styles.detailValue}>
                            {getLastFourChars(selectedPropertyDetails._id)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Type:</Text>
                          <Text style={styles.detailValue}>
                            {selectedPropertyDetails.propertyType}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Location:</Text>
                          <Text style={styles.detailValue}>
                            {selectedPropertyDetails.location}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Price:</Text>
                          <Text style={styles.detailValue}>
                            ₹{" "}
                            {parseInt(
                              selectedPropertyDetails.price
                            ).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Property Details:
                          </Text>
                          <Text style={styles.detailValue}>
                            {selectedPropertyDetails.propertyDetails || "N/A"}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Posted By:</Text>
                          <Text style={styles.detailValue}>
                            {selectedPropertyDetails.PostedBy || "N/A"}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Call Status:</Text>
                          <Text style={styles.detailValue}>
                            {selectedPropertyDetails.CallExecutiveCall ||
                              "Pending"}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setIsDetailsModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#f5f5f5", padding: 15, marginBottom: 30 },
  header: {
    flexDirection: Platform.OS === "android" ? "column" : "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: { fontSize: 22, fontWeight: "bold", textAlign: "left" },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  filterLabel: { fontSize: 16, marginRight: 5 },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
    height: Platform.OS === "android" ? 50 : 40,
  },
  picker: { height: "100%", width: 180, fontSize: 14 },
  loader: { marginTop: 50 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    margin: 10,
    width: Platform.OS === "web" ? "30%" : "100%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  doneCard: {
    backgroundColor: "#f0f0f0",
    opacity: 0.8,
  },
  imageScroll: {
    flexDirection: "row",
    maxHeight: 200,
    marginBottom: 10,
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 8,
    marginRight: 10,
  },
  details: { marginTop: 10 },
  idContainer: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  pendingIdContainer: {
    backgroundColor: "#FFA500", // Orange for pending
  },
  doneIdContainer: {
    backgroundColor: "#4CAF50", // Green for done
  },
  idText: {
    color: "#fff",
    fontWeight: "600",
  },
  title: { fontSize: 16, fontWeight: "bold" },
  info: { fontSize: 14, color: "#555" },
  budget: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  callStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginTop: 3,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    flexWrap: "wrap",
  },
  button: {
    padding: 6,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 2,
    marginBottom: 5,
    minWidth: 70,
  },
  viewButton: {
    backgroundColor: "#3498db",
  },
  callButton: {
    backgroundColor: "#FFA500",
  },
  callDoneButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  detailsModalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: Platform.OS === "web" ? "70%" : "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#3498db",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#fff",
  },
  detailImageContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  detailsScrollView: {
    maxHeight: Platform.OS === "web" ? 400 : 300,
  },
  detailSection: {
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#3498db",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontWeight: "bold",
    width: "40%",
  },
  detailValue: {
    width: "60%",
    textAlign: "right",
  },
});

export default ViewLikedProperties;
