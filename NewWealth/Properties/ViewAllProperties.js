import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Animated,
  TextInput,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import RNPickerSelect from "react-native-picker-select";

import { API_URL } from "../../data/ApiUrl";
import { getCategorizedProperties } from "../MainScreen/PropertyStock";
import PropertyCard from "../components/home/PropertyCard";
import PropertyModal from "../components/home/PropertyModal";
import SectionHeader from "../components/home/SectionHeader";
import LazyImage from "../components/home/LazyImage";

const { width, height } = Dimensions.get("window");
const PROPERTIES_PER_PAGE = 20;
const IS_WEB = Platform.OS === "web";
const IS_SMALL_SCREEN = width < 450;

const ViewAllProperties = ({ route }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({});
  const [userType, setUserType] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPropertyModalVisible, setPropertyModalVisible] = useState(false);
  const [referredInfo, setReferredInfo] = useState({
    name: "",
    mobileNumber: "",
  });
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    propertyType: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [likedProperties, setLikedProperties] = useState([]);
  const [propertyCategories, setPropertyCategories] = useState({
    regularProperties: [],
    approvedProperties: [],
    wealthProperties: [],
    listedProperties: [],
    rentalProperties: [], // Added rental properties
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [tabContentWidth, setTabContentWidth] = useState(0);

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scrollViewRef = useRef(null);
  const tabScrollViewRef = useRef(null);

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
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  }, [currentPage]);

  const getDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const type = await AsyncStorage.getItem("userType");
      setUserType(type);

      const storedLikes = await AsyncStorage.getItem("likedProperties");
      if (storedLikes) {
        setLikedProperties(JSON.parse(storedLikes));
      }

      let endpoint = "";
      switch (type) {
        case "WealthAssociate":
          endpoint = `${API_URL}/agent/AgentDetails`;
          break;
        case "Customer":
          endpoint = `${API_URL}/customer/getcustomer`;
          break;
        case "CoreMember":
          endpoint = `${API_URL}/core/getcore`;
          break;
        case "ReferralAssociate":
          endpoint = `${API_URL}/agent/AgentDetails`;
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

      const newDetails = await response.json();
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const categories = await getCategorizedProperties();
      setPropertyCategories(categories);

      const allProperties = [
        ...categories.regularProperties,
        ...categories.approvedProperties,
        ...categories.wealthProperties,
        ...categories.listedProperties,
        ...categories.rentalProperties, // Added rental properties
      ];
      setTotalPages(Math.ceil(allProperties.length / PROPERTIES_PER_PAGE));
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReferredInfoFromStorage = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem("referredAddedByInfo");
      if (data) {
        setReferredInfo(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load referred info:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await getDetails();
      await fetchProperties();
    };
    loadData();
  }, [getDetails, fetchProperties]);

  useEffect(() => {
    if (isPropertyModalVisible) {
      loadReferredInfoFromStorage();
    }
  }, [isPropertyModalVisible, loadReferredInfoFromStorage]);

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
    [navigation]
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
          PostedBy: property.PostedBy || details?.Number || "",
          fullName: property.fullName || details?.name || "Wealth Associate",
        },
      });
    },
    [navigation, details]
  );

  const handleEnquiryNow = useCallback((property) => {
    setSelectedProperty(property);
    setPropertyModalVisible(true);
  }, []);

  const normalizeImageSources = useCallback((property) => {
    if (!property) return [];

    if (Array.isArray(property.newImageUrls)) {
      return property.newImageUrls.filter(
        (url) => url && typeof url === "string"
      );
    } else if (
      typeof property.newImageUrls === "string" &&
      property.newImageUrls
    ) {
      return [property.newImageUrls];
    }

    if (Array.isArray(property.imageUrls)) {
      return property.imageUrls.filter((url) => url && typeof url === "string");
    } else if (typeof property.imageUrls === "string" && property.imageUrls) {
      return [property.imageUrls];
    }

    return [];
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
            userName: userDetails?.FullName || details?.FullName || "User",
            mobileNumber:
              userDetails?.MobileNumber || details?.MobileNumber || "",
          }),
        });
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    },
    [likedProperties, details]
  );

  const filterProperties = useCallback(() => {
    let filtered = [];

    switch (activeTab) {
      case "regular":
        filtered = propertyCategories.regularProperties;
        break;
      case "approved":
        filtered = propertyCategories.approvedProperties;
        break;
      case "wealth":
        filtered = propertyCategories.wealthProperties;
        break;
      case "listed":
        filtered = propertyCategories.listedProperties;
        break;
      case "rental":
        filtered = propertyCategories.rentalProperties; // Added rental case
        break;
      default:
        filtered = [
          ...propertyCategories.regularProperties,
          ...propertyCategories.approvedProperties,
          ...propertyCategories.wealthProperties,
          ...propertyCategories.listedProperties,
          ...propertyCategories.rentalProperties, // Added rental properties
        ];
    }

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
  }, [
    activeTab,
    propertyCategories,
    searchQuery,
    filterCriteria,
    totalPages,
    currentPage,
  ]);

  const paginatedProperties = useMemo(() => {
    const filtered = filterProperties();
    const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
    const endIndex = startIndex + PROPERTIES_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filterProperties, currentPage]);

  const getUniqueValues = useCallback(
    (key) => {
      const allProperties = [
        ...propertyCategories.regularProperties,
        ...propertyCategories.approvedProperties,
        ...propertyCategories.wealthProperties,
        ...propertyCategories.listedProperties,
        ...propertyCategories.rentalProperties, // Added rental properties
      ];
      return [...new Set(allProperties.map((item) => item[key]))].filter(
        Boolean
      );
    },
    [propertyCategories]
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
            userName: userDetails?.FullName || details?.FullName || "User",
            mobileNumber:
              userDetails?.MobileNumber || details?.MobileNumber || "",
          }),
        });
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    }, [isLiked, likedProperties, property._id, details]);

    return (
      <PropertyCard
        property={property}
        onPress={() => handlePropertyPress(property)}
        onEnquiryPress={() => handleEnquiryNow(property)}
        onSharePress={() => handleShare(property)}
        isLiked={isLiked}
        onLikePress={handleToggleLike}
      />
    );
  });

  const renderHeader = useCallback(
    () => (
      <>
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

        <View style={styles.tabContainerWrapper}>
          <ScrollView
            ref={tabScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
            onScroll={handleTabScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onTabContentSizeChange}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "all" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("all")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "all" && styles.activeTabButtonText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "regular" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("regular")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "regular" && styles.activeTabButtonText,
                ]}
              >
                Regular
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "approved" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("approved")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "approved" && styles.activeTabButtonText,
                ]}
              >
                Approved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "wealth" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("wealth")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "wealth" && styles.activeTabButtonText,
                ]}
              >
                Wealth
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "listed" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("listed")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "listed" && styles.activeTabButtonText,
                ]}
              >
                Listed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "rental" && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab("rental")} // Added rental tab
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "rental" && styles.activeTabButtonText,
                ]}
              >
                Rental
              </Text>
            </TouchableOpacity>
          </ScrollView>
          {showRightArrow && (
            <TouchableOpacity
              style={styles.scrollArrow}
              onPress={scrollTabsRight}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color="#E91E63" />
            </TouchableOpacity>
          )}
        </View>

        <SectionHeader
          title={`${
            activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
          } Properties`}
          showViewAll={false}
        />
      </>
    ),
    [searchQuery, activeTab, showRightArrow]
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
      </View>
    ),
    [resetFilters]
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
                          color="#E91E63"
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
                          color="#E91E63"
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
          {renderPagination()}

          {paginatedProperties.length > 0 ? (
            <View
              style={[
                styles.propertyListContainer,
                IS_WEB && !IS_SMALL_SCREEN && styles.webGridContainer,
              ]}
            >
              {paginatedProperties.map((item) => (
                <View
                  key={item._id}
                  style={[
                    IS_WEB && !IS_SMALL_SCREEN
                      ? styles.webPropertyItem
                      : styles.mobilePropertyItem,
                  ]}
                >
                  <RenderPropertyCard property={item} />
                </View>
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
    paddingBottom: Platform.OS === "web" ? "45%" : "20%",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D8E3E7",
  },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 15,
    width: "100%",
  },
  searchContainer: {
    flex: 1,
    marginRight: 10,
    position: "relative",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 40,
    backgroundColor: "#fff",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: 15,
    top: 10,
  },
  filterButton: {
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  tabContainer: {
    flexGrow: 1,
    paddingRight: 30,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: "#3E5C76",
  },
  tabButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  activeTabButtonText: {
    color: "#fff",
  },
  scrollArrow: {
    position: "absolute",
    right: 5,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
  },
  propertyListContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  webGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  webPropertyItem: {
    width: "32%", // Allows for 3 items per row with some spacing
    marginRight: "1%",
    marginBottom: 15,
    // Calculate left margin for every 3rd item to prevent extra space
    marginLeft: (index) => (index % 3 === 0 ? 0 : "1%"),
  },
  mobilePropertyItem: {
    width: "100%",
    marginBottom: 15,
  },
  propertyListContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  webPropertyItem: {
    width: "32%",
    marginRight: "1%",
    marginBottom: 15,
  },
  mobilePropertyItem: {
    width: "100%",
    marginBottom: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 5,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: height * 0.85,
  },
  smallScreenModal: {
    width: "100%",
  },
  largeScreenModal: {
    width: Platform.OS === "web" ? "50%" : "100%",
    alignSelf: "center",
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
    textAlign: "center",
    color: "#333",
  },
  filterScrollContainer: {
    maxHeight: height * 0.6,
    paddingHorizontal: 5,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  priceRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  priceInput: {
    height: 48,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  priceRangeSeparator: {
    marginHorizontal: 8,
    color: "#666",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  resetFilterButton: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    marginRight: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  applyFilterButton: {
    backgroundColor: "#3E5C76",
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  resetFilterButtonText: {
    color: "#666",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  pageNumbersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  pageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: "#3E5C76",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  pageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#3E5C76",
    minWidth: 35,
    alignItems: "center",
  },
  activePage: {
    backgroundColor: "#3E5C76",
  },
  pageNumberText: {
    color: "#3E5C76",
  },
  activePageText: {
    color: "#fff",
  },
  propertyScrollView: {
    width: "100%",
  },
  propertyGridContainer: {
    paddingBottom: 20,
  },
});

export default ViewAllProperties;
