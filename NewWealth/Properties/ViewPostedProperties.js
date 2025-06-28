import React, { useEffect, useState, useRef, useCallback } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import { useNavigation } from "@react-navigation/native";
import logo1 from "../../assets/logo.png";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ViewPostedProperties = () => {
  const navigation = useNavigation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editedData, setEditedData] = useState({
    propertyType: "",
    location: "",
    price: "",
  });
  const [showFilterList, setShowFilterList] = useState(false);
  const [referredInfo, setReferredInfo] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const filterOptions = [
    { label: "All Properties", value: "" },
    { label: "Price: Low to High", value: "lowToHigh" },
    { label: "Price: High to Low", value: "highToLow" },
    { label: "Recently Added", value: "recent" },
  ];

  useEffect(() => {
    fetchProperties();
    loadReferredInfoFromStorage();
  }, []);

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
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      Alert.alert("Error", "Failed to fetch properties. Please try again.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeImageSources = useCallback((property) => {
    if (!property) return [];

    // First check for any array of images
    const possibleArrayFields = ['photos', 'imageUrls', 'newImageUrls', 'images'];
    for (const field of possibleArrayFields) {
      if (Array.isArray(property[field])) {
        return property[field]
          .filter(url => url && typeof url === 'string')
          .map(url => {
            // Handle case where URL might be relative
            if (url.startsWith('/')) {
              return `${API_URL}${url}`;
            }
            return url;
          });
      }
    }

    // Then check for single string fields
    const possibleStringFields = ['photo', 'imageUrl', 'newImageUrl', 'image'];
    for (const field of possibleStringFields) {
      if (typeof property[field] === 'string' && property[field]) {
        const url = property[field];
        return [url.startsWith('/') ? `${API_URL}${url}` : url];
      }
    }

    // If no images found, return empty array
    return [];
  }, []);

  const PropertyImageSlider = React.memo(({ images }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
      if (images.length <= 1) return;

      const interval = setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % images.length;
        setCurrentImageIndex(nextIndex);
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: nextIndex * width,
            animated: true,
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    }, [currentImageIndex, images.length]);

    if (images.length === 0) {
      return (
        <View style={styles.imagePlaceholder}>
          <Image
            source={logo1}
            style={styles.propertyImage}
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <View style={styles.imageSliderContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offsetX / width);
            setCurrentImageIndex(newIndex);
          }}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.imageSlide}>
              <Image
                source={{ uri: image }}
                style={styles.propertyImage}
                resizeMode="cover"
                onError={(e) => console.log('Failed to load image:', e.nativeEvent.error)}
              />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  });

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    setShowFilterList(false);

    let sortedProperties = [...properties];
    
    switch (value) {
      case "highToLow":
        sortedProperties.sort((a, b) => b.price - a.price);
        break;
      case "lowToHigh":
        sortedProperties.sort((a, b) => a.price - b.price);
        break;
      case "recent":
        sortedProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setProperties(sortedProperties);
  };

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

  const handlePropertyPress = (property) => {
    navigation.navigate("PropertyDetails", { 
      property: {
        ...property,
        id: property._id,
        price: `₹${parseInt(property.price).toLocaleString()}`,
        images: property.images.length > 0 
          ? property.images.map(uri => ({ uri })) 
          : [{ uri: Image.resolveAssetSource(logo1).uri }]
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E5C76" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Properties</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterList(!showFilterList)}
          >
            <Text style={styles.filterButtonText}>
              {selectedFilter
                ? filterOptions.find((opt) => opt.value === selectedFilter)?.label || "Filter"
                : "Filter"}
            </Text>
            <MaterialIcons
              name={showFilterList ? "arrow-drop-up" : "arrow-drop-down"}
              size={24}
              color="#3E5C76"
            />
          </TouchableOpacity>
        </View>
      </View>

      {showFilterList && (
        <View style={styles.filterList}>
          {filterOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterItem,
                selectedFilter === item.value && styles.selectedFilterItem,
              ]}
              onPress={() => handleFilterChange(item.value)}
            >
              <Text
                style={[
                  styles.filterItemText,
                  selectedFilter === item.value && styles.selectedFilterItemText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {properties.length === 0 ? (
        <View style={styles.noPropertiesContainer}>
          <Text style={styles.noPropertiesText}>No properties found</Text>
          <TouchableOpacity
            style={styles.addPropertyButton}
            onPress={() => navigation.navigate("PostProperty")}
          >
            <Text style={styles.addPropertyButtonText}>Add New Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.propertiesContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => handlePropertyPress(item)}>
                <PropertyImageSlider images={item.images} />
              </TouchableOpacity>
              
              <View style={styles.details}>
                <View style={styles.idContainer}>
                  <Text style={styles.idText}>ID: {getLastFourChars(item._id)}</Text>
                  <Text style={styles.statusText}>{item.status || "Pending"}</Text>
                </View>
                
                <Text style={styles.title}>{item.propertyType}</Text>
                <Text style={styles.info}>Location: {item.location}</Text>
                <Text style={styles.budget}>
                  ₹ {parseInt(item.price).toLocaleString()}
                </Text>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditPress(item)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePress(item)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
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
    color: "#3E5C76",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3E5C76",
  },
  filterButtonText: {
    color: "#3E5C76",
    marginRight: 5,
  },
  filterList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterItem: {
    padding: 10,
    borderRadius: 5,
  },
  selectedFilterItem: {
    backgroundColor: "#f0f7ff",
  },
  filterItemText: {
    color: "#3E5C76",
  },
  selectedFilterItemText: {
    fontWeight: "bold",
  },
  noPropertiesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPropertiesText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  addPropertyButton: {
    backgroundColor: "#3E5C76",
    padding: 15,
    borderRadius: 10,
  },
  addPropertyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  propertiesContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: Platform.OS === 'web' ? '30%' : '90%',
    alignSelf: Platform.OS === 'web' ? 'flex-start' : 'center',
    marginHorizontal: Platform.OS === 'web' ? '1.5%' : 0,
  },
  imageSliderContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  imageSlide: {
    width: width,
    height: 200,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    alignSelf: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    margin: 5,
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  details: {
    padding: 15,
  },
  idContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  idText: {
    color: "#3E5C76",
    fontWeight: "600",
  },
  statusText: {
    color: "#E82E5F",
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#191919",
    marginBottom: 5,
  },
  info: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  budget: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E82E5F",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#E82E5F",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  deleteButtonText: {
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
});

export default ViewPostedProperties;