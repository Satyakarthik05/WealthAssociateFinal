import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import logo1 from "../../assets/man.png";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isSmallWeb = isWeb && width < 450; // Check for small web screens

export default function ViewCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [userType, setUserType] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserTypeAndCustomers = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem("userType");
        const storedUserTypeValue = await AsyncStorage.getItem("userTypevalue");

        const currentUserType =
          storedUserTypeValue === "ValueAssociate"
            ? "ValueAssociate"
            : storedUserType || "";

        setUserType(currentUserType);
        await fetchCustomers(currentUserType);
      } catch (error) {
        console.error("Error fetching user type:", error);
        setLoading(false);
      }
    };
    fetchUserTypeAndCustomers();
  }, []);

  const fetchCustomers = async (type = userType) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        setLoading(false);
        return;
      }

      let endpoint = "";
      switch (type) {
        case "WealthAssociate":
        case "ReferralAssociate":
          endpoint = `${API_URL}/customer/myCustomers`;
          break;
        case "CoreMember":
          endpoint = `${API_URL}/core/mycustomers`;
          break;
        default:
          endpoint = `${API_URL}/customer/getmycustomer`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      const data = await response.json();

      if (type === "WealthAssociate" || type === "ReferralAssociate") {
        setCustomers(data?.referredAgents || []);
      } else if (type === "CoreMember") {
        setCustomers(data?.referredAgents || []);
      } else {
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId, customerName) => {
    const confirmDelete = async () => {
      if (Platform.OS === "web") {
        return window.confirm(`Are you sure you want to delete ${customerName}?`);
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete ${customerName}?`,
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

    try {
      const confirmed = await confirmDelete();
      if (!confirmed) return;

      setDeletingId(customerId);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        return;
      }

      const response = await fetch(
        `${API_URL}/customer/deletecustomer/${customerId}`,
        {
          method: "DELETE",
          headers: {
            token: `${token}` || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      setCustomers(prevCustomers => 
        prevCustomers.filter(customer => customer._id !== customerId)
      );
      Alert.alert("Success", "Customer deleted successfully");
    } catch (error) {
      console.error("Error deleting customer:", error);
      Alert.alert("Error", "Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCustomerPress = (customer) => {
    if (userType !== "ValueAssociate") return;
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  const renderCustomerCards = () => {
    if (isWeb) {
      return (
        <View style={styles.webGrid}>
          {customers.map((customer) => (
            <CustomerCard 
              key={customer._id} 
              customer={customer} 
              onPress={handleCustomerPress}
              onDelete={handleDelete}
              userType={userType}
              deletingId={deletingId}
            />
          ))}
        </View>
      );
    } else {
      return customers.map((customer) => (
        <CustomerCard 
          key={customer._id} 
          customer={customer} 
          onPress={handleCustomerPress}
          onDelete={handleDelete}
          userType={userType}
          deletingId={deletingId}
        />
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>
          My Customers: {customers.length > 0 ? customers.length : "0"}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3E5C76"
            style={styles.loader}
          />
        ) : customers.length > 0 ? (
          <View style={styles.gridContainer}>
            {renderCustomerCards()}
          </View>
        ) : (
          <Text style={styles.noCustomersText}>
            {userType === "CoreMember" ||
            userType === "WealthAssociate" ||
            userType === "ReferralAssociate" ||
            userType === "ValueAssociate"
              ? "No customers found."
              : "This feature is only available for Core Members and Associates."}
          </Text>
        )}
      </ScrollView>

      {/* Modal for Value Associate */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {selectedCustomer?.FullName}'s Details
            </Text>

            {selectedCustomer ? (
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Mobile:</Text>
                  <Text style={styles.statValue}>
                    {selectedCustomer.MobileNumber || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Occupation:</Text>
                  <Text style={styles.statValue}>
                    {selectedCustomer.Occupation || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Referral Code:</Text>
                  <Text style={styles.statValue}>
                    {selectedCustomer.MyRefferalCode || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>District:</Text>
                  <Text style={styles.statValue}>
                    {selectedCustomer.District || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Constituency:</Text>
                  <Text style={styles.statValue}>
                    {selectedCustomer.Contituency || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Location:</Text>
                  <Text style={styles.statValue}>
                    {selectedCustomer.Locations || "N/A"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noStatsText}>
                No customer details available
              </Text>
            )}

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CustomerCard = ({ customer, onPress, onDelete, userType, deletingId }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(customer)}
      activeOpacity={userType === "ValueAssociate" ? 0.6 : 1}
    >
      <View style={styles.cardHeader}>
        <Image source={logo1} style={styles.avatar} />
        <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">
          {customer.FullName}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile:</Text>
          <Text style={styles.infoValue}>{customer.MobileNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Occupation:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {customer.Occupation}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Referral Code:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {customer.MyRefferalCode}
          </Text>
        </View>
        
        {userType !== "WealthAssociate" &&
          userType !== "ReferralAssociate" &&
          userType !== "CoreMember" && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>District:</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                  {customer.District}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Constituency:</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                  {customer.Contituency}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                  {customer.Locations}
                </Text>
              </View>
            </>
          )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(customer._id, customer.FullName)}
        disabled={deletingId === customer._id}
      >
        {deletingId === customer._id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Customer</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 90,
    borderRadius: 30
  },
  scrollContainer: {
    width: "100%",
    paddingHorizontal: isSmallWeb ? 5 : (isWeb ? 20 : 10),
  },
  loader: {
    marginTop: 40,
  },
  heading: {
    fontSize: isSmallWeb ? 20 : 24,
    fontWeight: "bold",
    color: "#3E5C76",
    marginVertical: 20,
    marginLeft: isWeb ? (isSmallWeb ? 5 : 10) : 0,
  },
  gridContainer: {
    width: "100%",
  },
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginLeft: isWeb ? (isSmallWeb ? -5 : -10) : 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: isWeb ? (isSmallWeb ? "90%" : "31%") : "88%",
    margin: isWeb ? (isSmallWeb ? 5 : 10) : 15,
    padding: isSmallWeb ? 12 : 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  avatar: {
    width: isSmallWeb ? 50 : 60,
    height: isSmallWeb ? 50 : 60,
    borderRadius: isSmallWeb ? 25 : 30,
    marginRight: isSmallWeb ? 10 : 15,
    backgroundColor: "#f0f0f0",
  },
  customerName: {
    fontSize: isSmallWeb ? 16 : 18,
    fontWeight: "600",
    color: "#3E5C76",
    flexShrink: 1,
    maxWidth: isSmallWeb ? width - 180 : width - 200,
  },
  infoContainer: {
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: isSmallWeb ? 12 : 14,
    color: "#6c757d",
    fontWeight: "500",
    flexShrink: 1,
  },
  infoValue: {
    fontSize: isSmallWeb ? 12 : 14,
    color: "#495057",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "50%",
  },
  noCustomersText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: isSmallWeb ? 14 : 16,
    color: "#6c757d",
    width: "100%",
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: "#e63946",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    width: "100%"
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isSmallWeb ? 12 : 14,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: isSmallWeb ? 15 : 25,
    width: "80%",
    maxWidth: isSmallWeb ? 350 : 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: isSmallWeb ? 18 : 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#3E5C76",
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    marginTop: 20,
  },
  buttonClose: {
    backgroundColor: "#3E5C76",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: isSmallWeb ? 14 : 16,
  },
  statsContainer: {
    width: "100%",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statLabel: {
    fontWeight: "bold",
    fontSize: isSmallWeb ? 14 : 16,
    color: "#495057",
  },
  statValue: {
    fontSize: isSmallWeb ? 14 : 16,
    color: "#3E5C76",
  },
  noStatsText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: isSmallWeb ? 14 : 16,
    color: "#6c757d",
  },
});