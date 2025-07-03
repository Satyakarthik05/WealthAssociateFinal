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
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import logo11 from "../../assets/logo.png";

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
  const [userType, setUserType] = useState("");
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );

  useEffect(() => {
    const updateDimensions = ({ window }) => {
      setWindowDimensions(window);
    };

    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );
    return () => {
      subscription?.remove();
    };
  }, []);

  const getImageByPropertyType = (propertyType) => {
    switch (propertyType.toLowerCase()) {
      case "flat(apartment)":
      case "apartment":
        return require("../../assets/download.jpeg");
      case "land(opensite)":
      case "land":
        return require("../../assets/Land.jpg");
      case "house(individual)":
      case "house":
        return require("../../assets/house.png");
      case "villa":
        return require("../../assets/villa.jpg");
      case "agriculture land":
        return require("../../assets/agriculture.jpeg");
      case "commercial property":
        return require("../../assets/commercial.jpg");
      case "commercial land":
        return require("../../assets/commland.jpeg");
      default:
        return require("../../assets/house.png");
    }
  };

  const getAgentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const type = await AsyncStorage.getItem("userType");
      setUserType(type);

      let endpoint = "";
      switch (type) {
        case "WealthAssociate":
        case "ReferralAssociate":
          endpoint = `${API_URL}/agent/AgentDetails`;
          break;
        case "Customer":
          endpoint = `${API_URL}/customer/getcustomer`;
          break;
        case "CoreMember":
          endpoint = `${API_URL}/core/getcore`;
          break;
        case "Investor":
          endpoint = `${API_URL}/investors/getinvestor`;
          break;
        case "NRI":
          endpoint = `${API_URL}/nri/getnri`;
          break;
        case "SkilledResource":
          endpoint = `${API_URL}/skillLabour/getskilled`;
          break;
        default:
          endpoint = `${API_URL}/agent/AgentDetails`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (type === "WealthAssociate" || type === "ReferralAssociate") {
        setAgentLocation(data.Contituency || "");
        if (data.ReferredBy) {
          fetchReferredDetails(data.ReferredBy);
        }
      } else if (type === "Customer") {
        setAgentLocation(data.location || "");
      } else if (type === "CoreMember") {
        setAgentLocation(data.city || "");
      } else if (type === "Investor" || type === "NRI") {
        setAgentLocation(data.preferredLocation || "");
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        setReferredInfo({
          name: data.referredByDetails.name || "N/A",
          mobileNumber: data.referredByDetails.Number || "N/A",
          email: data.referredByDetails.email || "N/A",
        });
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const doneProperties = data.filter((item) => item.Approved === "Done");

      const formattedProperties = doneProperties.map((item) => ({
        id: item._id,
        title: item.propertyTitle,
        type: item.propertyType,
        location: item.location,
        budget: `₹${item.Budget?.toLocaleString() || "0"}`,
        image: getImageByPropertyType(item.propertyType),
        createdAt: item.createdAt,
        contactNumber: item.contactNumber,
        email: item.email,
        additionalDetails: item.additionalDetails,
        isInMyLocation:
          agentLocation &&
          item.location?.toLowerCase().includes(agentLocation.toLowerCase()),
      }));

      const sortedProperties = [...formattedProperties].sort((a, b) => {
        if (a.isInMyLocation && !b.isInMyLocation) return -1;
        if (!a.isInMyLocation && b.isInMyLocation) return 1;
        return 0;
      });

      setPropertiess(sortedProperties);
      setFilteredProperties(sortedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      Alert.alert("Error", "Failed to fetch properties");
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
        fetchPropertiess();
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
    if (isWeb && windowDimensions.width >= 450) {
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
      return filteredProperties.map((item, index) => (
        <View key={index} style={styles.propertyCard}>
          {renderPropertyCard(item)}
        </View>
      ));
    }
  };

  const renderPropertyCard = (item) => (
    <View style={styles.requestcard}>
      <Image source={item.image} style={styles.images} defaultSource={logo11} />
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
        {userType === "WealthAssociate" && item.contactNumber && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${item.contactNumber}`)}
          >
            <Ionicons name="call" size={16} color="white" />
            <Text style={styles.callButtonText}>Call Client</Text>
          </TouchableOpacity>
        )}
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
        {agentLocation && (
          <Text style={styles.locationText}>
            Your Location: {agentLocation}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.searchContainer,
          windowDimensions.width < 450 && styles.smallScreenSearchContainer,
        ]}
      >
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
        <View
          style={[
            styles.filterContainer,
            windowDimensions.width < 450 && styles.smallScreenFilterContainer,
          ]}
        >
          <Picker
            selectedValue={filterType}
            style={styles.filterPicker}
            onValueChange={handleFilterChange}
          >
            <Picker.Item label="All Types" value="all" />
            <Picker.Item label="Land" value="land" />
            <Picker.Item label="Residential" value="residential" />
            <Picker.Item label="Commercial" value="commercial" />
            <Picker.Item label="Villa" value="villa" />
            <Picker.Item label="Apartment" value="apartment" />
          </Picker>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3E5C76" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Icon name="alert-circle-outline" size={50} color="#E91E63" />
          <Text style={styles.noResultsText}>No properties found</Text>
          <Text style={styles.noResultsSubText}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.propertiesContainer}>
          {renderPropertyCards()}
        </ScrollView>
      )}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              windowDimensions.width < 450 && styles.smallScreenModalContainer,
            ]}
          >
            {referredInfo ? (
              <>
                <Image source={logo11} style={styles.agentLogo} />
                <Text style={styles.modalTitle}>Referred By</Text>
                <Text style={styles.modalText}>Name: {referredInfo.name}</Text>
                <Text style={styles.modalText}>
                  Mobile: {referredInfo.mobileNumber}
                </Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() =>
                    Linking.openURL(`tel:${referredInfo.mobileNumber}`)
                  }
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
                {selectedProperty?.contactNumber && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() =>
                      Linking.openURL(`tel:${selectedProperty.contactNumber}`)
                    }
                  >
                    <Ionicons name="call" size={20} color="white" />
                    <Text style={styles.callButtonText}>Contact Client</Text>
                  </TouchableOpacity>
                )}
                {selectedProperty?.email && (
                  <TouchableOpacity
                    style={styles.emailButton}
                    onPress={() =>
                      Linking.openURL(`mailto:${selectedProperty.email}`)
                    }
                  >
                    <Ionicons name="mail" size={20} color="white" />
                    <Text style={styles.callButtonText}>Email Client</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (selectedProperty) {
                    handleIHaveProperty(selectedProperty);
                  }
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
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
    backgroundColor: "#D8E3E7",
  },
  header: {
    backgroundColor: "#3E5C76",
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
  smallScreenSearchContainer: {
    flexDirection: "column",
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
  filterContainer: {
    width: isWeb ? 200 : "100%",
  },
  smallScreenFilterContainer: {
    width: "100%",
  },
  filterPicker: {
    height: 60,
    width: "100%",
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
  noResultsSubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },
  propertiesContainer: {
    padding: isWeb ? 20 : 15,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  propertyCardWeb: {
    width: "32%",
  },
  requestcard: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    margin: 8,
    width: isWeb ? "100%" : "100%",
  },
  propertyCard: {
    marginBottom: 15,
  },
  images: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  idContainer: {
    backgroundColor: "#2B2D42",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-end",
    margin: 5,
    position: "absolute",
    right: 5,
    top: 5,
  },
  idText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
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
    marginBottom: 3,
  },
  locationTag: {
    color: "#FF9800",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5722",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
  },
  callButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
    fontWeight: "bold",
  },
  iHaveButton: {
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
    margin: 10,
    width: "90%",
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
  smallScreenModalContainer: {
    width: "90%",
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
