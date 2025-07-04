import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Animated,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import RNPickerSelect from "react-native-picker-select";
import PropertyCard from "../components/home/PropertyCard";
import PropertyModal from "../components/home/PropertyModal";

const { width, height } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";
const IS_SMALL_SCREEN = width < 450;

const ViewPostedProperties = () => {
  const navigation = useNavigation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPropertyModalVisible, setPropertyModalVisible] = useState(false);
  const [referredInfo, setReferredInfo] = useState(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    propertyType: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [likedProperties, setLikedProperties] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [tabContentWidth, setTabContentWidth] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedData, setEditedData] = useState({
    propertyType: "",
    location: "",
    price: "",
  });
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scrollViewRef = useRef(null);
  const tabScrollViewRef = useRef(null);

  const PROPERTIES_PER_PAGE = 20;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  useEffect(() => {
    fetchProperties();
    loadReferredInfoFromStorage();
    loadLikedProperties();
  }, []);

  const loadLikedProperties = async () => {
    try {
      const storedLikes = await AsyncStorage.getItem("likedProperties");
      if (storedLikes) {
        setLikedProperties(JSON.parse(storedLikes));
      }
    } catch (error) {
      console.error("Error loading liked properties:", error);
    }
  };

  const loadReferredInfoFromStorage = async () => {
    try {
      const storedInfo = await AsyncStorage.getItem("referredAddedByInfo");
      if (storedInfo) {
        setReferredInfo(JSON.parse(storedInfo));
      }
    } catch (error) {
      console.error("Error loading referred info from storage:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.warn("No token found in AsyncStorage.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/properties/getMyPropertys`, {
        method: "GET",
        headers: {
          token: `${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedProperties = data.map((property) => ({
          ...property,
          images: normalizeImageSources(property),
        }));
        setProperties(formattedProperties);
        setTotalPages(
          Math.ceil(formattedProperties.length / PROPERTIES_PER_PAGE)
        );
      } else {
        setProperties([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      Alert.alert("Error", "Failed to fetch properties. Please try again.");
      setProperties([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const normalizeImageSources = useCallback((property) => {
    if (!property) return [];

    // First check for any array of images
    const possibleArrayFields = [
      "photos",
      "imageUrls",
      "newImageUrls",
      "images",
    ];
    for (const field of possibleArrayFields) {
      if (Array.isArray(property[field])) {
        return property[field]
          .filter((url) => url && typeof url === "string")
          .map((url) => {
            // Handle case where URL might be relative
            if (url.startsWith("/")) {
              return `${API_URL}${url}`;
            }
            return url;
          });
      }
    }

    // Then check for single string fields
    const possibleStringFields = ["photo", "imageUrl", "newImageUrl", "image"];
    for (const field of possibleStringFields) {
      if (typeof property[field] === "string" && property[field]) {
        const url = property[field];
        return [url.startsWith("/") ? `${API_URL}${url}` : url];
      }
    }

    // If no images found, return empty array
    return [];
  }, []);

  const filterProperties = useCallback(() => {
    let filtered = [...properties];

    if (searchQuery) {
      filtered = filtered.filter((property) => {
        const propertyId = property._id
          ? property._id.slice(-4).toLowerCase()
          : "";
        return (
          propertyId.includes(searchQuery.toLowerCase()) ||
          (property.location &&
            property.location
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (property.propertyType &&
            property.propertyType
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
        );
      });
    }

    if (filterCriteria.propertyType) {
      filtered = filtered.filter(
        (property) => property.propertyType === filterCriteria.propertyType
      );
    }

    if (filterCriteria.location) {
      filtered = filtered.filter(
        (property) => property.location === filterCriteria.location
      );
    }

    if (filterCriteria.minPrice) {
      const minPriceValue = parseFloat(filterCriteria.minPrice) * 100000;
      filtered = filtered.filter((property) => property.price >= minPriceValue);
    }

    if (filterCriteria.maxPrice) {
      const maxPriceValue = parseFloat(filterCriteria.maxPrice) * 100000;
      filtered = filtered.filter((property) => property.price <= maxPriceValue);
    }

    const newTotalPages = Math.ceil(filtered.length / PROPERTIES_PER_PAGE);
    if (newTotalPages !== totalPages) {
      setTotalPages(newTotalPages);
    }

    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0) {
      setCurrentPage(1);
    }

    return filtered;
  }, [properties, searchQuery, filterCriteria, totalPages, currentPage]);

  const paginatedProperties = useMemo(() => {
    const filtered = filterProperties();
    const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
    const endIndex = startIndex + PROPERTIES_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filterProperties, currentPage]);

  const getUniqueValues = useCallback(
    (key) => {
      return [...new Set(properties.map((item) => item[key]))].filter(Boolean);
    },
    [properties]
  );

  const resetFilters = useCallback(() => {
    setFilterCriteria({
      propertyType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
    });
    setSearchQuery("");
    setFilterModalVisible(false);
    setCurrentPage(1);
  }, []);

  const applyFilters = useCallback(() => {
    setFilterModalVisible(false);
    setCurrentPage(1);
  }, []);

  const handleTabScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const newShowRightArrow =
      contentOffset.x + layoutMeasurement.width < contentSize.width;
    if (newShowRightArrow !== showRightArrow) {
      setShowRightArrow(newShowRightArrow);
    }
  };

  const scrollTabsRight = () => {
    tabScrollViewRef.current?.scrollTo({ x: tabContentWidth, animated: true });
  };

  const onTabContentSizeChange = (contentWidth) => {
    setTabContentWidth(contentWidth);
    setShowRightArrow(contentWidth > width);
  };

  const handlePropertyPress = useCallback(
    (property) => {
      if (!property?._id) {
        console.error("Property ID is missing");
        return;
      }

      const images = normalizeImageSources(property).map((uri) => ({
        uri: uri,
      }));

      let formattedPrice = "Price not available";
      try {
        const priceValue = parseInt(property.price);
        if (!isNaN(priceValue)) {
          formattedPrice = `₹${priceValue.toLocaleString()}`;
        }
      } catch (e) {
        console.error("Error formatting price:", e);
      }

      navigation.navigate("PropertyDetails", {
        property: {
          ...property,
          id: property._id,
          price: formattedPrice,
          images:
            images.length > 0 ? images : [require("../../assets/logo.png")],
        },
      });
    },
    [navigation, normalizeImageSources]
  );

  const handleShare = useCallback(
    (property) => {
      const images = normalizeImageSources(property);
      let shareImage = images.length > 0 ? images[0] : null;

      let formattedPrice = "Price not available";
      if (property.price) {
        try {
          const priceValue = parseInt(property.price);
          if (!isNaN(priceValue)) {
            formattedPrice = `₹${priceValue.toLocaleString()}`;
          }
        } catch (e) {
          console.error("Error formatting price:", e);
        }
      }

      navigation.navigate("PropertyCard", {
        property: {
          photo: shareImage,
          location: property.location || "Location not specified",
          price: formattedPrice,
          propertyType: property.propertyType || "Property",
          PostedBy: property.PostedBy || "",
          fullName: property.fullName || "Property Owner",
        },
      });
    },
    [navigation, normalizeImageSources]
  );

  const handleEnquiryNow = useCallback((property) => {
    setSelectedProperty(property);
    setPropertyModalVisible(true);
  }, []);

  const toggleLike = useCallback(
    async (propertyId) => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userDetails = JSON.parse(
          await AsyncStorage.getItem("userDetails")
        );

        const newLikedStatus = !likedProperties.includes(propertyId);
        let updatedLikes;

        if (newLikedStatus) {
          updatedLikes = [...likedProperties, propertyId];
        } else {
          updatedLikes = likedProperties.filter((id) => id !== propertyId);
        }
        setLikedProperties(updatedLikes);

        await AsyncStorage.setItem(
          "likedProperties",
          JSON.stringify(updatedLikes)
        );

        await fetch(`${API_URL}/properties/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token || "",
          },
          body: JSON.stringify({
            propertyId: propertyId,
            like: newLikedStatus,
            userName: userDetails?.FullName || "User",
            mobileNumber: userDetails?.MobileNumber || "",
          }),
        });
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    },
    [likedProperties]
  );

  const handleEditPress = (property) => {
    setSelectedProperty(property);
    setEditedData({
      propertyType: property.propertyType,
      location: property.location,
      price: property.price.toString(),
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProperty) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/properties/editProperty/${selectedProperty._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: `${token}`,
          },
          body: JSON.stringify(editedData),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Property updated successfully");
        setEditModalVisible(false);
        fetchProperties();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update property");
      }
    } catch (error) {
      console.error("Error updating property:", error);
      Alert.alert("Error", error.message || "Failed to update property");
    }
  };

  const handleDeletePress = (property) => {
    setPropertyToDelete(property);
    setDeleteModalVisible(true);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/properties/deleteProperty/${propertyToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token: `${token}`,
          },
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Property deleted successfully");
        setDeleteModalVisible(false);
        fetchProperties();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      Alert.alert("Error", error.message || "Failed to delete property");
    }
  };

  const getLastFourChars = (id) => {
    if (!id) return "N/A";
    return id.length > 4 ? id.slice(-4) : id;
  };

  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageNumbersContainer}
        >
          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map((page) => (
            <TouchableOpacity
              key={page}
              style={[
                styles.pageNumber,
                currentPage === page && styles.activePage,
              ]}
              onPress={() => setCurrentPage(page)}
            >
              <Text
                style={
                  currentPage === page
                    ? styles.activePageText
                    : styles.pageNumberText
                }
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }, [currentPage, totalPages]);

  const RenderPropertyCard = React.memo(({ property }) => {
    const [isLiked, setIsLiked] = useState(
      likedProperties.includes(property._id)
    );

    const handleToggleLike = useCallback(async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userDetails = JSON.parse(
          await AsyncStorage.getItem("userDetails")
        );

        const newLikedStatus = !isLiked;
        setIsLiked(newLikedStatus);

        let updatedLikes;
        if (newLikedStatus) {
          updatedLikes = [...likedProperties, property._id];
        } else {
          updatedLikes = likedProperties.filter((id) => id !== property._id);
        }
        setLikedProperties(updatedLikes);

        await AsyncStorage.setItem(
          "likedProperties",
          JSON.stringify(updatedLikes)
        );

        await fetch(`${API_URL}/properties/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token || "",
          },
          body: JSON.stringify({
            propertyId: property._id,
            like: newLikedStatus,
            userName: userDetails?.FullName || "User",
            mobileNumber: userDetails?.MobileNumber || "",
          }),
        });
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    }, [isLiked, likedProperties, property._id]);

    return (
      <View
        style={
          IS_SMALL_SCREEN ? styles.mobileCardContainer : styles.webCardContainer
        }
      >
        <PropertyCard
          property={property}
          onPress={() => handlePropertyPress(property)}
          onEnquiryPress={() => handleEnquiryNow(property)}
          onSharePress={() => handleShare(property)}
          isLiked={isLiked}
          onLikePress={handleToggleLike}
          showActions={false}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditPress(property)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(property)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  const renderHeader = useCallback(
    () => (
      <>
        <View style={styles.header}>
          <Text style={styles.heading}>My Properties</Text>
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Property ID, Location or Type..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              <Ionicons
                name="search"
                size={20}
                color="#999"
                style={styles.searchIcon}
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="filter" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        {renderPagination()}
      </>
    ),
    [searchQuery, renderPagination]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No properties found</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetFilters}
          activeOpacity={0.7}
        >
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addPropertyButton}
          onPress={() => navigation.navigate("PostProperty")}
        >
          <Text style={styles.addPropertyButtonText}>Add New Property</Text>
        </TouchableOpacity>
      </View>
    ),
    [resetFilters, navigation]
  );

  const renderFilterModal = useCallback(
    () => (
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.filterModalContent,
                  IS_SMALL_SCREEN
                    ? styles.smallScreenModal
                    : styles.largeScreenModal,
                ]}
              >
                <View style={styles.modalHandle} />
                <Text style={styles.filterHeader}>Filter Properties</Text>

                <ScrollView
                  style={styles.filterScrollContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Property Type</Text>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        setFilterCriteria({
                          ...filterCriteria,
                          propertyType: value,
                        })
                      }
                      items={getUniqueValues("propertyType").map((type) => ({
                        label: type,
                        value: type,
                      }))}
                      value={filterCriteria.propertyType}
                      placeholder={{ label: "Select Property Type", value: "" }}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#3E5C76"
                        />
                      )}
                    />
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Location</Text>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        setFilterCriteria({
                          ...filterCriteria,
                          location: value,
                        })
                      }
                      items={getUniqueValues("location").map((loc) => ({
                        label: loc,
                        value: loc,
                      }))}
                      value={filterCriteria.location}
                      placeholder={{ label: "Select Location", value: "" }}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#3E5C76"
                        />
                      )}
                    />
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>
                      Price Range (in lakhs)
                    </Text>
                    <View style={styles.priceRangeContainer}>
                      <View style={styles.priceInputContainer}>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Min"
                          value={filterCriteria.minPrice}
                          onChangeText={(text) =>
                            setFilterCriteria({
                              ...filterCriteria,
                              minPrice: text,
                            })
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <Text style={styles.priceRangeSeparator}>to</Text>
                      <View style={styles.priceInputContainer}>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Max"
                          value={filterCriteria.maxPrice}
                          onChangeText={(text) =>
                            setFilterCriteria({
                              ...filterCriteria,
                              maxPrice: text,
                            })
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.filterButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.filterButton, styles.resetFilterButton]}
                    onPress={resetFilters}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetFilterButtonText}>Reset All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, styles.applyFilterButton]}
                    onPress={applyFilters}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.filterButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    ),
    [
      isFilterModalVisible,
      getUniqueValues,
      filterCriteria,
      resetFilters,
      applyFilters,
    ]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LottieView
          source={require("../../assets/animations/home[1].json")}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.propertyScrollView}
          contentContainerStyle={styles.propertyGridContainer}
        >
          {renderHeader()}

          {paginatedProperties.length > 0 ? (
            <View
              style={
                IS_SMALL_SCREEN
                  ? styles.mobilePropertyList
                  : styles.webPropertyGrid
              }
            >
              {paginatedProperties.map((item) => (
                <RenderPropertyCard key={item._id} property={item} />
              ))}
            </View>
          ) : (
            renderEmptyComponent()
          )}

          {renderPagination()}
        </ScrollView>

        {renderFilterModal()}

        <PropertyModal
          visible={isPropertyModalVisible}
          onClose={() => setPropertyModalVisible(false)}
          property={selectedProperty}
          referredInfo={referredInfo}
        />

        {/* Edit Property Modal */}
        <Modal visible={editModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Property</Text>

              <Text style={styles.label}>Property Type</Text>
              <TextInput
                style={styles.input}
                value={editedData.propertyType}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, propertyType: text })
                }
                placeholder="Property Type"
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={editedData.location}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, location: text })
                }
                placeholder="Location"
              />

              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={editedData.price}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setEditedData({ ...editedData, price: text })
                }
                placeholder="Price"
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal visible={deleteModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.confirmationModal}>
              <Text style={styles.confirmationTitle}>Confirm Delete</Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to delete this property?
              </Text>

              <View style={styles.confirmationButtonContainer}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmDeleteProperty}
                >
                  <Text style={styles.confirmButtonText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelDeleteButton}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
    backgroundColor: "#D8E3E7",
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
    backgroundColor: "#D8E3E7",
    marginBottom: 10,
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
  placeholder: {
    color: "#999",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    padding: IS_SMALL_SCREEN ? 10 : 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
  },
  propertyScrollView: {
    flex: 1,
  },
  propertyGridContainer: {
    flexGrow: 1,
  },
  // Web view styles
  webPropertyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: IS_SMALL_SCREEN ? 5 : 10,
  },
  webCardContainer: {
    width: IS_SMALL_SCREEN ? "100%" : "31%",
    margin: IS_SMALL_SCREEN ? 5 : "1%",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 15,
  },
  // Mobile view styles
  mobilePropertyList: {
    width: "100%",
  },
  mobileCardContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  editButton: {
    backgroundColor: "#3E5C76",
    padding: 8,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#3E5C76",
    padding: 8,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  header: {
    flexDirection: IS_SMALL_SCREEN ? "column" : "row",
    justifyContent: "space-between",
    alignItems: IS_SMALL_SCREEN ? "flex-start" : "center",
    marginBottom: 15,
    gap: IS_SMALL_SCREEN ? 10 : 0,
  },
  heading: {
    fontSize: IS_SMALL_SCREEN ? 20 : 22,
    fontWeight: "bold",
    color: "#3E5C76",
  },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: IS_SMALL_SCREEN ? "100%" : "auto",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  searchIcon: {
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addPropertyButton: {
    backgroundColor: "#E82E5F",
    padding: 15,
    borderRadius: 10,
  },
  addPropertyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  pageButton: {
    padding: 10,
    backgroundColor: "#3E5C76",
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  pageNumbersContainer: {
    flexDirection: "row",
  },
  pageNumber: {
    padding: 10,
    marginHorizontal: 5,
  },
  activePage: {
    backgroundColor: "#3E5C76",
    borderRadius: 5,
  },
  pageNumberText: {
    color: "#333",
  },
  activePageText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#3E5C76",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#999",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  confirmationModal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#E82E5F",
    textAlign: "center",
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  confirmationButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: "#E82E5F",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelDeleteButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  cancelDeleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  filterModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  smallScreenModal: {
    width: "100%",
    maxHeight: "80%",
    position: "absolute",
    bottom: 0,
  },
  largeScreenModal: {
    width: "80%",
    maxWidth: 500,
    borderRadius: 20,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 15,
  },
  filterHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#3E5C76",
    textAlign: "center",
  },
  filterScrollContainer: {
    flex: 1,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3E5C76",
    marginBottom: 10,
  },
  priceRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#D8E3E7",
  },
  priceRangeSeparator: {
    marginHorizontal: 10,
    color: "#3E5C76",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  resetFilterButton: {
    backgroundColor: "#3E5C76",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  applyFilterButton: {
    backgroundColor: "#3E5C76",
    padding: 15,
    borderRadius: 10,
    flex: 1,
  },
  resetFilterButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ViewPostedProperties;
