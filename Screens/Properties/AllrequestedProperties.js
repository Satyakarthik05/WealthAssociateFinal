import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import logo6 from "../../assets/Land.jpg";
import logo7 from "../../assets/residntial.jpg";
import logo8 from "../../assets/commercial.jpg";
import logo9 from "../../assets/villa.jpg";
import logo10 from "../../assets/house.png";
import logo11 from "../../assets/logo.png";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const ViewAllRequestedProperties = ({ navigation }) => {
  const [propertiess, setPropertiess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [agentLocation, setAgentLocation] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [referredInfo, setReferredInfo] = useState(null);

  const getImageByPropertyType = (propertyType) => {
    switch (propertyType.toLowerCase()) {
      case "land":
        return logo6;
      case "residential":
        return logo7;
      case "commercial":
        return logo8;
      case "villa":
        return logo9;
      default:
        return logo10;
    }
  };

  const getAgentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/agent/AgentDetails`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });
      const data = await response.json();
      setAgentLocation(data.Contituency || "");
      if (data.ReferredBy) {
        fetchReferredDetails(data.ReferredBy);
      }
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  const fetchReferredDetails = async (referredById) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(
        `${API_URL}/properties/getPropertyreffered`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token || "",
          },
          body: JSON.stringify({
            referredBy: referredById,
          }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.status === "success") {
        setReferredInfo(data.referredByDetails);
      }
    } catch (error) {
      console.error("Error fetching referredBy info:", error);
    }
  };

  const fetchPropertiess = async () => {
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
          headers: {
            token: `${token}` || "",
          },
        }
      );
      const data = await response.json();

      const doneProperties = data.filter((item) => item.Approved === "Done");

      const formattedProperties = doneProperties.map((item) => ({
        id: item._id,
        title: item.propertyTitle,
        type: item.propertyType,
        location: item.location,
        budget: `₹${item.Budget.toLocaleString()}`,
        image: getImageByPropertyType(item.propertyType),
        createdAt: item.createdAt,
        contactNumber: item.contactNumber,
        email: item.email,
        additionalDetails: item.additionalDetails,
        isInMyLocation:
          agentLocation &&
          item.location.toLowerCase().includes(agentLocation.toLowerCase()),
      }));

      // Sort with agent's location first
      const sortedProperties = [...formattedProperties].sort((a, b) => {
        if (a.isInMyLocation && !b.isInMyLocation) return -1;
        if (!a.isInMyLocation && b.isInMyLocation) return 1;
        return 0;
      });

      setPropertiess(sortedProperties);
      setFilteredProperties(sortedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLastFourCharss = (id) => {
    if (!id) return "N/A";
    return id.length > 4 ? id.slice(-4) : id;
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterProperties(text, filterType);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    filterProperties(searchQuery, type);
  };

  const filterProperties = (query, type) => {
    let filtered = [...propertiess];

    if (query) {
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(query.toLowerCase()) ||
          item.location.toLowerCase().includes(query.toLowerCase()) ||
          item.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (type !== "all") {
      filtered = filtered.filter(
        (item) => item.type.toLowerCase() === type.toLowerCase()
      );
    }

    setFilteredProperties(filtered);
  };

  const handleIHaveProperty = async (property) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/properties/matchPropertyRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify({
            requestId: property.id,
            agentId: await AsyncStorage.getItem("userId"),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Property match request sent to admin");
        fetchPropertiess(); // Refresh the list
      } else {
        Alert.alert("Error", data.message || "Failed to submit match");
      }
    } catch (error) {
      console.error("Error matching property:", error);
      Alert.alert("Error", "An error occurred while processing your request");
    }
  };

  useEffect(() => {
    getAgentDetails();
  }, []);

  useEffect(() => {
    if (agentLocation) {
      fetchPropertiess();
    }
  }, [agentLocation]);

  const renderPropertyCards = () => {
    if (isWeb) {
      // Web layout - 3 cards per row
      const rows = [];
      for (let i = 0; i < filteredProperties.length; i += 3) {
        const rowProperties = filteredProperties.slice(i, i + 3);
        rows.push(
          <View key={i} style={styles.cardRow}>
            {rowProperties.map((item, index) => (
              <View key={index} style={styles.propertyCardWeb}>
                {renderPropertyCard(item)}
              </View>
            ))}
          </View>
        );
      }
      return rows;
    } else {
      // Mobile layout - 1 card per row
      return filteredProperties.map((item, index) => (
        <View key={index} style={styles.propertyCard}>
          {renderPropertyCard(item)}
        </View>
      ));
    }
  };

  const renderPropertyCard = (item) => (
    <View style={styles.requestcard}>
      <Image
        source={item.image}
        style={styles.images}
        defaultSource={logo11} // Fallback image
      />
      <View style={styles.idContainer}>
        <Text style={styles.idText}>ID: {getLastFourCharss(item.id)}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>Property Type: {item.type}</Text>
        <Text style={styles.text}>Location: {item.location}</Text>
        {item.isInMyLocation && (
          <Text style={styles.locationTag}>(Your Area)</Text>
        )}
        <Text style={styles.text}>Budget: {item.budget}</Text>
      </View>
      <TouchableOpacity
        style={styles.iHaveButton}
        onPress={() => {
          setSelectedProperty(item);
          setIsModalVisible(true);
        }}
      >
        <Text style={styles.buttonText}>I Have</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Requested Properties</Text>
        {agentLocation && (
          <Text style={styles.locationText}>
            Your Location: {agentLocation}
          </Text>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, Location or Title..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Icon name="alert-circle-outline" size={50} color="#E91E63" />
          <Text style={styles.noResultsText}>No properties found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.propertiesContainer}>
          {renderPropertyCards()}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {referredInfo ? (
              <>
                <Image source={logo11} style={styles.agentLogo} />
                <Text style={styles.modalTitle}>Referred By</Text>
                <Text style={styles.modalText}>Name: {referredInfo.name}</Text>
                <Text style={styles.modalText}>
                  Mobile: {referredInfo.Number}
                </Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => Linking.openURL(`tel:${referredInfo.Number}`)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.callButtonText}>Call Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Confirm Property Match</Text>
                <Text style={styles.modalText}>
                  Are you sure you have a matching property for:
                </Text>
                <Text style={styles.modalPropertyText}>
                  {selectedProperty?.title} ({selectedProperty?.type})
                </Text>
              </>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (selectedProperty) {
                    handleIHaveProperty(selectedProperty);
                  }
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#E91E63",
    padding: 15,
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  locationText: {
    color: "white",
    fontSize: 14,
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: isWeb ? "row" : "column",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: isWeb ? 15 : 0,
    marginBottom: isWeb ? 0 : 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    marginTop: 15,
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  propertiesContainer: {
    padding: isWeb ? 20 : 15,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  requestcard: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    margin: 8,
    width: isWeb ? 300 : 230,
  },
  images: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  idContainer: {
    backgroundColor: "green",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-end",
    margin: 5,
  },
  idText: {
    color: "#fff",
    fontWeight: "600",
  },
  details: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    color: "#666",
  },
  locationTag: {
    color: "#FF9800",
    fontSize: 12,
    fontWeight: "bold",
  },
  iHaveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
    margin: 10,
    width: 80,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: isWeb ? "40%" : "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  agentLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#E91E63",
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalPropertyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2196F3",
    textAlign: "center",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  callButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 8,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    padding: 15,
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ViewAllRequestedProperties;
