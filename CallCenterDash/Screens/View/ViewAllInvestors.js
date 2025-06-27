import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
} from "react-native";
import { API_URL } from "../../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function ViewAllInvesters() {
  const [investors, setInvestors] = useState([]);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [formData, setFormData] = useState({
    FullName: "",
    MobileNumber: "",
    Location: "",
    CallStatus: "",
  });
  const [filters, setFilters] = useState({
    location: "",
    callStatus: "",
  });
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [executiveId, setExecutiveId] = useState(null);
  const [executiveName, setExecutiveName] = useState("");

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
    fetchAssignedInvestors();
  }, []);

  const fetchAssignedInvestors = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/agent/assignedinves/${executiveId}`,
        {
          method: "GET",
          headers: {
            token: token || "",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch investors");

      const data = await response.json();

      if (!Array.isArray(data.data)) {
        throw new Error("Invalid data format received from server");
      }

      // Sort investors: first show pending investors assigned to current executive, then others
      const sortedData = data.data.sort((a, b) => {
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
        if (a.assignedExecutive === executiveId && a.CallExecutiveCall !== "Done") {
          return -1;
        }
        // B is assigned to current executive and pending
        if (b.assignedExecutive === executiveId && b.CallExecutiveCall !== "Done") {
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

      setInvestors(sortedData);
      setFilteredInvestors(sortedData);

      const locations = [
        ...new Set(data.data.map((item) => item.Location)),
      ];
      setUniqueLocations(locations);
    } catch (error) {
      console.error("Error fetching investors:", error);
      Alert.alert("Error", error.message || "Failed to fetch investors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInvestors(investors);
    } else {
      const filtered = investors.filter(
        (investor) =>
          (investor.FullName &&
            investor.FullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (investor.MobileNumber && investor.MobileNumber.includes(searchQuery))
      );
      setFilteredInvestors(filtered);
    }
  }, [searchQuery, investors]);

  useEffect(() => {
    let result = [...investors];

    if (filters.location) {
      result = result.filter((item) => item.Location === filters.location);
    }

    if (filters.callStatus) {
      if (filters.callStatus === "Done") {
        result = result.filter((item) => item.CallStatus === "Done");
      } else {
        result = result.filter(
          (item) => !item.CallStatus || item.CallStatus !== "Done"
        );
      }
    }

    setFilteredInvestors(result);
  }, [filters, investors]);

  const handleMarkAsDone = async (id) => {
    try {
      const confirm = await new Promise((resolve) => {
        if (Platform.OS === "web") {
          const result = window.confirm("Mark this call as done?");
          resolve(result);
        } else {
          Alert.alert(
            "Confirm",
            "Mark this call as done?",
            [
              {
                text: "Cancel",
                onPress: () => resolve(false),
                style: "cancel",
              },
              { text: "Confirm", onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        }
      });

      if (!confirm) return;

      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/investors/markasdone/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token: token || "",
        },
        body: JSON.stringify({ CallStatus: "Done" }),
      });

      if (response.ok) {
        fetchAssignedInvestors();
        Alert.alert("Success", "Call marked as done");
      } else {
        throw new Error("Failed to update call status");
      }
    } catch (error) {
      console.error("Error marking as done:", error);
      Alert.alert("Error", error.message || "Failed to update call status");
    }
  };

  const handleCallInvestor = async (mobileNumber) => {
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

  const handleDelete = async (id) => {
    try {
      const confirm = await new Promise((resolve) => {
        Alert.alert(
          "Confirm",
          "Are you sure you want to delete this investor?",
          [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Delete", onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirm) return;

      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/investors/delete/${id}`, {
        method: "DELETE",
        headers: {
          token: `${token}` || "",
        },
      });

      if (response.ok) {
        setInvestors((prev) => prev.filter((investor) => investor._id !== id));
        setFilteredInvestors((prev) => prev.filter((investor) => investor._id !== id));
        Alert.alert("Success", "Investor deleted successfully");
      } else {
        throw new Error("Failed to delete investor");
      }
    } catch (error) {
      console.error("Error deleting investor:", error);
      Alert.alert("Error", error.message || "Failed to delete investor");
    }
  };

  const handleEdit = (investor) => {
    setSelectedInvestor(investor);
    setFormData({
      FullName: investor.FullName,
      MobileNumber: investor.MobileNumber,
      Location: investor.Location,
      CallStatus: investor.CallStatus || "",
    });
    setEditModalVisible(true);
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(
        `${API_URL}/investors/update/${selectedInvestor._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: `${token}` || "",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        fetchAssignedInvestors();
        setEditModalVisible(false);
        Alert.alert("Success", "Investor updated successfully");
      } else {
        throw new Error("Failed to update investor");
      }
    } catch (error) {
      console.error("Error updating investor:", error);
      Alert.alert("Error", error.message || "Failed to update investor");
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => {
    setFilters({
      location: "",
      callStatus: "",
    });
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
  };

  const handleRefresh = () => {
    fetchAssignedInvestors();
  };

  const renderInvestorCard = (item) => (
    <View
      key={item._id}
      style={[
        styles.card,
        item.CallStatus === "Done" ? styles.doneCard : styles.pendingCard,
        item.assignedExecutive === executiveId &&
          item.CallStatus !== "Done" &&
          styles.assignedCard,
      ]}
    >
      <Image source={require("../../../assets/man.png")} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>: {item.FullName}</Text>
        </View>

        {item.assignedExecutive && item.assignedExecutive !== executiveId && (
          <View style={styles.row}>
            <Text style={styles.label}>Assigned To</Text>
            <Text style={styles.value}>
              : {item.CallExecutivename || "Another Executive"}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.value}>: {item.MobileNumber}</Text>
            <TouchableOpacity
              onPress={() => handleCallInvestor(item.MobileNumber)}
              style={styles.smallCallButton}
            >
              <Ionicons name="call" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>: {item.Location}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>referredBy</Text>
          <Text style={styles.value}>: {item.referrerDetails?.name || "Wealth Associate"}({item.referrerDetails?.phone || "7796356789"})</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text
            style={[
              styles.value,
              item.CallStatus === "Done"
                ? styles.doneStatus
                : styles.pendingStatus,
            ]}
          >
            : {item.CallStatus === "Done" ? "Done" : "Pending"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {item.CallStatus !== "Done" &&
            item.assignedExecutive === executiveId && (
              <TouchableOpacity
                style={[styles.button, styles.doneButton]}
                onPress={() => handleMarkAsDone(item._id)}
              >
                <Text style={styles.buttonText}>Call Done</Text>
              </TouchableOpacity>
            )}
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDelete(item._id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>All Investors</Text>
        <View style={styles.headerActions}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0000ff"]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : filteredInvestors.length > 0 ? (
          <View style={width > 600 ? styles.rowWrapper : null}>
            {filteredInvestors.map((item) => renderInvestorCard(item))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No investors found.</Text>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Investor</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.FullName}
              onChangeText={(text) => handleChange("FullName", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={formData.MobileNumber}
              onChangeText={(text) => handleChange("MobileNumber", text)}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={formData.Location}
              onChangeText={(text) => handleChange("Location", text)}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Investors</Text>

            <Text style={styles.filterLabel}>Call Status:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.callStatus === "" && styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterChange("callStatus", "")}
              >
                <Text style={styles.filterOptionText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.callStatus === "Done" && styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterChange("callStatus", "Done")}
              >
                <Text style={styles.filterOptionText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.callStatus === "Pending" &&
                    styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterChange("callStatus", "Pending")}
              >
                <Text style={styles.filterOptionText}>Pending</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Location:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.location === "" && styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterChange("location", "")}
              >
                <Text style={styles.filterOptionText}>All Locations</Text>
              </TouchableOpacity>
              {uniqueLocations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.filterOption,
                    filters.location === location &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterChange("location", location)}
                >
                  <Text style={styles.filterOptionText}>{location}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={resetFilters}
              >
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={applyFilters}
              >
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 10,
  },
  header: {
    paddingVertical: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingLeft: 10,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  filterButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  gridContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  rowWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width > 600 ? "35%" : "100%",
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 15,
    left: 25
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
  },
  infoContainer: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    width: "100%",
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
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: width > 600 ? "60%" : "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    flex: 1,
    marginLeft: 10,
  },
  filterLabel: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  filterOption: {
    padding: 8,
    margin: 4,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
  },
  selectedFilterOption: {
    backgroundColor: "#2196F3",
  },
  filterOptionText: {
    color: "#000",
  },
});