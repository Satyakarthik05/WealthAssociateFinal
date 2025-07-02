import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import ViewShot from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { exportedFullName, exportedMobileNumber } from "../MainScreen/Uppernavigation";

console.log("Name:", exportedFullName);
console.log("Mobile:", exportedMobileNumber);


const PropertyCard = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const viewShotRef = useRef();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [agentImage, setAgentImage] = useState(require("../../assets/man.png"));
  const [isSharing, setIsSharing] = useState(false);
  const [userData, setUserData] = useState({
    FullName: "Wealth Associate",
    mobile: "",
  });

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userDetails");
        console.log("Stored user details:", storedData);
        if (storedData !== null) {
          const parsedData = JSON.parse(storedData);
          setUserData({
            FullName: parsedData.FullName || "Wealth Associate",
            mobile: parsedData.MobileNumber || parsedData.mobileNumber || "",
          });
        }
      } catch (e) {
        console.error("Failed to load user details", e);
      }
    };

    getUserDetails();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load property data
      const storedProperty = await AsyncStorage.getItem("sharedProperty");
      if (storedProperty) {
        const parsedProperty = JSON.parse(storedProperty);
        console.log("Loaded property from storage:", parsedProperty);
        setProperty(parsedProperty);
      } else if (route.params?.property) {
        console.log("Loaded property from route params:", route.params.property);
        setProperty(route.params.property);
      }

      // Load agent image
      try {
        const savedAgentImage = await AsyncStorage.getItem("agentImage");
        if (savedAgentImage) {
          const fileExists = await FileSystem.getInfoAsync(savedAgentImage);
          if (fileExists.exists) {
            console.log("Loading agent image from storage:", savedAgentImage);
            setAgentImage({ uri: savedAgentImage });
            return;
          }
        }
        
        // If no saved image, check if property has photo
        if (property?.photo) {
          console.log("Loading agent image from property:", property.photo);
          setAgentImage({ uri: property.photo });
        }
      } catch (imageError) {
        console.error("Error loading agent image:", imageError);
        setAgentImage(require("../../assets/man.png"));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [route.params?.property]);

  const handleShare = async () => {
    if (!viewShotRef.current) {
      Alert.alert("Error", "Sharing component not ready");
      return;
    }

    setIsSharing(true);
    try {
      const uri = await viewShotRef.current.capture({
        format: "jpg",
        quality: 0.9,
      });

      if (!uri) throw new Error("Failed to capture image");

      const fileUri = FileSystem.cacheDirectory + "shared-property.jpg";
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing Not Available",
          "Sharing is not supported on this device"
        );
        return;
      }

      const { propertyType, location, price, fullName, mobile, PostedBy } = property || {};
      const contactName = fullName || userData.FullName;
      const contactNumber = mobile || PostedBy || userData.mobile;

      const message = `Check out this ${propertyType || "property"} in ${
        location || "a great location"
      } for ₹${price || "contact for price"}\n\nContact: ${contactName} (${contactNumber})`;

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Property For Sale",
        mimeType: "image/jpeg",
        UTI: "image/jpeg",
        message: message,
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      Alert.alert("Error", "Failed to share property");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCall = () => {
    const phoneNumber = property?.mobile || property?.PostedBy || userData.mobile;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Info", "Phone number not available");
    }
  };

  const handleAppStorePress = (isIOS) => {
    Linking.openURL(
      isIOS
        ? "https://apps.apple.com/in/app/wealth-associate/id6743356719"
        : "https://play.google.com/store/apps/details?id=com.wealthassociates.alpha"
    );
  };

  const handleCancel = async () => {
    try {
      await AsyncStorage.removeItem("sharedProperty");
      navigation.goBack();
    } catch (error) {
      console.error("Error removing property:", error);
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D81B60" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noPropertyText}>No property data available</Text>
        <Text style={styles.debugText}>
          User Data: {JSON.stringify(userData, null, 2)}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <FontAwesome name="refresh" size={16} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
          <Text style={styles.closeButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    photo = "",
    location = "Location not specified",
    price = "Price not available",
    propertyType = "Property",
    fullName = exportedFullName,
    mobile = userData.mobile,
    PostedBy = "",
  } = property;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 1.0 }}
          style={styles.cardContainer}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/logosub.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.forSaleText}>PROPERTY FOR SALE</Text>

            {/* Property Image */}
            <View style={styles.imageContainer}>
              {imageLoading && (
                <ActivityIndicator
                  size="large"
                  color="#1a237e"
                  style={styles.loadingIndicator}
                />
              )}
              <Image
                source={{ uri: photo || "https://via.placeholder.com/300" }}
                style={styles.propertyImage}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                defaultSource={require("../../assets/logosub.png")}
              />
              {imageError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Image not available</Text>
                </View>
              )}
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>₹{price}</Text>
              </View>
            </View>

            {/* Property Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.propertyType}>
                PROPERTY TYPE: {propertyType.toUpperCase()}
              </Text>
              <Text style={styles.location}>
                LOCATION: {location.toUpperCase()}
              </Text>
            </View>

            {/* Agent Info */}
            <View style={styles.agentInfo}>
              <Image
                source={agentImage}
                style={styles.agentImage}
                onError={() => {
                  console.log("Error loading agent image, falling back to default");
                  setAgentImage(require("../../assets/man.png"));
                }}
                defaultSource={require("../../assets/man.png")}
              />
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>{exportedFullName}</Text>
                <Text style={styles.agentPhone}>
                  {mobile || PostedBy || userData.mobile || "Contact for details"}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.downloadText}>DOWNLOAD OUR APP</Text>
            <View style={styles.appButtons}>
              {[false, true].map((isIOS, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.appButton}
                  onPress={() => handleAppStorePress(isIOS)}
                >
                  <FontAwesome
                    name={isIOS ? "apple" : "android"}
                    size={16}
                    color="#000"
                  />
                  <Text style={styles.buttonText}>
                    {isIOS ? "App Store" : "Play Store"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} onPress={handleCancel}>
            <Text style={styles.callButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="whatsapp" size={16} color="#fff" />
                <Text style={styles.shareButtonText}>Share</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.callAgentButton} onPress={handleCall}>
            <FontAwesome name="phone" size={16} color="#fff" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: "50%",
    paddingTop:"10%",
    backgroundColor:"#D8E3E7",
  },
  container: {
    width: "90%",
    alignSelf: "center",
    flex: 1,
    backgroundColor: "#D8E3E7",
    width: Platform.OS==="web" ? "60%" : "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noPropertyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#D81B60",
    padding: 12,
    borderRadius: 8,
    width: "50%",
    alignItems: "center",
    marginTop: 10,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a237e",
    padding: 12,
    borderRadius: 8,
    width: "50%",
    justifyContent: "center",
    marginTop: 10,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    marginBottom: 10,
  },
  header: {
    backgroundColor: "#FDFDFD",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginTop: -15,
  },
  content: {
    padding: 15,
  },
  forSaleText: {
    fontSize: 16,
    fontWeight: "bold",
  
    textAlign: "center",
    textTransform: "uppercase",
    backgroundColor: "#FDFDFD",
    height: 50,
    width: "110%",
    lineHeight: 50,
    marginTop: -48,
    marginLeft: -20,
  },
  imageContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  loadingIndicator: {
    position: "absolute",
    zIndex: 1,
  },
  propertyImage: {
    width: Platform.OS==="web" ? "50%" : "100%",
    height: Platform.OS==="web" ? 200 : 180,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    width: "100%",
    height: 180,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  priceTag: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  priceText: {
    color: "white",
    fontWeight: "bold",
  },
  detailsContainer: {
    marginBottom: 15,
  },
  propertyType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  location: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  agentInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  agentImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    color: "#white",
    fontWeight: "bold",
    fontSize: 14,
  },
  agentPhone: {
    color: "#fff",
    fontSize: 12,
  },
  footer: {
    backgroundColor: "#FDFDFD",
    padding: 10,
    alignItems: "center",
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#3E5C76",
  },
  appButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  appButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 5,
    width: "45%",
    justifyContent: "center",
    elevation: 2,
  },
  buttonText: {
    marginLeft: 6,
    fontWeight: "500",
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    justifyContent: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  callAgentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    justifyContent: "center",
  },
  callButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
});

export default PropertyCard;