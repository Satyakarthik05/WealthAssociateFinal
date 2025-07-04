import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

const LikedPropertiesScreen = () => {
  const [likedProperties, setLikedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [screenWidth, setScreenWidth] = useState(width);
  const navigation = useNavigation();

  useEffect(() => {
    const updateDimensions = ({ window }) => {
      setScreenWidth(window.width);
    };

    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDetailsString = await AsyncStorage.getItem("userDetails");
        if (!userDetailsString) {
          throw new Error("No user details found");
        }

        const userDetails = JSON.parse(userDetailsString);
        const mobileNumber =
          userDetails?.MobileNumber ||
          userDetails?.MobileIN ||
          userDetails?.Number;

        if (!mobileNumber) {
          throw new Error("No mobile number found in user details");
        }

        await fetchLikedProperties(mobileNumber);
      } catch (error) {
        console.error("Error in fetchData:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchLikedProperties = async (mobileNumber) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/properties/getlikedproperties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          MobileNumber: mobileNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLikedProperties(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching liked properties:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyPress = useCallback((property) => {
    navigation.navigate("PropertyDetails", {
      property: {
        ...property,
        id: property._id,
        price: `₹${parseInt(property.price).toLocaleString()}`,
        images: Array.isArray(property.photo)
          ? property.photo.map((photo) => ({
              uri: photo.startsWith("http") ? photo : `${API_URL}${photo}`,
            }))
          : [
              {
                uri: property.photo.startsWith("http")
                  ? property.photo
                  : `${API_URL}${property.photo}`,
              },
            ],
      },
    });
  }, []);

  const handleShare = useCallback((property) => {
    let shareImage;
    if (Array.isArray(property.photo) && property.photo.length > 0) {
      shareImage = property.photo[0].startsWith("http")
        ? property.photo[0]
        : `${API_URL}${property.photo[0]}`;
    } else if (property.photo) {
      shareImage = property.photo.startsWith("http")
        ? property.photo
        : `${API_URL}${property.photo}`;
    } else {
      shareImage = null;
    }

    navigation.navigate("PropertyCard", {
      property: {
        photo: shareImage,
        location: property.location || "Location not specified",
        price: property.price || "Price not available",
        propertyType: property.propertyType || "Property",
        PostedBy: property.PostedBy || "",
        fullName: property.fullName || "Wealth Associate",
      },
    });
  }, []);

  const PropertyCard = React.memo(({ property }) => {
    const [isLiked, setIsLiked] = useState(true);

    const handleToggleLike = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userDetailsString = await AsyncStorage.getItem("userDetails");
        const userDetails = userDetailsString
          ? JSON.parse(userDetailsString)
          : {};

        const newLikedStatus = !isLiked;
        setIsLiked(newLikedStatus);

        if (!newLikedStatus) {
          setLikedProperties((prev) =>
            prev.filter((p) => p._id !== property._id)
          );
        }

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
    };

    return (
      <TouchableOpacity
        style={styles.propertyCard}
        onPress={() => handlePropertyPress(property)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.propertyType}>{property.propertyType}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleToggleLike();
            }}
            style={styles.likeButton}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#D81B60" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <Image
          source={{
            uri: Array.isArray(property.photo)
              ? property.photo[0]?.startsWith("http")
                ? property.photo[0]
                : `${API_URL}${property.photo[0]}`
              : property.photo?.startsWith("http")
              ? property.photo
              : `${API_URL}${property.photo}`,
          }}
          style={styles.propertyImage}
          defaultSource={require("../../assets/man.png")}
        />

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {property.location}
          </Text>
          <Text style={styles.propertyPrice}>
            ₹{parseInt(property.price).toLocaleString()}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.enquiryButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("PropertyDetails", {
                property: {
                  ...property,
                  id: property._id,
                  price: `₹${parseInt(property.price).toLocaleString()}`,
                  images: Array.isArray(property.photo)
                    ? property.photo.map((photo) => ({
                        uri: photo.startsWith("http")
                          ? photo
                          : `${API_URL}${photo}`,
                      }))
                    : [
                        {
                          uri: property.photo.startsWith("http")
                            ? property.photo
                            : `${API_URL}${property.photo}`,
                        },
                      ],
                },
              });
            }}
          >
            <Text style={styles.enquiryButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShare(property);
            }}
          >
            <FontAwesome name="share" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  });

  const renderItem = ({ item }) => (
    <View
      style={
        IS_WEB && screenWidth >= 450
          ? styles.webPropertyItem
          : styles.mobilePropertyItem
      }
    >
      <PropertyCard property={item} />
    </View>
  );

  // Calculate number of columns based on screen width
  const numColumns = IS_WEB && screenWidth >= 450 ? 3 : 1;
  // Create a key that changes when numColumns changes
  const flatListKey = `flatlist-${numColumns}`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E5C76" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="warning" size={60} color="#FFC107" />
        <Text style={styles.emptyText}>Error loading properties</Text>
        <Text style={styles.emptySubtext}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            const fetchData = async () => {
              try {
                const userDetailsString = await AsyncStorage.getItem(
                  "userDetails"
                );
                const userDetails = JSON.parse(userDetailsString);
                const mobileNumber =
                  userDetails?.MobileNumber ||
                  userDetails?.MobileIN ||
                  userDetails?.Number;
                if (mobileNumber) {
                  await fetchLikedProperties(mobileNumber);
                }
              } catch (error) {
                setError(error.message);
                setLoading(false);
              }
            };
            fetchData();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (likedProperties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-dislike" size={60} color="#D81B60" />
        <Text style={styles.emptyText}>No liked properties yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the heart icon on properties to save them here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={flatListKey}
        data={likedProperties}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#3E5C76" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Liked Properties</Text>
            </View>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    paddingBottom: Platform.OS === "web" ? "0%" : "20%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "#333",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#D81B60",
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  listContent: {
    padding: Platform.OS === "web" ? 15 : 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: "#D8E3E7",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: Platform.OS === "web" ? "2%" : 0,
    width: "100%",
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
  columnWrapper: {
    justifyContent: "space-between",
  },
  propertyCard: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: Platform.OS === "web" ? 0 : 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingBottom: 0,
  },
  propertyType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  likeButton: {
    padding: 5,
  },
  propertyImage: {
    width: "100%",
    height: Platform.OS === "web" ? 180 : 200,
    marginTop: 10,
  },
  propertyInfo: {
    padding: 15,
    paddingBottom: 10,
  },
  propertyLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3E5C76",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 0,
  },
  enquiryButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  enquiryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  shareButton: {
    backgroundColor: "#3E5C76",
    borderRadius: 20,
    padding: 8,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LikedPropertiesScreen;
