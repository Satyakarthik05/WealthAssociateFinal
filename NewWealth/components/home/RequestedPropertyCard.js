import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import LazyImage from "./LazyImage";

const { width } = Dimensions.get("window");

const RequestedPropertyCard = ({ item, onIHavePress }) => {
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

  const getLastFourChars = (id) => {
    if (!id) return "N/A";
    return id.length > 4 ? id.slice(-4) : id;
  };

  const propertyTag = getPropertyTag(item.createdAt);
  const propertyId = getLastFourChars(item.id);

  const getImageByPropertyType = (propertyType) => {
    switch ((propertyType || "").toLowerCase()) {
      case "flat(apartment)":
      case "apartment":
        return require("../../../assets/download.jpeg");
      case "land(opensite)":
      case "land":
        return require("../../../assets/Land.jpg");
      case "house(individual)":
      case "house":
        return require("../../../assets/house.png");
      case "villa":
        return require("../../../assets/villa.jpg");
      case "agriculture land":
        return require("../../../assets/agriculture.jpeg");
      case "commercial property":
        return require("../../../assets/commercial.jpg");
      case "commercial land":
        return require("../../../assets/commland.jpeg");
      default:
        return require("../../../assets/house.png");
    }
  };

  const getImageSource = () => {
    // Always use local image based on property type
    return getImageByPropertyType(item.type);
  };

  const imageSource = getImageSource();

  return (
    <View style={styles.card}>
      <LazyImage
        source={imageSource}
        style={styles.propertyImage}
        cacheKey={`requested_${item.id}`}
      />
      
      <View style={styles.content}>
        <View style={styles.propertyIdWrapper}>
          <Text style={styles.propertyIdText}>ID: {propertyId}</Text>
        </View>
        
        <Text style={styles.propertyTitle}>{item.title}</Text>
        <Text style={styles.propertyText}>Type: {item.type}</Text>
        <Text style={styles.propertyText}>Location: {item.location}</Text>
        <Text style={styles.propertyText}>Budget: {item.budget}</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onIHavePress();
          }}
        >
          <Text style={styles.buttonText}>I Have This Property</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  card: {
    width: Platform.select({
      web: 350,
      default: width * 0.85,
    }),
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: Platform.OS === "web" ? 0 : 8,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  propertyImage: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    marginBottom: 8,
  },
  propertyIdText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  propertyText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default RequestedPropertyCard;