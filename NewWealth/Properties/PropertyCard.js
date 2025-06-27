import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import logo from "../../assets/logosub.png";
import { FontAwesome5, AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultAgentImage from "../../assets/man.png";
import { exportedFullName, exportedMobileNumber } from "../MainScreen/Uppernavigation";


const PropertyCard = ({ property = {}, closeModal }) => {
  const viewShotRef = useRef();
  const [isSharing, setIsSharing] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [agentImage, setAgentImage] = useState(defaultAgentImage);
  const [propertyImage, setPropertyImage] = useState(logo);
  const [mounted, setMounted] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Load agent profile image
        const savedAgentImage = await AsyncStorage.getItem("@profileImage");
        if (mounted && savedAgentImage) {
          setAgentImage({ uri: savedAgentImage });
        }

        // Load property image
        if (property?.photo) {
          // Check if it's a local file URI
          if (property.photo.startsWith("file://")) {
            const fileExists = await FileSystem.getInfoAsync(property.photo);
            if (fileExists.exists) {
              setPropertyImage({ uri: property.photo });
            } else {
              setPropertyImage(logo);
            }
          }
          // Check if it's a remote URL
          else if (property.photo.startsWith("http")) {
            setPropertyImage({ uri: property.photo });
          }
          // Check if it's a base64 string
          else if (property.photo.startsWith("data:image")) {
            setPropertyImage({ uri: property.photo });
          }
          // Check if it's a local asset reference
          else if (typeof property.photo === "number") {
            setPropertyImage(property.photo);
          }
        }
      } catch (error) {
        console.error("Error loading images:", error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadImages();
  }, [mounted, property?.photo]);

  const getAgentName = () => {
    return (
      property?.fullName ||
      property?.Name ||
      property?.PostedBy ||
      "Wealth Associate"
    );
  };

  const getAgentMobile = () => {
    return (
      property?.mobile ||
      property?.MobileNumber ||
      property?.PostedBy ||
      "Contact for details"
    );
  };

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
          "Sharing Not Supported",
          "Update your device to enable sharing."
        );
        return;
      }

      const message = `Check out this ${
        property?.propertyType || "property"
      } in ${property?.location || "a great location"} for ₹${
        property?.price || "contact for price"
      }.\n\nContact Agent: ${getAgentName()} (${getAgentMobile()})\n\nDownload our app: ${
        Platform.OS === "ios"
          ? "https://apps.apple.com/in/app/wealth-associate/id6743356719"
          : "https://play.google.com/store/apps/details?id=com.wealthassociates.alpha"
      }`;

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Property For Sale",
        mimeType: "image/jpeg",
        UTI: "image/jpeg",
        message: message,
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      Alert.alert(
        "Sharing Error",
        error.message || "Couldn't share the property."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => closeModal());
  };

  if (!property) {
    return (
      <Animated.View style={[styles.templateContainer, { opacity: fadeAnim }]}>
        <Text style={styles.errorText}>No property data available</Text>
        <TouchableOpacity style={styles.button} onPress={handleClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.templateContainer, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.9 }}
          style={styles.viewShotContainer}
        >
          <Text style={styles.propertyForSaleText}>PROPERTY FOR SALE</Text>

          <Image source={logo} style={styles.logoImage} />
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: "https://www.wealthassociate.in/images/logo.png" }}
              style={styles.websiteLogo}
            />
          </View>

          <View style={styles.imageSection}>
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5a89cc" />
              </View>
            )}
            <Image
              source={propertyImage}
              style={styles.propertyImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
                setPropertyImage(logo);
              }}
              defaultSource={logo}
            />
            {imageError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load image</Text>
              </View>
            )}
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                ₹{property.price || "Price not specified"}
              </Text>
            </View>
          </View>

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyType}>
              {property.propertyType || "Property"}
            </Text>
            <Text style={styles.locationText}>
              Location: {property.location || "Location not specified"}
            </Text>
          </View>

          <View style={styles.agentInfo}>
            <Image
              source={agentImage}
              style={styles.agentImage}
              onError={() => setAgentImage(defaultAgentImage)}
            />
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>{exportedFullName}</Text>
              <Text style={styles.agentPhone}>{exportedMobileNumber}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.downloadTitle}>Download Our App</Text>
            <View style={styles.storeButtons}>
              {[true, false].map((isIOS, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.storeButton}
                  onPress={() =>
                    Linking.openURL(
                      isIOS
                        ? "https://apps.apple.com/in/app/wealth-associate/id6743356719"
                        : "https://play.google.com/store/apps/details?id=com.wealthassociates.alpha"
                    )
                  }
                >
                  {isIOS ? (
                    <AntDesign name="apple1" size={24} color="#000" />
                  ) : (
                    <FontAwesome5 name="google-play" size={24} color="#000" />
                  )}
                  <Text style={styles.storeText}>
                    {isIOS ? "App Store" : "Google Play"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ViewShot>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="share" size={24} color="white" />
                <Text style={[styles.buttonText, styles.shareButtonText]}>
                  Share Property
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  templateContainer: {
    borderRadius: 10,
    padding: 10,
    margin: 10,
    width: Platform.OS === "ios" ? "95%" : "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 600,
    backgroundColor: "#fff",
  },
  viewShotContainer: {
    backgroundColor: "#fff5f5",
    borderRadius: 10,
    padding: 10,
  },
  propertyForSaleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    textTransform: "uppercase",
    backgroundColor: "#1a237e",
    height: 50,
    width: 333,
    left: -10,
    top: 95,
    lineHeight: 50,
    borderRadius: 0,
  },
  propertyImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    top: -45,
  },
  propertyInfo: {
    marginTop: -15,
    left: 5,
    top: 5,
  },
  propertyType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    top: -20,
  },
  locationText: {
    bottom: 25,
    fontSize: 14,
    color: "black",
    marginTop: 18,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoImage: {
    width: 120,
    height: 100,
    top: -55,
    left: 94,
  },
  websiteLogo: {
    width: 80,
    height: 40,
    resizeMode: "contain",
  },
  priceTag: {
    position: "absolute",
    bottom: 50,
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
  agentInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a237e",
    borderRadius: 0,
    width: 333,
    height: 60,
    padding: 10,
    marginTop: 2,
    marginBottom: 10,
    left: -10,
  },
  agentImage: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginRight: 15,
    backgroundColor: "#1a237e",
    borderWidth: 2,
    borderColor: "white",
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "white",
  },
  agentPhone: {
    fontSize: 14,
    color: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f9f9f9",
  },
  shareButton: {
    backgroundColor: "#007AFF",
  },
  shareButtonText: {
    color: "white",
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
  },
  loadingContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  errorContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
  },
  footer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  downloadTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  storeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "white",
    borderRadius: 5,
  },
  storeText: {
    marginLeft: 5,
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 80,
  },
});

export default PropertyCard;
