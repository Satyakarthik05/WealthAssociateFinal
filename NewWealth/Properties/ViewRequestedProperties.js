import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Button,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWindowDimensions } from "react-native";

const { width } = Dimensions.get("window");
import { API_URL } from "../../data/ApiUrl";
import logo1 from "../../assets/Land.jpg";
import logo2 from "../../assets/residntial.jpg";
import logo3 from "../../assets/commercial.jpg";
import logo4 from "../../assets/villa.jpg";
import logo5 from "../../assets/house.png";

const RequestedProperties = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 450;
  // MODIFIED: Calculate cards per row and card width
  const cardsPerRow = isMobile ? 1 : 3;
  const cardMargin = isMobile ? 8 : 6;
  const cardWidth = isMobile
    ? "90%"
    : (Math.min(width, 1200) - 40 - cardsPerRow * cardMargin * 2) / cardsPerRow;

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editedData, setEditedData] = useState({
    propertyTitle: "",
    propertyType: "",
    location: "",
    Budget: "",
  });

  const getLastFourChars = (id) => {
    return id ? id.slice(-4) : "N/A";
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${API_URL}/requestProperty/myrequestedPropertys`,
        {
          method: "GET",
          headers: {
            token: `${token}` || "",
          },
        }
      );
      const data = await response.json();

      if (!data || !Array.isArray(data)) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const formattedProperties =
        data.length > 0
          ? data.reverse().map((item) => ({
              id: item._id,
              title: item.propertyTitle,
              type: item.propertyType,
              ExactLocation: item.islocation,
              location: item.location,
              budget: `₹${item.Budget?.toLocaleString()}`,
              image: getImageByPropertyType(item.propertyType),
            }))
          : [];

      setProperties(formattedProperties);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
      setLoading(false);
    }
  };

  const getImageByPropertyType = (propertyType) => {
    switch (propertyType?.toLowerCase()) {
      case "land":
        return logo1;
      case "residential":
        return logo2;
      case "commercial":
        return logo3;
      case "villa":
        return logo4;
      default:
        return logo5;
    }
  };

  const handleEditPress = (property) => {
    setSelectedProperty(property);
    setEditedData({
      propertyTitle: property.title,
      propertyType: property.type,
      location: property.location,
      Budget: property.budget.replace("₹", "").replace(/,/g, ""),
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProperty) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/requestProperty/updateProperty/${selectedProperty.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: `${token}`,
          },
          body: JSON.stringify(editedData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Updated successfully:", result);
        setEditModalVisible(false);
        fetchProperties();
      } else {
        console.error("Failed to update:", result.message);
      }
    } catch (error) {
      console.error("Error updating property:", error);
    }
  };

  // MODIFIED: New function to render card rows
  const renderCardRows = () => {
    const rows = [];
    for (let i = 0; i < properties.length; i += cardsPerRow) {
      const rowCards = properties.slice(i, i + cardsPerRow);
      rows.push(
        <View key={i} style={styles.cardRow}>
          {rowCards.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { width: cardWidth, margin: cardMargin }]}
            >
              <Image source={item.image} style={styles.image} />
              <View style={styles.details}>
                <View style={styles.idContainer}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>
                      ID: {getLastFourChars(item.id)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.text}>Type: {item.type}</Text>
                <Text style={styles.text}>Constituency: {item.location}</Text>
                <Text style={styles.text}>
                  ExactLocation: {item.ExactLocation}
                </Text>
                <Text style={styles.text}>Budget: {item.budget}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditPress(item)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {/* Add empty views to fill the row */}
          {rowCards.length < cardsPerRow &&
            Array(cardsPerRow - rowCards.length)
              .fill()
              .map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={[styles.emptyCard, { width: cardWidth }]}
                />
              ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={{ flex: 1, height: "100%" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.heading}>Requested Properties</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3E5C76" />
            <Text style={styles.loadingText}>Fetching properties...</Text>
          </View>
        ) : properties.length === 0 ? (
          <View style={styles.noPropertiesContainer}>
            <Text style={styles.noPropertiesText}>
              No properties requested yet
            </Text>
          </View>
        ) : (
          // MODIFIED: Changed grid to gridContainer and use renderCardRows
          <View style={styles.gridContainer}>{renderCardRows()}</View>
        )}

        <Modal visible={editModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Property</Text>
              <TextInput
                style={styles.input}
                value={editedData.propertyTitle}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, propertyTitle: text })
                }
                placeholder="Property Title"
              />
              <TextInput
                style={styles.input}
                value={editedData.propertyType}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, propertyType: text })
                }
                placeholder="Property Type"
              />
              <TextInput
                style={styles.input}
                value={editedData.location}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, location: text })
                }
                placeholder="Location"
              />
              <TextInput
                style={styles.input}
                value={editedData.Budget}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setEditedData({ ...editedData, Budget: text })
                }
                placeholder="Budget"
              />
              <View style={styles.modalButtonsContainer}>
                <Button
                  title="Save Changes"
                  color="green"
                  onPress={handleSaveEdit}
                />
                <Button
                  title="Cancel"
                  color="red"
                  onPress={() => setEditModalVisible(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

// MODIFIED: Updated styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#D8E3E7",
    alignItems: "center",
    paddingBottom: "29%",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#3E5C76",
    textAlign: "center",
  },
  // MODIFIED: New grid container style
  gridContainer: {
    width: "100%",
    maxWidth: 1200,
    paddingHorizontal: 8,
    alignSelf: "center",
  },
  // MODIFIED: New card row style
  cardRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    position: "relative",
  },
  // MODIFIED: New empty card style
  emptyCard: {
    padding: 10,
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderRadius: 5,
  },
  details: {
    padding: 10,
  },
  idContainer: {
    alignItems: "flex-end",
    marginBottom: 5,
  },
  idBadge: {
    backgroundColor: "#2B2D42",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
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
  editButton: {
    marginTop: 10,
    backgroundColor: "#3E5C76",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#D8E3E7",
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  noPropertiesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noPropertiesText: {
    fontSize: 16,
    color: "#666",
  },
});

export default RequestedProperties;
