import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import ViewShot from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultAgentImage from "../../assets/man.png";
import { exportedFullName, exportedMobileNumber } from "../MainScreen/Uppernavigation";

const PropertyCards = ({ property = {}, closeModal }) => {
  const viewShotRef = useRef();
  const [isSharing, setIsSharing] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [agentImage, setAgentImage] = useState(defaultAgentImage);
  const [propertyImage, setPropertyImage] = useState(require("../../assets/logosub.png"));

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Load agent profile image from AsyncStorage
        const savedAgentImage = await AsyncStorage.getItem("@profileImage");
        if (savedAgentImage) {
          setAgentImage({ uri: savedAgentImage });
        }

        // Handle property image
        if (property?.photo) {
          // Check if it's a local file URI
          if (property.photo.startsWith("file://")) {
            const fileExists = await FileSystem.getInfoAsync(property.photo);
            if (fileExists.exists) {
              setPropertyImage({ uri: property.photo });
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
        }
      } catch (error) {
        console.error("Error loading images:", error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadImages();
  }, [property?.photo]);

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
      }.\n\nDownload our app: ${
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

  const handleAppStorePress = () => {
    Linking.openURL(
      Platform.OS === "ios"
        ? "https://apps.apple.com/in/app/wealth-associate/id6743356719"
        : "https://play.google.com/store/apps/details?id=com.wealthassociates.alpha"
    );
  };

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No property data available</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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
              source={propertyImage}
              style={styles.propertyImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
                setPropertyImage(require("../../assets/logosub.png"));
              }}
              defaultSource={require("../../assets/logosub.png")}
            />
            {imageError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Image not available</Text>
              </View>
            )}
          </View>

          {/* Property Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.propertyType}>
              PROPERTY TYPE: {property.propertyType?.toUpperCase() || "PROPERTY"}
            </Text>
            <Text style={styles.location}>
              LOCATION: {property.location?.toUpperCase() || "LOCATION NOT SPECIFIED"}
            </Text>
            <Text style={styles.price}>₹{property.price || "Price on request"}</Text>
          </View>

          {/* Agent Info */}
          <View style={styles.agentInfo}>
            <Image 
              source={agentImage} 
              style={styles.agentImage}
              onError={() => setAgentImage(defaultAgentImage)}
            />
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>Contact Agent</Text>
              <Text style={styles.agentPhone}>Wealth Associate</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.downloadText}>DOWNLOAD OUR APP</Text>
          <View style={styles.appButtons}>
            <TouchableOpacity 
              style={styles.appButton} 
              onPress={handleAppStorePress}
            >
              <FontAwesome 
                name={Platform.OS === "ios" ? "apple" : "android"} 
                size={16} 
                color="#000" 
              />
              <Text style={styles.buttonText}>
                {Platform.OS === "ios" ? "App Store" : "Play Store"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
          <Text style={styles.buttonText}>Cancel</Text>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 330,
    marginLeft: 17,
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    top: 10,
    // maxHeight: "80%",
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    marginBottom: 10,
  },
  header: {
    backgroundColor: "#fff5f5",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  logo: {
    marginLeft: -9,
    bottom: 15,
    width: 120,
    height: 120,
  },
  content: {
    padding: 15,
  },
  forSaleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
    backgroundColor: "#1a237e",
    height: 50,
    width: 350,
    lineHeight: 50,
    marginTop: -48,
    marginLeft: -20,
  },
  imageContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    zIndex: 1,
  },
  propertyImage: {
    width: "100%",
    height: 180,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    width: '100%',
    height: 180,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
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
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
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
    borderColor: '#fff',
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  agentPhone: {
    color: '#fff',
    fontSize: 12,
  },
  footer: {
    backgroundColor: "#e8eaf6",
    padding: 10,
    alignItems: "center",
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a237e",
  },
  appButtons: {
    flexDirection: "row",
    justifyContent: "center",
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
    marginTop: 8,
    marginBottom: 10,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    justifyContent: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default PropertyCards;