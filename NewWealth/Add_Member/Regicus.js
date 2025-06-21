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

const screenHeight = Dimensions.get("window").height;
const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 450;

const RegisterExecute = ({ closeModal }) => {
  const fontsLoaded = useFontsLoader();
  const [formData, setFormData] = useState({
    fullname: "",
    mobile: "",
    email: "",
    district: "",
    constituency: "",
    occupation: "",
    location: "",
  });
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [districts, setDistricts] = useState([]);
  const [occupationOptions, setOccupationOptions] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

      if (data.MyRefferalCode) {
        setReferralCode(data.MyRefferalCode);
      } else {
        const mobileFallback =
          data.MobileNumber || data.MobileIN || "WA0000000001";
        setReferralCode(mobileFallback);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setReferralCode("WA0000000001");
    }
  };

  const fetchDistrictsAndConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchOccupations = async () => {
    try {
      const response = await fetch(`${API_URL}/discons/occupations`);
      const data = await response.json();
      setOccupationOptions(data);
    } catch (error) {
      console.error("Error fetching occupations:", error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchDistrictsAndConstituencies();
    fetchOccupations();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "district") {
      setFormData((prev) => ({ ...prev, constituency: "" }));
    }
  };

  const openBottomSheet = (type) => {
    Keyboard.dismiss();
    setBottomSheetType(type);
    setSearchTerm("");

    switch (type) {
      case "district":
        setFilteredData(districts);
        break;
      case "constituency":
        const selectedDistrict = districts.find(
          (d) => d.parliament === formData.district
        );
        setFilteredData(selectedDistrict?.assemblies || []);
        break;
      case "occupation":
        setFilteredData(occupationOptions);
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
      case "district":
        setFilteredData(
          districts.filter((item) =>
            item.parliament.toLowerCase().includes(text.toLowerCase())
          )
        );
        break;
      case "constituency":
        const selectedDistrict = districts.find(
          (d) => d.parliament === formData.district
        );
        if (selectedDistrict) {
          setFilteredData(
            selectedDistrict.assemblies.filter((item) =>
              item.name.toLowerCase().includes(text.toLowerCase())
            )
          );
        }
        break;
      case "occupation":
        setFilteredData(
          occupationOptions.filter((item) =>
            item.name.toLowerCase().includes(text.toLowerCase())
          )
        );
        break;
      default:
        setFilteredData([]);
    }
  };

  const handleSelectItem = (item) => {
    switch (bottomSheetType) {
      case "district":
        handleInputChange("district", item.parliament);
        break;
      case "constituency":
        handleInputChange("constituency", item.name);
        break;
      case "occupation":
        handleInputChange("occupation", item.name);
        break;
    }
    setBottomSheetVisible(false);
  };

  const getRegisteredByValue = () => {
    switch (userType) {
      case "WealthAssociate":
        return "WealthAssociate";
      case "ReferralAssociate":
        return "ReferralAssociate";
      case "CallCenter":
        return "CallCenter";
      case "CoreMember":
        return "CoreMember";
      default:
        return "WealthAssociate";
    }
  };

  const handleRegister = async () => {
    const { fullname, mobile, district, constituency, location, occupation } =
      formData;

    if (
      !fullname ||
      !mobile ||
      !district ||
      !constituency ||
      !location ||
      !occupation
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const selectedDistrict = districts.find((d) => d.parliament === district);
    const selectedAssembly = selectedDistrict?.assemblies.find(
      (a) => a.name === constituency
    );

    if (!selectedDistrict || !selectedAssembly) {
      Alert.alert("Error", "Invalid district or constituency selected.");
      setIsLoading(false);
      return;
    }

    const referenceId = `${selectedDistrict.parliamentCode}${selectedAssembly.code}`;
    const registeredBy = getRegisteredByValue();

    const referredByValue =
      referralCode ||
      userDetails.MobileNumber ||
      userDetails.MobileIN ||
      "WA0000000001";

    const userData = {
      FullName: fullname,
      MobileNumber: mobile,
      District: district,
      Contituency: constituency,
      Locations: location,
      Occupation: occupation,
      ReferredBy: referredByValue,
      Password: "Wealth",
      MyRefferalCode: referenceId,
      RegisteredBY: registeredBy,
    };

    try {
      const response = await fetch(`${API_URL}/customer/CustomerRegister`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Registration successful!");
        navigation.goBack();
      } else {
        setErrorMessage(
          result.message || "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectItem(item)}
    >
      <Text style={styles.listItemText}>
        {bottomSheetType === "district"
          ? item.parliament
          : bottomSheetType === "constituency"
          ? item.name
          : item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBottomSheet = () => {
    let title = "";
    switch (bottomSheetType) {
      case "district":
        title = "Select Parliament";
        break;
      case "constituency":
        title = "Select Assembly";
        break;
      case "occupation":
        title = "Select Occupation";
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
                    bottomSheetType === "district"
                      ? item.parliament
                      : bottomSheetType === "constituency"
                      ? `${item.name}-${index}`
                      : item.code
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
          <Text style={styles.title}>Register Customer</Text>
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
                    placeholder="Full name"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.fullname}
                    onChangeText={(text) => handleInputChange("fullname", text)}
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
                    placeholder="Mobile Number"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.mobile}
                    onChangeText={(text) => handleInputChange("mobile", text)}
                    keyboardType="number-pad"
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
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange("email", text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <MaterialIcons
                    name="email"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Parliament</Text>
                <TouchableOpacity onPress={() => openBottomSheet("district")}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select Parliament"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.district}
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

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Assembly</Text>
                <TouchableOpacity
                  onPress={() => openBottomSheet("constituency")}
                  disabled={!formData.district}
                >
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        !formData.district && styles.disabledInput,
                      ]}
                      placeholder={
                        formData.district
                          ? "Select Assembly"
                          : "First select Parliament"
                      }
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.constituency}
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
                <Text style={styles.label}>Select Occupation</Text>
                <TouchableOpacity onPress={() => openBottomSheet("occupation")}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select Occupation"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.occupation}
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

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Location"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.location}
                    onChangeText={(text) => handleInputChange("location", text)}
                  />
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Referral Code</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Referral Code"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={referralCode}
                    editable={false}
                  />
                  <MaterialIcons
                    name="card-giftcard"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={isLoading}
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
  disabledInput: {
    backgroundColor: "#eee",
    color: "#999",
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
  // Bottom sheet styles (copied from AddNRIMember)
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

export default RegisterExecute;
