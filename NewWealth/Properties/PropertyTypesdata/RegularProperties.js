import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Animated,
  Image,
  Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Carousel from "react-native-reanimated-carousel";
import LazyImage from "../../components/home/LazyImage";
import {API_URL} from "../../../data/ApiUrl"

const { width } = Dimensions.get("window");


const RegularPropertiesScreen = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPropertyModalVisible, setPropertyModalVisible] = useState(false);
  const [referredInfo, setReferredInfo] = useState(null);
  const [likedProperties, setLikedProperties] = useState([]);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

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
  }, [loading]);

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
      const response = await fetch(`${API_URL}/properties/getApproveProperty`);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const regularProps = data.filter(
          (property) => getPropertyTag(property.createdAt) === "Regular Property"
        );
        setProperties(regularProps);
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

    if (daysDifference <= 3) return "Regular Property";
    if (daysDifference >= 4 && daysDifference <= 17) return "Approved Property";
    if (daysDifference >= 18 && daysDifference <= 25) return "Wealth Property";
    return "Listed Property";
  };

  const normalizeImageSources = (property) => {
    if (!property) return [];

    if (Array.isArray(property.newImageUrls)) {
      return property.newImageUrls.filter((url) => url && typeof url === "string");
    } else if (typeof property.newImageUrls === "string" && property.newImageUrls) {
      return [property.newImageUrls];
    }

    if (Array.isArray(property.imageUrls)) {
      return property.imageUrls.filter((url) => url && typeof url === "string");
    } else if (typeof property.imageUrls === "string" && property.imageUrls) {
      return [property.imageUrls];
    }

    return [];
  };

  const handlePropertyPress = async (property) => {
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
        images: images.length > 0 ? images : [require("../../../assets/logo.png")],
      },
    });
  };

  const handleShare = (property) => {
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
        fullName: property.fullName || "Wealth Associate",
        mobile: property.mobile || property.MobileNumber || "",
      },
    });
  };

  const handleEnquiryNow = (property) => {
    setSelectedProperty(property);
    setPropertyModalVisible(true);
  };

  const toggleLike = async (propertyId) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userDetails = JSON.parse(await AsyncStorage.getItem("userDetails"));

      const newLikedStatus = !likedProperties.includes(propertyId);
      let updatedLikes;

      if (newLikedStatus) {
        updatedLikes = [...likedProperties, propertyId];
      } else {
        updatedLikes = likedProperties.filter((id) => id !== propertyId);
      }

      setLikedProperties(updatedLikes);
      await AsyncStorage.setItem("likedProperties", JSON.stringify(updatedLikes));

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
  };

  const PropertyImageSlider = ({ property }) => {
    const carouselRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const images = normalizeImageSources(property);

    if (images.length === 0) {
      return (
        <Image
          source={require("../../../assets/logo.png")}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.imageSlider}>
        <Carousel
          ref={carouselRef}
          width={width - 32}
          height={200}
          loop={images.length > 1}
          data={images}
          scrollAnimationDuration={800}
          onSnapToItem={(index) => setCurrentIndex(index)}
          renderItem={({ item, index }) => (
            <LazyImage
              key={index}
              source={{ uri: item }}
              style={{
                width: '100%',
                height: 200,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
              resizeMode="cover"
              cacheKey={`property_${property._id}_${index}`}
            />
          )}
        />

        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
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
      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        contentContainerStyle={styles.scrollViewContent}
      >
        {properties.length === 0 ? (
          <Text style={styles.noPropertiesText}>
            No regular properties available
          </Text>
        ) : (
          properties.map((property, index) => (
            <View key={index} style={styles.cardContainer}>
              <TouchableOpacity
                onPress={() => handlePropertyPress(property)}
                activeOpacity={0.9}
                style={[styles.card, { width: Platform.OS === "web" ? 350 : width - 32 }]}
              >
                <PropertyImageSlider property={property} />

                <View style={styles.content}>
                  <View style={styles.propertyIdWrapper}>
                    <Text style={styles.propertyIdText}>
                      Property ID: {property?._id?.slice(-4)}
                    </Text>
                  </View>

                  <View style={styles.headerRow}>
                    <Text style={styles.propertyType}>{property.propertyType}</Text>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(property._id);
                      }}
                    >
                      <Ionicons
                        name={likedProperties.includes(property._id) ? "heart" : "heart-outline"}
                        size={26}
                        color={likedProperties.includes(property._id) ? "red" : "gray"}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.location}>📍 {property.location}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      ₹ {parseInt(property.price).toLocaleString()}
                    </Text>

                    <View style={styles.priceButtons}>
                      <TouchableOpacity
                        style={[styles.btn, styles.enquireBtn]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEnquiryNow(property);
                        }}
                      >
                        <Text style={styles.btnText}>Enquire</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btn, styles.shareBtn]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleShare(property);
                        }}
                      >
                        <Text style={styles.btnText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </Animated.ScrollView>

      <Modal
        visible={isPropertyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPropertyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {!referredInfo ? (
              <View style={styles.noReferredInfo}>
                <Text style={styles.noReferredInfoText}>
                  No referral information available
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPropertyModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Image
                  source={require("../../../assets/man.png")}
                  style={styles.agentLogo}
                />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  noPropertiesText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  cardContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  imageSlider: {
    position: "relative",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  pagination: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  inactiveDot: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  content: {
    padding: 14,
  },
  propertyIdWrapper: {
    backgroundColor: "#EEF2F3",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  propertyIdText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  propertyType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  location: {
    fontSize: 15,
    color: "#555",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B4D3E",
  },
  priceButtons: {
    flexDirection: "row",
    marginTop: Platform.OS === "web" ? 0 : 6,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  enquireBtn: {
    backgroundColor: "#3E5C76",
  },
  shareBtn: {
    backgroundColor: "#666",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
  noReferredInfo: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noReferredInfoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
});

export default RegularPropertiesScreen;