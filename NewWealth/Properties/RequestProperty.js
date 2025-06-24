import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import { useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const { width, height } = Dimensions.get("window");

const RequestedPropertyForm = ({ closeModal }) => {
  const fontsLoaded = useFontsLoader();
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [islocation, setlocation] = useState("");
  const [Details, setDetails] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [propertyTypeSearch, setPropertyTypeSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("");
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { width } = useWindowDimensions();
  const isMobileView = Platform.OS !== "web" || width < 450;
  const navigation = useNavigation();
  const propertyTypeInputRef = useRef(null);
  const locationInputRef = useRef(null);

  // Fetch user details and user type
  const getDetails = async () => {
    try {
      const [token, storedUserType] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userType"),
      ]);

      setUserType(storedUserType);

      if (!token) return;

      let endpoint = "";
      switch (storedUserType) {
        case "WealthAssociate":
        case "ReferralAssociate":
          endpoint = `${API_URL}/agent/AgentDetails`;
          break;
        case "Customer":
          endpoint = `${API_URL}/customer/getcustomer`;
          break;
        case "CoreMember":
          endpoint = `${API_URL}/core/getcore`;
          break;
        case "Investor":
          endpoint = `${API_URL}/investors/getinvestor`;
          break;
        case "NRI":
          endpoint = `${API_URL}/nri/getnri`;
          break;
        case "SkilledResource":
          endpoint = `${API_URL}/skillLabour/getskilled`;
          break;
        default:
          endpoint = `${API_URL}/agent/AgentDetails`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      const newDetails = await response.json();
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  // Fetch property types from backend
  const fetchPropertyTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/discons/propertytype`);
      const data = await response.json();
      setPropertyTypes(data);
    } catch (error) {
      console.error("Error fetching property types:", error);
    }
  };

  // Fetch constituencies data
  const fetchConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setConstituencies(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getDetails();
    fetchPropertyTypes();
    fetchConstituencies();
  }, []);

  // Filter functions for dropdowns
  const filteredPropertyTypes = propertyTypes.filter((item) =>
    item.name.toLowerCase().includes(propertyTypeSearch.toLowerCase())
  );

  const filteredLocations = constituencies.flatMap((item) =>
    item.assemblies.filter((assembly) =>
      assembly.name.toLowerCase().includes(locationSearch.toLowerCase())
    )
  );

  // Handle form submission
  const handleSubmit = async () => {
    if (!propertyTitle || !propertyType || !location || !budget) {
      Alert.alert("Error", "Please fill all the fields.");
      return;
    }

    const requestData = {
      propertyTitle,
      propertyType,
      location,
      islocation,
      Budget: budget,
      userType,
    };

    // Add user identifier based on user type
    if (userType === "WealthAssociate" || userType === "ReferralAssociate") {
      requestData.PostedBy = Details.MobileNumber;
    } else if (userType === "Customer") {
      requestData.PostedBy = Details.MobileNumber;
    } else if (userType === "CoreMember") {
      requestData.PostedBy = Details.MobileNumber;
    } else if (userType === "Investor") {
      requestData.PostedBy = Details.MobileNumber;
    } else if (userType === "NRI") {
      requestData.PostedBy = Details.MobileIN;
    } else if (userType === "SkilledResource") {
      requestData.PostedBy = Details.MobileNumber;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/requestProperty/requestProperty`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", result.message);
        navigation.goBack();
      } else {
        Alert.alert("Error", result.message || "Failed to request property.");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render dropdown items
  const renderPropertyTypeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setPropertyType(item.name);
        setShowPropertyTypeModal(false);
        setPropertyTypeSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setLocation(item.name);
        setShowLocationModal(false);
        setLocationSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#D8E3E7" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 60,
            minHeight: "100%",
            paddingBottom: 120,
            alignItems: "center",
            backgroundColor: "#D8E3E7",
          }}
          style={{
            flex: 1,
            backgroundColor: "#D8E3E7",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Request a Property</Text>
          <View
            style={[
              styles.formContainer,
              {
                width: isMobileView ? "90%" : "40%",
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 10,
                elevation: 5,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            {/* Property Type Input */}
            <Text style={styles.label}>Property Type</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowPropertyTypeModal(true)}
            >
              <TextInput
                ref={propertyTypeInputRef}
                style={styles.input}
                placeholder="Search Property Type"
                placeholderTextColor="rgba(25, 25, 25, 0.5)"
                value={propertyType}
                editable={false}
                pointerEvents="none"
              />
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color="#E82E5F"
                style={styles.icon}
              />
            </TouchableOpacity>

            {/* Location Input */}
            <Text style={styles.label}>Location (Constituency)</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowLocationModal(true)}
            >
              <TextInput
                ref={locationInputRef}
                style={styles.input}
                placeholder="Ex. Vijayawada"
                value={location}
                editable={false}
                pointerEvents="none"
              />
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color="#E82E5F"
                style={styles.icon}
              />
            </TouchableOpacity>

            {/* Property Location Input */}
            <Text style={styles.label}>Property Location (Area/Landmark)</Text>
            <TextInput
              style={styles.input}
              placeholder="BhavaniPuram"
              placeholderTextColor="rgba(25, 25, 25, 0.5)"
              value={islocation}
              onChangeText={setlocation}
            />

            {/* Budget Input */}
            <Text style={styles.label}>Budget</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your budget"
              placeholderTextColor="rgba(25, 25, 25, 0.5)"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />

            {/* Property Title Input */}
            <Text style={styles.label}>Property Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex. Need 10 acres land"
              placeholderTextColor="rgba(25, 25, 25, 0.5)"
              value={propertyTitle}
              onChangeText={setPropertyTitle}
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.postButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>Request</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Property Type Modal */}
      <Modal
        visible={showPropertyTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPropertyTypeModal(false)}
      >
        <View style={styles.modalOuterContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Property Type</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search property types..."
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={setPropertyTypeSearch}
                    value={propertyTypeSearch}
                    autoFocus={true}
                  />
                  <MaterialIcons
                    name="search"
                    size={24}
                    color="#E82E5F"
                    style={styles.searchIcon}
                  />
                </View>
                <FlatList
                  data={filteredPropertyTypes}
                  renderItem={renderPropertyTypeItem}
                  keyExtractor={(item) => item.code}
                  style={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowPropertyTypeModal(false);
                    setPropertyTypeSearch("");
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOuterContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search locations..."
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={setLocationSearch}
                    value={locationSearch}
                    autoFocus={true}
                  />
                  <MaterialIcons
                    name="search"
                    size={24}
                    color="#E82E5F"
                    style={styles.searchIcon}
                  />
                </View>
                <FlatList
                  data={filteredLocations}
                  renderItem={renderLocationItem}
                  keyExtractor={(item, index) => index.toString()}
                  style={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowLocationModal(false);
                    setLocationSearch("");
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Platform.OS === "android" || Platform.OS === "ios" ? "100%" : "40%",
    borderRadius: 5,
    paddingBottom: 40,
    padding: 30,
    paddingRight: 30,
    backgroundColor: "#D8E3E7",
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: "10%",
    height: "100vh",
  },
  title: {
    fontSize: 21,
    fontWeight: "400",
    textAlign: "center",
    color: "#2B2D42",
    backgroundColor: "#D8E3E7",
    width: "115%",
    left: -21,
    height: 45,
    top: 0,
    borderRadius: 20,
    display: "flex",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    fontFamily: "OpenSanssemibold",
  },
  formContainer: {
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    width: "100%",
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    color: "#2B2D42",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E0E6ED",
    marginBottom: 8,
    borderRadius: 25,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  inputWrapper: {
    position: "relative",
  },
  icon: {
    position: "absolute",
    right: 10,
    top: 13,
    color: "#3E5C76",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 11,
  },
  postButton: {
    flex: 1,
    marginRight: 14,
    backgroundColor: "#3E5C76",
    borderRadius: 25,
    paddingVertical: 14,
    elevation: 2,
  },
  postButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#3E5C76",
    borderRadius: 25,
    paddingVertical: 14,
    elevation: 2,
  },
  cancelButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#B8C2CC",
  },
  // Modal styles
  modalOuterContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalKeyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
<<<<<<< HEAD
    marginTop: Platform.OS === 'ios' ? 200 : 0,
    marginBottom:Platform.OS==="ios" ? "-10%":"",
=======
    marginTop: Platform.OS === "ios" ? 200 : 0,
    marginBottom: Platform.OS === "ios" ? "-10%" : "",
>>>>>>> 58ec7f3d70143606abf2c2d4379b45bfb41feb43
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2B2D42",
    fontFamily: "Roboto-Bold",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 15,
  },
  searchInput: {
    width: "100%",
    height: 40,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    fontFamily: "Roboto-Regular",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: 8,
    color: "#3E5C76",
  },
  modalList: {
    marginBottom: 15,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listItemText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
  },
  closeButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto-Bold",
  },
});

export default RequestedPropertyForm;
