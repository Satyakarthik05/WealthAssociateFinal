import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 450;

const AddInvestor = ({ closeModal }) => {
  const fontsLoaded = useFontsLoader();
  const [formData, setFormData] = useState({
    fullName: "",
    skill: "",
    location: "",
    mobileNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [userType, setUserType] = useState("");
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [constituencies, setConstituencies] = useState([]);
  const [skills, setSkills] = useState(["Land Lord", "Investor"]);

  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchUserDetails = async () => {
    try {
      const [token, storedUserType] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userType"),
      ]);

      if (!token || !storedUserType) return;

      setUserType(storedUserType);

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
        case "CallCenter":
          endpoint = `${API_URL}/callcenter/getcallcenter`;
          break;
        default:
          endpoint = `${API_URL}/agent/AgentDetails`;
      }

      const response = await fetch(endpoint, {
        headers: { token },
      });

      if (!response.ok) throw new Error("Failed to fetch user details");

      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setConstituencies(data);
    } catch (error) {
      console.error("Error fetching constituencies:", error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchConstituencies();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openBottomSheet = (type) => {
    Keyboard.dismiss();
    setBottomSheetType(type);
    setSearchTerm("");

    switch (type) {
      case "skill":
        setFilteredData(skills);
        break;
      case "location":
        const assemblies = constituencies.flatMap(
          (district) => district.assemblies
        );
        setFilteredData(assemblies);
        break;
      default:
        setFilteredData([]);
    }

    setBottomSheetVisible(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);

    switch (bottomSheetType) {
      case "skill":
        setFilteredData(
          skills.filter((item) =>
            item.toLowerCase().includes(text.toLowerCase())
          )
        );
        break;
      case "location":
        const assemblies = constituencies.flatMap(
          (district) => district.assemblies
        );
        setFilteredData(
          assemblies.filter((item) =>
            item.name.toLowerCase().includes(text.toLowerCase())
        ));
        break;
      default:
        setFilteredData([]);
    }
  };

  const handleSelectItem = (item) => {
    switch (bottomSheetType) {
      case "skill":
        handleInputChange("skill", item);
        break;
      case "location":
        handleInputChange("location", item.name);
        break;
    }
    setBottomSheetVisible(false);
  };

  const handleRegister = async () => {
    const { fullName, skill, location, mobileNumber } = formData;

    if (!fullName || !skill || !location || !mobileNumber) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const addedByValue =
      userDetails.MobileNumber ||
      userDetails.MobileIN ||
      userDetails.Number ||
      "Wealthassociate";

    const registeredByValue = ["WealthAssociate", "ReferralAssociate"].includes(
      userType
    )
      ? userType
      : "WealthAssociate";

    try {
      const response = await fetch(`${API_URL}/investors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FullName: fullName,
          SelectSkill: skill,
          Location: location,
          MobileNumber: mobileNumber,
          AddedBy: addedByValue,
          RegisteredBy: registeredByValue,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Registration successful");
        setFormData({
          fullName: "",
          skill: "",
          location: "",
          mobileNumber: "",
        });
        navigation.goBack();
      } else {
        setErrorMessage(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectItem(item)}
    >
      <Text style={styles.listItemText}>
        {bottomSheetType === "skill" ? item : item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBottomSheet = () => {
    let title = "";
    switch (bottomSheetType) {
      case "skill":
        title = "Select Category";
        break;
      case "location":
        title = "Select Location";
        break;
      default:
        title = "Select";
    }

    return (
      <Modal
        visible={bottomSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBottomSheetVisible(false)}
      >
        <View style={styles.modalOuterContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{title}</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={handleSearch}
                    value={searchTerm}
                    autoFocus={true}
                  />
                  <MaterialIcons
                    name="search"
                    size={24}
                    color="#3E5C76"
                    style={styles.searchIcon}
                  />
                </View>
                <FlatList
                  data={filteredData}
                  renderItem={renderItem}
                  keyExtractor={(item, index) =>
                    bottomSheetType === "skill" ? item : `${item.code}-${index}`
                  }
                  style={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setBottomSheetVisible(false);
                    setSearchTerm("");
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Register Investor</Text>
          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.fullName}
                    onChangeText={(text) => handleInputChange("fullName", text)}
                  />
                  <FontAwesome
                    name="user"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. 9063392872"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    keyboardType="phone-pad"
                    value={formData.mobileNumber}
                    onChangeText={(text) =>
                      handleInputChange(
                        "mobileNumber",
                        text.replace(/[^0-9]/g, "")
                      )
                    }
                    maxLength={10}
                  />
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Category</Text>
                <TouchableOpacity onPress={() => openBottomSheet("skill")}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select Category"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.skill}
                      editable={false}
                      pointerEvents="none"
                    />
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#3E5C76"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <TouchableOpacity onPress={() => openBottomSheet("location")}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex. Vijayawada"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.location}
                      editable={false}
                      pointerEvents="none"
                    />
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#3E5C76"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      {renderBottomSheet()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    padding: isSmallScreen ? 20 : 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: isSmallScreen ? 15 : 20,
    marginBottom: isSmallScreen ? 150 : 100,
    width: isSmallScreen ? "100%" : Platform.OS === "web" ? "80%" : "95%",
    maxWidth: 800,
  },
  title: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: "bold",
    fontFamily: "OpenSanssemibold",
    color: "Black",
    textAlign: "center",
    padding: isSmallScreen ? 10 : 15,
  },
  row: {
    flexDirection: isSmallScreen ? "column" : "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: isSmallScreen ? 10 : 15,
  },
  inputContainer: {
    width: isSmallScreen ? "100%" : "48%",
    marginBottom: isSmallScreen ? 10 : 15,
  },
  inputWrapper: {
    position: "relative",
  },
  label: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
    fontFamily: "OpenSanssemibold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    padding: isSmallScreen ? 10 : 12,
    paddingRight: 40,
    backgroundColor: "#f9f9f9",
    fontFamily: "OpenSanssemibold",
    fontSize: isSmallScreen ? 14 : 16,
  },
  inputIcon: {
    position: "absolute",
    right: 15,
    top: isSmallScreen ? 10 : 12,
  },
  dropdownIcon: {
    position: "absolute",
    right: 15,
    top: isSmallScreen ? 10 : 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: isSmallScreen ? 15 : 20,
  },
  registerButton: {
    backgroundColor: "#3E5C76",
    padding: isSmallScreen ? 10 : 12,
    borderRadius: 30,
    marginRight: isSmallScreen ? 15 : 25,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#3E5C76",
    padding: isSmallScreen ? 10 : 12,
    borderRadius: 30,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: "OpenSanssemibold",
  },
  errorContainer: {
    backgroundColor: "#ffeeee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    fontFamily: "OpenSanssemibold",
    fontSize: isSmallScreen ? 13 : 14,
  },
  // Bottom sheet styles (same as AddNRIMember)
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
    marginTop: Platform.OS === "ios" ? 200 : 0,
    marginBottom: Platform.OS === "ios" ? "-14%" : "",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2B2D42",
    fontFamily: "OpenSanssemibold",
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
    fontFamily: "OpenSanssemibold",
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
    fontFamily: "OpenSanssemibold",
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
    fontFamily: "OpenSanssemibold",
  },
});

export default AddInvestor;
