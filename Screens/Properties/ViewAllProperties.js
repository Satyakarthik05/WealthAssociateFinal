import React, { useEffect, useState } from "react";
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
  Linking,
  TextInput,
} from "react-native";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PropertyCards from "./PropertyCards";
// import { Ionicons } from "@expo/vector-icons";
import logo from "../../assets/man.png";
import logo1 from "../../assets/logo.png";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ViewAllProperties = ({ navigation }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [Details, setDetails] = useState({ Contituency: "" });
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPropertyModalVisible, setPropertyModalVisible] = useState(false);
  const [postedProperty, setPostedProperty] = useState(null);
  const [referredInfo, setReferredInfo] = useState(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    propertyType: "",
    location: "",
    price: "",
  });
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] =
    useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/properties/getApproveProperty`);
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        setProperties(data);
      } else {
        console.warn("API returned empty data.");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTag = (createdAt) => {
    const currentDate = new Date();
    const propertyDate = new Date(createdAt);
    const timeDifference = currentDate - propertyDate;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (daysDifference <= 3) {
      return "Regular Property";
    } else if (daysDifference >= 4 && daysDifference <= 17) {
      return "Approved Property";
    } else if (daysDifference >= 18 && daysDifference <= 25) {
      return "Wealth Property";
    } else {
      return "Listed Property";
    }
  };

  const sortPropertiesByConstituency = (properties) => {
    if (!Details.Contituency) return properties;

    return [...properties].sort((a, b) => {
      const aInConstituency = a.location?.includes(Details.Contituency);
      const bInConstituency = b.location?.includes(Details.Contituency);

      if (aInConstituency && !bInConstituency) return -1;
      if (!aInConstituency && bInConstituency) return 1;
      return 0;
    });
  };

  const handleEnquiryNow = (property) => {
    setPropertyModalVisible(true);
  };

  const handleShare = (property, closeModal) => {
    const fullImageUri = property.photo ? `${API_URL}${property.photo}` : null;
    setPostedProperty({
      propertyType: property.propertyType,
      photo: fullImageUri,
      location: property.location,
      price: property.price,
    });
    if (closeModal) closeModal();
  };
  const getLastFourChars = (id) => {
    return id ? id.slice(-4) : "N/A";
  };

  const filterProperties = (properties) => {
    if (!searchQuery) return properties;

    return properties.filter((property) => {
      const propertyId = property._id
        ? property._id.slice(-4).toLowerCase()
        : "";
      return propertyId.includes(searchQuery.toLowerCase());
    });
  };

  useEffect(() => {
    const fetchReferredDetails = async () => {
      if (!Details?.ReferredBy) return;

      try {
        const response = await fetch(
          `${API_URL}/properties/getPropertyreffered`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              token: (await AsyncStorage.getItem("authToken")) || "",
            },
            body: JSON.stringify({
              referredBy: Details.ReferredBy,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          setReferredInfo(data.referredByDetails);
        } else {
          console.error("API returned unsuccessful status:", data);
        }
      } catch (error) {
        console.error("Error fetching referredBy info:", error);
      }
    };

    fetchReferredDetails();
  }, [Details?.ReferredBy]);

  useEffect(() => {
    getDetails();
    fetchProperties();
  }, []);

  // Extract unique property types, locations, and prices for filtering
  const uniquePropertyTypes = [
    ...new Set(properties.map((item) => item.propertyType)),
  ];
  const uniqueLocations = [...new Set(properties.map((item) => item.location))];
  const uniquePrices = [
    ...new Set(properties.map((item) => Math.floor(item.price / 100000))),
  ].sort((a, b) => a - b);

  // Apply filters based on selected criteria
  const applyFilters = () => {
    let filteredProperties = [...properties]; // Create a copy of the original properties

    if (filterCriteria.propertyType) {
      filteredProperties = filteredProperties.filter(
        (item) => item.propertyType === filterCriteria.propertyType
      );
    }

    if (filterCriteria.location) {
      filteredProperties = filteredProperties.filter(
        (item) => item.location === filterCriteria.location
      );
    }

    if (filterCriteria.price) {
      filteredProperties = filteredProperties.filter(
        (item) => Math.floor(item.price / 100000) === filterCriteria.price
      );
    }

    setProperties(filteredProperties);
    setFilterModalVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({ propertyType: "", location: "", price: "" });
    fetchProperties();
    setFilterModalVisible(false);
  };

  // Categorize properties with search filtering
  const regularProperties = sortPropertiesByConstituency(
    filterProperties(
      properties.filter(
        (property) => getPropertyTag(property.createdAt) === "Regular Property"
      )
    )
  );
  const approvedProperties = sortPropertiesByConstituency(
    filterProperties(
      properties.filter(
        (property) => getPropertyTag(property.createdAt) === "Approved Property"
      )
    )
  );
  const wealthProperties = sortPropertiesByConstituency(
    filterProperties(
      properties.filter(
        (property) => getPropertyTag(property.createdAt) === "Wealth Property"
      )
    )
  );
  const listedProperties = sortPropertiesByConstituency(
    filterProperties(
      properties.filter(
        (property) => getPropertyTag(property.createdAt) === "Listed Property"
      )
    )
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#E91E63" style={styles.loader} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.heading}>All Properties</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Property ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Filter Modal */}
          <Modal
            visible={isFilterModalVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalHeading}>Filter Properties</Text>

                {/* Property Type Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Property Type</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TouchableOpacity
                        style={styles.filterButtonDropdown}
                        onPress={() =>
                          setShowPropertyTypeDropdown(!showPropertyTypeDropdown)
                        }
                      >
                        <Text style={styles.filterButtonText}>
                          {filterCriteria.propertyType ||
                            "-- Select Property Type --"}
                        </Text>
                        <MaterialIcons
                          name={
                            showPropertyTypeDropdown
                              ? "arrow-drop-up"
                              : "arrow-drop-down"
                          }
                          size={24}
                          color="#E82E5F"
                          style={styles.icon}
                        />
                      </TouchableOpacity>
                      {showPropertyTypeDropdown && (
                        <View style={styles.dropdownContainer}>
                          <ScrollView style={styles.scrollView}>
                            <TouchableOpacity
                              style={styles.listItem}
                              onPress={() => {
                                setFilterCriteria({
                                  ...filterCriteria,
                                  propertyType: "",
                                });
                                setShowPropertyTypeDropdown(false);
                              }}
                            >
                              <Text>-- Select Property Type --</Text>
                            </TouchableOpacity>
                            {uniquePropertyTypes.map((type, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.listItem}
                                onPress={() => {
                                  setFilterCriteria({
                                    ...filterCriteria,
                                    propertyType: type,
                                  });
                                  setShowPropertyTypeDropdown(false);
                                }}
                              >
                                <Text>{type}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Location Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Location</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TouchableOpacity
                        style={styles.filterButtonDropdown}
                        onPress={() =>
                          setShowLocationDropdown(!showLocationDropdown)
                        }
                      >
                        <Text style={styles.filterButtonText}>
                          {filterCriteria.location || "-- Select Location --"}
                        </Text>
                        <MaterialIcons
                          name={
                            showLocationDropdown
                              ? "arrow-drop-up"
                              : "arrow-drop-down"
                          }
                          size={24}
                          color="#E82E5F"
                          style={styles.icon}
                        />
                      </TouchableOpacity>
                      {showLocationDropdown && (
                        <View style={styles.dropdownContainer}>
                          <ScrollView style={styles.scrollView}>
                            <TouchableOpacity
                              style={styles.listItem}
                              onPress={() => {
                                setFilterCriteria({
                                  ...filterCriteria,
                                  location: "",
                                });
                                setShowLocationDropdown(false);
                              }}
                            >
                              <Text>-- Select Location --</Text>
                            </TouchableOpacity>
                            {uniqueLocations.map((location, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.listItem}
                                onPress={() => {
                                  setFilterCriteria({
                                    ...filterCriteria,
                                    location: location,
                                  });
                                  setShowLocationDropdown(false);
                                }}
                              >
                                <Text>{location}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Price Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Price (in lakhs)</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TouchableOpacity
                        style={styles.filterButtonDropdown}
                        onPress={() => setShowPriceDropdown(!showPriceDropdown)}
                      >
                        <Text style={styles.filterButtonText}>
                          {filterCriteria.price
                            ? `${filterCriteria.price} Lakh`
                            : "-- Select Price --"}
                        </Text>
                        <MaterialIcons
                          name={
                            showPriceDropdown
                              ? "arrow-drop-up"
                              : "arrow-drop-down"
                          }
                          size={24}
                          color="#E82E5F"
                          style={styles.icon}
                        />
                      </TouchableOpacity>
                      {showPriceDropdown && (
                        <View style={styles.dropdownContainer}>
                          <ScrollView style={styles.scrollView}>
                            <TouchableOpacity
                              style={styles.listItem}
                              onPress={() => {
                                setFilterCriteria({
                                  ...filterCriteria,
                                  price: "",
                                });
                                setShowPriceDropdown(false);
                              }}
                            >
                              <Text>-- Select Price --</Text>
                            </TouchableOpacity>
                            {uniquePrices.map((price, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.listItem}
                                onPress={() => {
                                  setFilterCriteria({
                                    ...filterCriteria,
                                    price: price,
                                  });
                                  setShowPriceDropdown(false);
                                }}
                              >
                                <Text>{price} Lakh</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Apply and Reset Buttons */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.applyButton]}
                    onPress={applyFilters}
                  >
                    <Text style={styles.modalButtonText}>Apply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.resetButton]}
                    onPress={resetFilters}
                  >
                    <Text style={styles.modalButtonText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Regular Properties */}
          {regularProperties.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Regular Properties</Text>
              <View style={styles.propertiesContainer}>
                {regularProperties.map((property, index) => {
                  const imageUri = property.photo
                    ? { uri: `${API_URL}${property.photo}` }
                    : logo1;
                  const propertyTag = getPropertyTag(property.createdAt);
                  const propertyId = getLastFourChars(property._id);

                  return (
                    <View key={index} style={styles.propertyCard}>
                      <Image source={imageUri} style={styles.propertyImage} />
                      <View style={styles.approvedBadge}>
                        <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                      </View>
                      <View
                        style={{
                          alignItems: "flex-end",
                          paddingRight: 5,
                          top: 5,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "green",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                            }}
                          >
                            ID: {propertyId}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.propertyTitle}>
                        {property.propertyType}
                      </Text>
                      <Text style={styles.propertyTitle}>
                        {property.propertyDetails
                          ? property.propertyDetails
                          : "20 sqfeets"}
                      </Text>
                      <Text style={styles.propertyInfo}>
                        Location: {property.location}
                      </Text>
                      <Text style={styles.propertyBudget}>
                        ₹ {parseInt(property.price).toLocaleString()}
                      </Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.enquiryButton}
                          onPress={() => handleEnquiryNow(property)}
                        >
                          <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => handleShare(property)}
                        >
                          <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Approved Properties */}
          {approvedProperties.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Approved Properties</Text>
              <View style={styles.propertiesContainer}>
                {approvedProperties.map((property, index) => {
                  const imageUri = property.photo
                    ? { uri: `${API_URL}${property.photo}` }
                    : logo1;
                  const propertyTag = getPropertyTag(property.createdAt);
                  const propertyId = getLastFourChars(property._id);

                  return (
                    <View key={index} style={styles.propertyCard}>
                      <Image source={imageUri} style={styles.propertyImage} />
                      <View style={styles.approvedBadge}>
                        <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                      </View>
                      <View
                        style={{
                          alignItems: "flex-end",
                          paddingRight: 5,
                          top: 5,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "green",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                            }}
                          >
                            ID: {propertyId}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.propertyTitle}>
                        {property.propertyType}
                      </Text>
                      <Text style={styles.propertyTitle}>
                        {property.propertyDetails
                          ? property.propertyDetails
                          : "20 sqfeets"}
                      </Text>
                      <Text style={styles.propertyInfo}>
                        Location: {property.location}
                      </Text>
                      <Text style={styles.propertyBudget}>
                        ₹ {parseInt(property.price).toLocaleString()}
                      </Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.enquiryButton}
                          onPress={() => handleEnquiryNow(property)}
                        >
                          <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => handleShare(property)}
                        >
                          <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Wealth Properties */}
          {wealthProperties.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Wealth Properties</Text>
              <View style={styles.propertiesContainer}>
                {wealthProperties.map((property, index) => {
                  const imageUri = property.photo
                    ? { uri: `${API_URL}${property.photo}` }
                    : logo1;
                  const propertyTag = getPropertyTag(property.createdAt);
                  const propertyId = getLastFourChars(property._id);

                  return (
                    <View key={index} style={styles.propertyCard}>
                      <Image source={imageUri} style={styles.propertyImage} />
                      <View style={styles.approvedBadge}>
                        <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                      </View>
                      <View
                        style={{
                          alignItems: "flex-end",
                          paddingRight: 5,
                          top: 5,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "green",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                            }}
                          >
                            ID: {propertyId}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.propertyTitle}>
                        {property.propertyType}
                      </Text>
                      <Text style={styles.propertyTitle}>
                        {property.propertyDetails
                          ? property.propertyDetails
                          : "20 sqfeets"}
                      </Text>
                      <Text style={styles.propertyInfo}>
                        Location: {property.location}
                      </Text>
                      <Text style={styles.propertyBudget}>
                        ₹ {parseInt(property.price).toLocaleString()}
                      </Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.enquiryButton}
                          onPress={() => handleEnquiryNow(property)}
                        >
                          <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => handleShare(property)}
                        >
                          <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Listed Properties */}
          {listedProperties.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Listed Properties</Text>
              <View style={styles.propertiesContainer}>
                {listedProperties.map((property, index) => {
                  const imageUri = property.photo
                    ? { uri: `${API_URL}${property.photo}` }
                    : logo1;
                  const propertyTag = getPropertyTag(property.createdAt);
                  const propertyId = getLastFourChars(property._id);

                  return (
                    <View key={index} style={styles.propertyCard}>
                      <Image source={imageUri} style={styles.propertyImage} />
                      <View style={styles.approvedBadge}>
                        <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                      </View>
                      <View
                        style={{
                          alignItems: "flex-end",
                          paddingRight: 5,
                          top: 5,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "green",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                            }}
                          >
                            ID: {propertyId}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.propertyTitle}>
                        {property.propertyType}
                      </Text>
                      <Text style={styles.propertyTitle}>
                        {property.propertyDetails
                          ? property.propertyDetails
                          : "20 sqfeets"}
                      </Text>
                      <Text style={styles.propertyInfo}>
                        Location: {property.location}
                      </Text>
                      <Text style={styles.propertyBudget}>
                        ₹ {parseInt(property.price).toLocaleString()}
                      </Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.enquiryButton}
                          onPress={() => handleEnquiryNow(property)}
                        >
                          <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => handleShare(property)}
                        >
                          <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Property Modal */}
          <Modal
            visible={isPropertyModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPropertyModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {!referredInfo ? (
                  <ActivityIndicator size="large" color="#007bff" />
                ) : (
                  <>
                    <Image
                      source={require("../../assets/man.png")}
                      style={styles.agentLogo}
                    />
                    <Text style={styles.modalTitle}>Referred By</Text>
                    <Text style={styles.modalText}>
                      Name: {referredInfo.name}
                    </Text>
                    <Text style={styles.modalText}>
                      Mobile: {referredInfo.Number}
                    </Text>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() =>
                        Linking.openURL(`tel:${referredInfo.Number}`)
                      }
                    >
                      <Ionicons name="call" size={20} color="white" />
                      <Text style={styles.callButtonText}>Call Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setPropertyModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* Share Property Modal */}
          <Modal
            visible={!!postedProperty}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPostedProperty(null)}
          >
            <View style={styles.modalContainer}>
              {postedProperty && ( // Only render PropertyCard if postedProperty exists
                <PropertyCards
                  property={postedProperty}
                  closeModal={() => setPostedProperty(null)}
                />
              )}
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  filterButton: {
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 5,
  },
  filterButtonText: {
    // color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
  },
  propertiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  propertyCard: {
    width: Platform.OS === "web" ? "48%" : "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  propertyImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  approvedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "green",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    margin: 5,
    color: "#333",
  },
  propertyInfo: {
    fontSize: 14,
    marginLeft: 5,
    color: "#555",
  },
  propertyBudget: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    color: "green",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  enquiryButton: {
    backgroundColor: "#E91E63",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  shareButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#3E5C76",
  },
  resetButton: {
    backgroundColor: "#2196F3",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    textAlign: "center",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 4,
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
  closeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#dc3545",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterGroup: {
    marginBottom: 15,
  },
  inputContainer: {
    width: "100%",
    position: "relative",
  },
  inputWrapper: {
    position: "relative",
  },
  filterButtonDropdown: {
    width: "100%",
    height: 47,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    right: 0,
    top: 0,
  },
  dropdownContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#FFF",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
    maxHeight: 200,
  },
  scrollView: {
    maxHeight: 200,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default ViewAllProperties;
