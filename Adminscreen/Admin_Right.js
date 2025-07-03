import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { API_URL } from "../data/ApiUrl";

const { width } = Dimensions.get("window");

const Dashboard = () => {
  // State for dashboard stats
  const [Agents, setAgents] = useState("");
  const [Experts, setExperts] = useState("");
  const [Customers, setCustomers] = useState("");
  const [Properties, setProperties] = useState("");
  const [SkilledResource, setSkilledResource] = useState("");
  const [investors, setinvestors] = useState("");
  const [approvedproperties, setapproves] = useState("");
  const [data, setData] = useState([]);

  // State for properties
  const [allProperties, setAllProperties] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editedDetails, setEditedDetails] = useState({
    propertyType: "",
    location: "",
    price: "",
    photo: "",
    newImageUrls: [],
  });
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [idSearch, setIdSearch] = useState("");
  const [approvedIdSearch, setApprovedIdSearch] = useState("");

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          agentsRes,
          customersRes,
          propertiesRes,
          approvedproprtiesres,
          expertsRes,
          skilledRes,
          investorsres,
          allPropsRes,
          approvedPropsRes,
          propertyTypesRes,
          constituenciesRes,
        ] = await Promise.all([
          fetch(`${API_URL}/count/total-agents`),
          fetch(`${API_URL}/count/total-customers`),
          fetch(`${API_URL}/count/total-properties`),
          fetch(`${API_URL}/count/total-approvedproperties`),
          fetch(`${API_URL}/count/total-experts`),
          fetch(`${API_URL}/count/total-skilledlabours`),
          fetch(`${API_URL}/count/total-Investors`),
          fetch(`${API_URL}/properties/getallPropertys`),
          fetch(`${API_URL}/properties/getApproveProperty`),
          fetch(`${API_URL}/discons/propertytype`),
          fetch(`${API_URL}/alldiscons/alldiscons`),
        ]);

        setAgents((await agentsRes.json()).totalAgents);
        setCustomers((await customersRes.json()).totalAgents);
        setProperties((await propertiesRes.json()).totalAgents);
        setExperts((await expertsRes.json()).totalAgents);
        setSkilledResource((await skilledRes.json()).totalAgents);
        setinvestors((await investorsres.json()).totalAgents);
        setapproves((await approvedproprtiesres.json()).totalAgents);

        const propertiesData = await allPropsRes.json();
        if (propertiesData && Array.isArray(propertiesData)) {
          setAllProperties(propertiesData);
        }

        const approvedData = await approvedPropsRes.json();
        if (approvedData && Array.isArray(approvedData)) {
          setApprovedProperties(approvedData);
        }

        setPropertyTypes(await propertyTypesRes.json());
        setConstituencies(await constituenciesRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get last 4 characters of ID
  const getLastFourChars = (id) => {
    return id ? id.slice(-4) : "N/A";
  };

  // Filter properties based on ID search
  const filteredProperties = allProperties.filter((property) => {
    return idSearch
      ? getLastFourChars(property._id)
          .toLowerCase()
          .includes(idSearch.toLowerCase())
      : true;
  });

  const filteredApprovedProperties = approvedProperties.filter((property) => {
    return approvedIdSearch
      ? getLastFourChars(property._id)
          .toLowerCase()
          .includes(approvedIdSearch.toLowerCase())
      : true;
  });

  // Split properties into two halves for the two rows
  const firstHalf = filteredProperties.slice(
    0,
    Math.ceil(filteredProperties.length / 2)
  );
  const secondHalf = filteredProperties.slice(
    Math.ceil(filteredProperties.length / 2)
  );

  // Split approved properties into two halves
  const approvedFirstHalf = filteredApprovedProperties.slice(
    0,
    Math.ceil(filteredApprovedProperties.length / 2)
  );
  const approvedSecondHalf = filteredApprovedProperties.slice(
    Math.ceil(filteredApprovedProperties.length / 2)
  );

  // Handle property approval
  const handleApprove = async (id) => {
    const confirmApprove =
      Platform.OS === "web"
        ? window.confirm("Are you sure you want to approve this property?")
        : await new Promise((resolve) => {
            Alert.alert(
              "Confirm",
              "Are you sure you want to approve this property?",
              [
                { text: "Cancel", onPress: () => resolve(false) },
                { text: "Approve", onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmApprove) return;

    try {
      const response = await fetch(`${API_URL}/properties/approve/${id}`, {
        method: "POST",
      });

      if (response.ok) {
        // Update both properties lists
        const updatedProperties = allProperties.map((prop) =>
          prop._id === id ? { ...prop, approved: true } : prop
        );
        setAllProperties(updatedProperties);

        // Refresh approved properties
        const approvedRes = await fetch(
          `${API_URL}/properties/getApproveProperty`
        );
        const approvedData = await approvedRes.json();
        if (approvedData && Array.isArray(approvedData)) {
          setApprovedProperties(approvedData);
        }

        if (Platform.OS === "web") {
          alert("Property approved successfully!");
        } else {
          Alert.alert("Success", "Property approved successfully!");
        }
      }
    } catch (error) {
      console.error("Error approving property:", error);
      Alert.alert("Error", "Failed to approve property");
    }
  };

  // Handle property deletion
  const handleDelete = async (id, isApproved = false) => {
    const confirmDelete =
      Platform.OS === "web"
        ? window.confirm("Are you sure you want to delete this property?")
        : await new Promise((resolve) => {
            Alert.alert(
              "Confirm",
              "Are you sure you want to delete this property?",
              [
                { text: "Cancel", onPress: () => resolve(false) },
                { text: "Delete", onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmDelete) return;

    try {
      const endpoint = isApproved
        ? `${API_URL}/properties/approvedelete/${id}`
        : `${API_URL}/properties/delete/${id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        if (isApproved) {
          setApprovedProperties(
            approvedProperties.filter((item) => item._id !== id)
          );
        } else {
          setAllProperties(allProperties.filter((item) => item._id !== id));
        }

        if (Platform.OS === "web") {
          alert("Property deleted successfully!");
        } else {
          Alert.alert("Success", "Property deleted successfully!");
        }
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      Alert.alert("Error", "Failed to delete property");
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      Alert.alert("Error", "Both title and message are required");
      return;
    }

    setIsSendingNotification(true);

    try {
      const response = await fetch(`${API_URL}/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Notification sent successfully");
        setIsNotificationModalVisible(false);
        setNotificationTitle("");
        setNotificationMessage("");
      } else {
        Alert.alert("Error", result.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert("Error", "An error occurred while sending the notification");
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Handle property edit
  const handleEdit = (property, isApproved = false) => {
    setSelectedProperty({ ...property, isApproved });
    setEditedDetails({
      propertyType: property.propertyType,
      location: property.location,
      price: property.price.toString(),
      photo: property.photo,
      newImageUrls: property.newImageUrls || [],
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const endpoint = selectedProperty.isApproved
        ? `${API_URL}/properties/approveupdate/${selectedProperty._id}`
        : `${API_URL}/properties/update/${selectedProperty._id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedDetails),
      });

      if (response.ok) {
        if (selectedProperty.isApproved) {
          const updatedProperties = approvedProperties.map((item) =>
            item._id === selectedProperty._id
              ? { ...item, ...editedDetails }
              : item
          );
          setApprovedProperties(updatedProperties);
        } else {
          const updatedProperties = allProperties.map((item) =>
            item._id === selectedProperty._id
              ? { ...item, ...editedDetails }
              : item
          );
          setAllProperties(updatedProperties);
        }

        setIsModalVisible(false);
        Alert.alert("Success", "Property updated successfully.");
      } else {
        const result = await response.json();
        Alert.alert("Error", result.message || "Failed to update property.");
      }
    } catch (error) {
      console.error("Error updating property:", error);
      Alert.alert("Error", "An error occurred while updating the property.");
    }
  };

  // Update dashboard stats data
  useEffect(() => {
    const fetchedData = [
      {
        id: 1,
        title: "Wealth Associates",
        count: `${Agents}` || "0",
        icon: "account-circle",
      },
      {
        id: 2,
        title: "Expert Panel Members",
        count: `${Experts}` || "0",
        icon: "account-check",
      },
      {
        id: 3,
        title: "Investors & Landlords",
        count: `${investors}` || "0",
        icon: "airplane",
      },
      {
        id: 4,
        title: "Customers",
        count: `${Customers}` || "0",
        icon: "account-group",
      },
      {
        id: 5,
        title: "Total Properties Listed",
        count: `${Properties}` || "0",
        icon: "office-building",
      },
      {
        id: 6,
        title: "Skilled Resource",
        count: `${SkilledResource}` || "0",
        icon: "human-handsup",
      },
      {
        id: 7,
        title: "Approved Properties",
        count: `${approvedproperties}` || "0",
        icon: "human-handsup",
      },
    ];
    setData(fetchedData);
  }, [Agents, Experts, Customers, Properties, SkilledResource, investors, approvedproperties]);

  // PropertyCard component with enhanced image handling
  const PropertyCard = ({
    property,
    onEdit,
    onDelete,
    onApprove,
    getLastFourChars,
    isApproved,
  }) => {
    const renderPropertyImage = () => {
      // If 'newImageUrls' is an array with images
      if (
        Array.isArray(property.newImageUrls) &&
        property.newImageUrls.length > 0
      ) {
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {property.newImageUrls.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        );
      }
      // Single image (string)
      else if (
        property.newImageUrls &&
        typeof property.newImageUrls === "string"
      ) {
        return (
          <Image
            source={{ uri: property.newImageUrls }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
        );
      }
      // Fallback to photo field if newImageUrls doesn't exist
      else if (property.photo) {
        return (
          <Image
            source={{ uri: `${API_URL}${property.photo}` }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
        );
      }
      // Fallback image
      else {
        return (
          <Image
            source={require("../assets/logo.png")}
            style={styles.propertyImage}
            resizeMode="contain"
          />
        );
      }
    };

    return (
      <View style={styles.propertyCard}>
        {renderPropertyImage()}
        <View style={styles.propertyDetails}>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>
              ID: {getLastFourChars(property._id)}
            </Text>
          </View>
          <Text style={styles.propertyTitle}>{property.propertyType}</Text>
          {property.propertyDetails && (
            <Text style={styles.propertyDetailsText}>
              {property.propertyDetails}
            </Text>
          )}
          <Text style={styles.propertyInfo}>Location: {property.location}</Text>
          <Text style={styles.propertyPrice}>
            ₹{parseInt(property.price).toLocaleString()}
          </Text>
          <Text style={styles.propertyStatus}>
            Status: {isApproved ? "Approved" : "Pending"}
          </Text>
        </View>
        <View style={styles.propertyButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(property)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          {!isApproved && (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => onApprove(property._id)}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(property._id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const DashboardCard = ({ title, count, icon }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>{count}</Text>
      <Icon name={icon} size={30} color="#E91E63" style={styles.icon} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Stats Cards Section */}
      <View style={styles.statsContainer}>
        {data.map((item) => (
          <DashboardCard
            key={item.id}
            title={item.title}
            count={item.count}
            icon={item.icon}
          />
        ))}
      </View>
      <TouchableOpacity
        style={styles.sendNotificationButton}
        onPress={() => setIsNotificationModalVisible(true)}
      >
        <Text style={styles.sendNotificationButtonText}>
          Send Push Notification
        </Text>
      </TouchableOpacity>

      {/* Pending Properties Section */}
      <View style={styles.propertiesHeader}>
        <Text style={styles.sectionTitle}>Pending Properties</Text>
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.idSearchInput}
            placeholder="Search by ID (last 4 chars)"
            value={idSearch}
            onChangeText={setIdSearch}
            maxLength={4}
          />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedFilter}
              onValueChange={setSelectedFilter}
              style={styles.picker}
            >
              <Picker.Item label="-- Sort --" value="" />
              <Picker.Item label="Price: High to Low" value="highToLow" />
              <Picker.Item label="Price: Low to High" value="lowToHigh" />
            </Picker>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <>
          {/* First Row of Pending Properties */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.propertyRow}
          >
            {firstHalf.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onEdit={() => handleEdit(property, false)}
                onDelete={() => handleDelete(property._id, false)}
                onApprove={() => handleApprove(property._id)}
                getLastFourChars={getLastFourChars}
                isApproved={false}
              />
            ))}
          </ScrollView>

          {/* Second Row of Pending Properties */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.propertyRow}
          >
            {secondHalf.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onEdit={() => handleEdit(property, false)}
                onDelete={() => handleDelete(property._id, false)}
                onApprove={() => handleApprove(property._id)}
                getLastFourChars={getLastFourChars}
                isApproved={false}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Approved Properties Section */}
      <View style={styles.propertiesHeader}>
        <Text style={styles.sectionTitle}>Approved Properties</Text>
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.idSearchInput}
            placeholder="Search by ID (last 4 chars)"
            value={approvedIdSearch}
            onChangeText={setApprovedIdSearch}
            maxLength={4}
          />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedFilter}
              onValueChange={setSelectedFilter}
              style={styles.picker}
            >
              <Picker.Item label="-- Sort --" value="" />
              <Picker.Item label="Price: High to Low" value="highToLow" />
              <Picker.Item label="Price: Low to High" value="lowToHigh" />
            </Picker>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <>
          {/* First Row of Approved Properties */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.propertyRow}
          >
            {approvedFirstHalf.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onEdit={() => handleEdit(property, true)}
                onDelete={() => handleDelete(property._id, true)}
                getLastFourChars={getLastFourChars}
                isApproved={true}
              />
            ))}
          </ScrollView>

          {/* Second Row of Approved Properties */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.propertyRow}
          >
            {approvedSecondHalf.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onEdit={() => handleEdit(property, true)}
                onDelete={() => handleDelete(property._id, true)}
                getLastFourChars={getLastFourChars}
                isApproved={true}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Property</Text>

            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Property Type:</Text>
              <View style={styles.dropdown}>
                <Picker
                  selectedValue={editedDetails.propertyType}
                  onValueChange={(value) =>
                    setEditedDetails({ ...editedDetails, propertyType: value })
                  }
                >
                  <Picker.Item label="Select Property Type" value="" />
                  {propertyTypes.map((type) => (
                    <Picker.Item
                      key={type._id}
                      label={type.name}
                      value={type.name}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Location:</Text>
              <View style={styles.dropdown}>
                <Picker
                  selectedValue={editedDetails.location}
                  onValueChange={(value) =>
                    setEditedDetails({ ...editedDetails, location: value })
                  }
                >
                  <Picker.Item label="Select Location" value="" />
                  {constituencies
                    .flatMap((item) => item.assemblies)
                    .map((assembly) => (
                      <Picker.Item
                        key={assembly._id}
                        label={assembly.name}
                        value={assembly.name}
                      />
                    ))}
                </Picker>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={editedDetails.price}
              onChangeText={(text) =>
                setEditedDetails({ ...editedDetails, price: text })
              }
              keyboardType="numeric"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <Modal
        visible={isNotificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Push Notification</Text>

            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: "top" }]}
              placeholder="Notification Message"
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsNotificationModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSendNotification}
                disabled={isSendingNotification}
              >
                {isSendingNotification ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    width: Platform.OS === "web" ? "18%" : "48%",
    height: 100,
    marginVertical: 6,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  count: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  icon: {
    position: "absolute",
    right: 15,
    bottom: 15,
  },
  propertiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  idSearchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    width: 150,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 3,
    height: Platform.OS === "android" ? 50 : 40,
  },
  picker: {
    height: "100%",
    width: 150,
  },
  loader: {
    marginTop: 50,
  },
  propertyRow: {
    marginBottom: 15,
    height: 400,
  },
  propertyCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginRight: 15,
    width: 280,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageScroll: {
    height: 150,
  },
  propertyImage: {
    width: 260,
    height: 150,
    borderRadius: 8,
    marginRight: 5,
  },
  propertyDetails: {
    marginTop: 10,
  },
  idContainer: {
    backgroundColor: "#2ecc71",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  idText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  propertyDetailsText: {
    fontSize: 14,
    color: "#555",
    marginVertical: 3,
  },
  propertyInfo: {
    fontSize: 14,
    color: "#555",
    marginVertical: 3,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
  },
  propertyStatus: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 3,
  },
  propertyButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "#3498db",
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  sendNotificationButton: {
    backgroundColor: "#9b59b6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sendNotificationButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#2ecc71",
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: Platform.OS === "web" ? "50%" : "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  dropdownLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
    height: 40,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  saveButton: {
    backgroundColor: "#3498db",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Dashboard;