import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../../data/ApiUrl";
import logo1 from "../../../assets/man.png";

const { width, height } = Dimensions.get("window");

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw error;
  }
};

export default function ViewCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editedCustomer, setEditedCustomer] = useState({
    FullName: "",
    District: "",
    Contituency: "",
    MobileNumber: "",
    MyRefferalCode: "",
    Occupation: "",
  });
  const [photo, setPhoto] = useState(null);
  const [file, setFile] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [executiveId, setExecutiveId] = useState(null);
  const [executiveName, setExecutiveName] = useState("");

  const isMobile = Platform.OS !== "web";

  useEffect(() => {
    const getExecutiveInfo = async () => {
      try {
        const storedId = await AsyncStorage.getItem("callexecutiveId");
        const storedName = await AsyncStorage.getItem("callexecutiveName");

        if (storedId) {
          setExecutiveId(storedId);
        }
        if (storedName) {
          setExecutiveName(storedName);
        }
      } catch (error) {
        console.error("Error retrieving executive info:", error);
      }
    };

    getExecutiveInfo();
    fetchAssignedCustomers();
  }, []);

  const fetchAssignedCustomers = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const token = await getAuthToken();

      const [customersRes, districtsRes] = await Promise.all([
        fetch(`${API_URL}/agent/assignedcus/${executiveId}`, {
          headers: {
            token: token || "",
          },
        }),
        fetch(`${API_URL}/alldiscons/alldiscons`, {
          headers: {
            token: token || "",
          },
        }),
      ]);

      if (!customersRes.ok) throw new Error("Failed to fetch customers");
      if (!districtsRes.ok) throw new Error("Failed to fetch districts");

      const customersData = await customersRes.json();
      const districtsData = await districtsRes.json();

      // Sort customers: first show pending customers assigned to current executive, then others
      const sortedCustomers = customersData.data.sort((a, b) => {
        // Both assigned to current executive and pending
        if (
          a.assignedExecutive === executiveId &&
          a.CallExecutiveCall !== "Done" &&
          b.assignedExecutive === executiveId &&
          b.CallExecutiveCall !== "Done"
        ) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // A is assigned to current executive and pending
        if (
          a.assignedExecutive === executiveId &&
          a.CallExecutiveCall !== "Done"
        ) {
          return -1;
        }
        // B is assigned to current executive and pending
        if (
          b.assignedExecutive === executiveId &&
          b.CallExecutiveCall !== "Done"
        ) {
          return 1;
        }
        // Both pending but not assigned to current executive
        if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall !== "Done") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // A is pending, B is done
        if (a.CallExecutiveCall !== "Done") {
          return -1;
        }
        // B is pending, A is done
        if (b.CallExecutiveCall !== "Done") {
          return 1;
        }
        // Both done
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setCustomers(sortedCustomers);
      setFilteredCustomers(sortedCustomers);
      setDistricts(districtsData || []);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", error.message || "Failed to load customers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          (customer.FullName &&
            customer.FullName.toLowerCase().includes(
              searchQuery.toLowerCase()
            )) ||
          (customer.MobileNumber &&
            customer.MobileNumber.includes(searchQuery)) ||
          (customer.MyRefferalCode &&
            customer.MyRefferalCode.toLowerCase().includes(
              searchQuery.toLowerCase()
            ))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const handleRefresh = async () => {
    await fetchAssignedCustomers();
  };

  const handleMarkAsDone = async (customerId) => {
    const confirm = () => {
      if (Platform.OS === "web") {
        return window.confirm(
          "Are you sure you want to mark this customer as done?"
        );
      } else {
        return new Promise((resolve) => {
          Alert.alert("Confirm", "Mark this customer as done?", [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Confirm", onPress: () => resolve(true) },
          ]);
        });
      }
    };

    if (!(await confirm())) return;

    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_URL}/customer/markasdone/${customerId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      const result = await response.json();

      // Update the customer in the state
      setCustomers((prevCustomers) => {
        const updated = prevCustomers.map((customer) =>
          customer._id === customerId
            ? { ...customer, CallExecutiveCall: "Done" }
            : customer
        );
        return updated.sort((a, b) => {
          // Re-sort after update
          if (
            a.assignedExecutive === executiveId &&
            a.CallExecutiveCall !== "Done" &&
            b.assignedExecutive === executiveId &&
            b.CallExecutiveCall !== "Done"
          ) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (
            a.assignedExecutive === executiveId &&
            a.CallExecutiveCall !== "Done"
          ) {
            return -1;
          }
          if (
            b.assignedExecutive === executiveId &&
            b.CallExecutiveCall !== "Done"
          ) {
            return 1;
          }
          if (
            a.CallExecutiveCall !== "Done" &&
            b.CallExecutiveCall !== "Done"
          ) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (a.CallExecutiveCall !== "Done") {
            return -1;
          }
          if (b.CallExecutiveCall !== "Done") {
            return 1;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });

      setFilteredCustomers((prevCustomers) => {
        const updated = prevCustomers.map((customer) =>
          customer._id === customerId
            ? { ...customer, CallExecutiveCall: "Done" }
            : customer
        );
        return updated.sort((a, b) => {
          if (
            a.assignedExecutive === executiveId &&
            a.CallExecutiveCall !== "Done" &&
            b.assignedExecutive === executiveId &&
            b.CallExecutiveCall !== "Done"
          ) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (
            a.assignedExecutive === executiveId &&
            a.CallExecutiveCall !== "Done"
          ) {
            return -1;
          }
          if (
            b.assignedExecutive === executiveId &&
            b.CallExecutiveCall !== "Done"
          ) {
            return 1;
          }
          if (
            a.CallExecutiveCall !== "Done" &&
            b.CallExecutiveCall !== "Done"
          ) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (a.CallExecutiveCall !== "Done") {
            return -1;
          }
          if (b.CallExecutiveCall !== "Done") {
            return 1;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });

      Alert.alert("Success", "Customer marked as done");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", error.message || "Failed to update customer status");
    }
  };

  const handleCallCustomer = async (mobileNumber) => {
    try {
      const callLog = {
        number: mobileNumber,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `callLog_${mobileNumber}`,
        JSON.stringify(callLog)
      );

      const url = `tel:${mobileNumber}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error initiating call:", error);
      Alert.alert("Error", "Could not initiate call");
    }
  };

  const selectImageFromGallery = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPhoto(imageUrl);
            setFile(file);
          }
        };
        input.click();
      } else {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
          Alert.alert("Permission is required to upload a photo.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error selecting image from gallery:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Camera permission is required to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditedCustomer({
      FullName: customer.FullName,
      District: customer.District,
      Contituency: customer.Contituency,
      MobileNumber: customer.MobileNumber,
      MyRefferalCode: customer.MyRefferalCode,
      Occupation: customer.Occupation || "",
    });
    setPhoto(customer.photo ? `${API_URL}${customer.photo}` : null);

    if (customer.District) {
      const district = districts.find(
        (d) => d.parliament === customer.District
      );
      setConstituencies(district?.assemblies || []);
    }
    setEditModalVisible(true);
  };

  const handleDistrictChange = (district) => {
    setEditedCustomer({
      ...editedCustomer,
      District: district,
      Contituency: "",
    });
    const districtData = districts.find((d) => d.parliament === district);
    setConstituencies(districtData?.assemblies || []);
  };

  const handleSaveEditedCustomer = async () => {
    if (!editedCustomer.FullName || !editedCustomer.MobileNumber) {
      Alert.alert("Error", "Full Name and Mobile Number are required");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAuthToken();
      const formData = new FormData();

      formData.append("FullName", editedCustomer.FullName);
      formData.append("District", editedCustomer.District);
      formData.append("Contituency", editedCustomer.Contituency);
      formData.append("MobileNumber", editedCustomer.MobileNumber);
      formData.append("MyRefferalCode", editedCustomer.MyRefferalCode);
      formData.append("Occupation", editedCustomer.Occupation);

      if (photo) {
        if (Platform.OS === "web") {
          if (file) {
            formData.append("photo", file);
          } else if (typeof photo === "string" && photo.startsWith("blob:")) {
            const response = await fetch(photo);
            const blob = await response.blob();
            const file = new File([blob], "photo.jpg", { type: blob.type });
            formData.append("photo", file);
          }
        } else {
          const localUri = photo;
          const filename = localUri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image";

          formData.append("photo", {
            uri: localUri,
            name: filename,
            type,
          });
        }
      }

      const response = await fetch(
        `${API_URL}/customer/updatecustomer/${selectedCustomer._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to update customer");

      const updatedCustomer = await response.json();

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer._id === selectedCustomer._id
            ? updatedCustomer.data
            : customer
        )
      );
      setFilteredCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer._id === selectedCustomer._id
            ? updatedCustomer.data
            : customer
        )
      );

      setEditModalVisible(false);
      Alert.alert("Success", "Customer updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", error.message || "Failed to update customer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = (customerId) => {
    const confirmDelete = () => {
      if (Platform.OS === "web") {
        return window.confirm("Are you sure you want to delete this customer?");
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this customer?",
            [
              {
                text: "Cancel",
                onPress: () => resolve(false),
                style: "cancel",
              },
              { text: "Delete", onPress: () => resolve(true) },
            ]
          );
        });
      }
    };

    confirmDelete().then(async (confirmed) => {
      if (!confirmed) return;

      try {
        const token = await getAuthToken();

        const response = await fetch(
          `${API_URL}/customer/deletecustomer/${customerId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to delete customer");

        setCustomers((prevCustomers) =>
          prevCustomers.filter((customer) => customer._id !== customerId)
        );
        setFilteredCustomers((prevCustomers) =>
          prevCustomers.filter((customer) => customer._id !== customerId)
        );
        Alert.alert("Success", "Customer deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        Alert.alert("Error", error.message || "Failed to delete customer");
      }
    });
  };

  const renderCustomerCard = (customer) => (
    <View
      key={customer._id}
      style={[
        styles.card,
        customer.CallExecutiveCall === "Done"
          ? styles.doneCard
          : styles.pendingCard,
        customer.assignedExecutive === executiveId &&
          customer.CallExecutiveCall !== "Done" &&
          styles.assignedCard,
      ]}
    >
      <Image
        source={customer.photo ? { uri: `${API_URL}${customer.photo}` } : logo1}
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        {customer.FullName && (
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>: {customer.FullName}</Text>
          </View>
        )}

        {customer.assignedExecutive &&
          customer.assignedExecutive !== executiveId && (
            <View style={styles.row}>
              <Text style={styles.label}>Assigned To</Text>
              <Text style={styles.value}>
                : {customer.CallExecutivename || "Another Executive"}
              </Text>
            </View>
          )}

        {customer.District && (
          <View style={styles.row}>
            <Text style={styles.label}>District</Text>
            <Text style={styles.value}>: {customer.District}</Text>
          </View>
        )}

        {customer.Contituency && (
          <View style={styles.row}>
            <Text style={styles.label}>Constituency</Text>
            <Text style={styles.value}>: {customer.Contituency}</Text>
          </View>
        )}

        {customer.MobileNumber && (
          <View style={styles.row}>
            <Text style={styles.label}>Mobile</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.value}>: {customer.MobileNumber}</Text>
              <TouchableOpacity
                onPress={() => handleCallCustomer(customer.MobileNumber)}
                style={styles.smallCallButton}
              >
                <Ionicons name="call" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {customer.Occupation && (
          <View style={styles.row}>
            <Text style={styles.label}>Occupation</Text>
            <Text style={styles.value}>: {customer.Occupation}</Text>
          </View>
        )}

        {customer.MyRefferalCode && (
          <View style={styles.row}>
            <Text style={styles.label}>Referral Code</Text>
            <Text style={styles.value}>: {customer.MyRefferalCode}</Text>
          </View>
        )}

        {customer.referrerDetails && (
          <View style={styles.row}>
            <Text style={styles.label}>Referred By</Text>
            <Text style={styles.value}>
              : {customer.referrerDetails.name || "Referrer"} (
              {customer.referrerDetails.phone || "N/A"})
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text
            style={[
              styles.value,
              customer.CallExecutiveCall === "Done"
                ? styles.doneStatus
                : styles.pendingStatus,
            ]}
          >
            : {customer.CallExecutiveCall === "Done" ? "Done" : "Pending"}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        {customer.CallExecutiveCall !== "Done" &&
          customer.assignedExecutive === executiveId && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => handleMarkAsDone(customer._id)}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          )}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCustomer(customer)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCustomer(customer._id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMobileView = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0000ff"]}
          />
        }
      >
        <View style={styles.mobileHeader}>
          <Text style={styles.heading}>Assigned Customers</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, mobile or referral code"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.noCustomersText}>
              {searchQuery
                ? "No matching customers found"
                : "No customers available"}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {filteredCustomers.map(renderCustomerCard)}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Customer</Text>

            <ScrollView>
              <View style={styles.uploadSection}>
                <Text style={styles.inputLabel}>Passport Size Photo</Text>
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setPhoto(null)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={selectImageFromGallery}
                    >
                      <MaterialIcons
                        name="photo-library"
                        size={24}
                        color="#555"
                      />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={takePhotoWithCamera}
                    >
                      <MaterialIcons name="camera-alt" size={24} color="#555" />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={editedCustomer.FullName}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, FullName: text })
                }
              />

              <Text style={styles.inputLabel}>Occupation</Text>
              <TextInput
                style={styles.input}
                placeholder="Occupation"
                value={editedCustomer.Occupation}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, Occupation: text })
                }
              />

              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={editedCustomer.MobileNumber}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, MobileNumber: text })
                }
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Referral Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code"
                value={editedCustomer.MyRefferalCode}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, MyRefferalCode: text })
                }
              />

              <Text style={styles.inputLabel}>District</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedCustomer.District}
                  onValueChange={handleDistrictChange}
                  style={styles.picker}
                  dropdownIconColor="#000"
                >
                  <Picker.Item label="Select District" value="" />
                  {districts.map((district) => (
                    <Picker.Item
                      key={district.parliament}
                      label={district.parliament}
                      value={district.parliament}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Constituency</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedCustomer.Contituency}
                  onValueChange={(itemValue) => {
                    setEditedCustomer({
                      ...editedCustomer,
                      Contituency: itemValue,
                    });
                  }}
                  style={styles.picker}
                  dropdownIconColor="#000"
                  enabled={!!editedCustomer.District}
                >
                  <Picker.Item label="Select Constituency" value="" />
                  {constituencies.map((constituency) => (
                    <Picker.Item
                      key={constituency.name}
                      label={constituency.name}
                      value={constituency.name}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEditedCustomer}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  const renderWebView = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.splitContainer}>
        <View style={styles.leftPanel}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              Platform.OS !== "web" ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#0000ff"]}
                />
              ) : undefined
            }
          >
            <View style={styles.header}>
              <Text style={styles.heading}>Assigned Customers</Text>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, mobile or referral code"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading customers...</Text>
              </View>
            ) : filteredCustomers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.noCustomersText}>
                  {searchQuery
                    ? "No matching customers found"
                    : "No customers available"}
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.webCardContainer}>
                {filteredCustomers.map(renderCustomerCard)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Customer</Text>

            <ScrollView>
              <View style={styles.uploadSection}>
                <Text style={styles.inputLabel}>Passport Size Photo</Text>
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setPhoto(null)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={selectImageFromGallery}
                    >
                      <MaterialIcons
                        name="photo-library"
                        size={24}
                        color="#555"
                      />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={takePhotoWithCamera}
                    >
                      <MaterialIcons name="camera-alt" size={24} color="#555" />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={editedCustomer.FullName}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, FullName: text })
                }
              />

              <Text style={styles.inputLabel}>Occupation</Text>
              <TextInput
                style={styles.input}
                placeholder="Occupation"
                value={editedCustomer.Occupation}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, Occupation: text })
                }
              />

              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={editedCustomer.MobileNumber}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, MobileNumber: text })
                }
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Referral Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code"
                value={editedCustomer.MyRefferalCode}
                onChangeText={(text) =>
                  setEditedCustomer({ ...editedCustomer, MyRefferalCode: text })
                }
              />

              <Text style={styles.inputLabel}>District</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedCustomer.District}
                  onValueChange={handleDistrictChange}
                  style={styles.picker}
                  dropdownIconColor="#000"
                >
                  <Picker.Item label="Select District" value="" />
                  {districts.map((district) => (
                    <Picker.Item
                      key={district.parliament}
                      label={district.parliament}
                      value={district.parliament}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Constituency</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedCustomer.Contituency}
                  onValueChange={(itemValue) => {
                    setEditedCustomer({
                      ...editedCustomer,
                      Contituency: itemValue,
                    });
                  }}
                  style={styles.picker}
                  dropdownIconColor="#000"
                  enabled={!!editedCustomer.District}
                >
                  <Picker.Item label="Select Constituency" value="" />
                  {constituencies.map((constituency) => (
                    <Picker.Item
                      key={constituency.name}
                      label={constituency.name}
                      value={constituency.name}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEditedCustomer}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  return isMobile ? renderMobileView() : renderWebView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  splitContainer: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noCustomersText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  refreshButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  webCardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    width: Platform.OS === "web" ? "32%" : "100%",
  },
  assignedCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  doneCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  pendingCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: "#ddd",
    alignSelf: "center",
  },
  infoContainer: {
    width: "100%",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    width: "100%",
  },
  label: {
    fontWeight: "bold",
    fontSize: 14,
    width: 120,
    color: "#555",
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  doneStatus: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  pendingStatus: {
    color: "#F44336",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: width > 600 ? "50%" : "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: height * 0.9,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    marginRight: 10,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadSection: {
    width: "100%",
    marginBottom: 15,
  },
  photoContainer: {
    alignItems: "center",
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  uploadOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  uploadButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    width: "45%",
  },
  uploadButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: "#555",
  },
  removeButton: {
    backgroundColor: "#ff4444",
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallCallButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    padding: 3,
    marginLeft: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
