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
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const screenHeight = Dimensions.get("window").height;
const { width } = Dimensions.get("window");
const isSmallScreen = width < 450;

const Add_Agent = ({ closeModal }) => {
  const fontsLoaded = useFontsLoader();
  const [formData, setFormData] = useState({
    fullname: "",
    mobile: "",
    email: "",
    district: "",
    constituency: "",
    expertise: "",
    experience: "",
    location: "",
  });
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [districts, setDistricts] = useState([]);
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const searchInputRef = useRef(null);

  const experienceOptions = [
    { name: "0-1 years", code: "01" },
    { name: "1-3 years", code: "02" },
    { name: "3-5 years", code: "03" },
    { name: "5-10 years", code: "04" },
    { name: "10-15 years", code: "05" },
    { name: "15-20 years", code: "06" },
    { name: "20-25 years", code: "07" },
    { name: "25+ years", code: "08" },
  ];

  const fetchUserDetails = async () => {
    try {
      const [token, storedUserType] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userType"),
      ]);

      if (!token || !storedUserType) return;

      setUserType(storedUserType);

      let endpoint = storedUserType === "CoreMember" 
        ? `${API_URL}/core/getcore` 
        : `${API_URL}/agent/AgentDetails`;

      const response = await fetch(endpoint, {
        headers: { token },
      });

      if (!response.ok) throw new Error("Failed to fetch user details");

      const data = await response.json();
      setUserDetails(data);

      if (data.MyRefferalCode || data.ReferralCode) {
        setReferralCode(data.MyRefferalCode || data.ReferralCode);
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

  const fetchExpertise = async () => {
    try {
      const response = await fetch(`${API_URL}/discons/expertise`);
      const data = await response.json();
      setExpertiseOptions(data);
    } catch (error) {
      console.error("Error fetching expertise:", error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchDistrictsAndConstituencies();
    fetchExpertise();
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
        const selectedDistrict = districts.find(d => d.parliament === formData.district);
        setFilteredData(selectedDistrict?.assemblies || []);
        break;
      case "expertise":
        setFilteredData(expertiseOptions);
        break;
      case "experience":
        setFilteredData(experienceOptions);
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
          districts.filter(item =>
            item.parliament.toLowerCase().includes(text.toLowerCase())
          )
        );
        break;
      case "constituency":
        const selectedDistrict = districts.find(d => d.parliament === formData.district);
        if (selectedDistrict) {
          setFilteredData(
            selectedDistrict.assemblies.filter(item =>
              item.name.toLowerCase().includes(text.toLowerCase())
            )
          );
        }
        break;
      case "expertise":
        setFilteredData(
          expertiseOptions.filter(item =>
            item.name.toLowerCase().includes(text.toLowerCase())
          )
        );
        break;
      case "experience":
        setFilteredData(
          experienceOptions.filter(item =>
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
      case "expertise":
        handleInputChange("expertise", item.name);
        break;
      case "experience":
        handleInputChange("experience", item.name);
        break;
    }
    setBottomSheetVisible(false);
  };

  const handleRegister = async () => {
    const { fullname, mobile, email, district, constituency, location, expertise, experience } = formData;

    if (!fullname || !mobile || !email || !district || !constituency || !location || !expertise || !experience) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const selectedDistrict = districts.find(d => d.parliament === district);
    const selectedAssembly = selectedDistrict?.assemblies.find(a => a.name === constituency);

    if (!selectedDistrict || !selectedAssembly) {
      Alert.alert("Error", "Invalid district or constituency selected.");
      setIsLoading(false);
      return;
    }

    const referenceId = `${selectedDistrict.parliamentCode}${selectedAssembly.code}`;

    const userData = {
      FullName: fullname,
      MobileNumber: mobile,
      Email: email,
      District: district,
      Contituency: constituency,
      Locations: location,
      Expertise: expertise,
      Experience: experience,
      ReferredBy: referralCode || "WA0000000001",
      Password: "Wealth",
      MyRefferalCode: referenceId,
      AgentType: "WealthAssociate",
      valuemember: referralCode || "no",
    };

    try {
      const response = await fetch(`${API_URL}/agent/AgentRegister`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert("Success", "Registration successful!");
        navigation.goBack();
      } else if (response.status === 400) {
        setErrorMessage("Mobile number already exists.");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Something went wrong.");
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
        {bottomSheetType === "district" ? item.parliament : 
         bottomSheetType === "constituency" ? item.name : 
         item.name}
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
      case "expertise":
        title = "Select Expertise";
        break;
      case "experience":
        title = "Select Experience";
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
                    value={searchTerm}
                    onChangeText={handleSearch}
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
                  data={filteredData}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => 
                    bottomSheetType === "district" ? item.parliament : 
                    bottomSheetType === "constituency" ? `${item.name}-${index}` : 
                    item.code
                  }
                  style={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setBottomSheetVisible(false)}
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Register Wealth Associate</Text>
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
                <TouchableOpacity
                  onPress={() => openBottomSheet("district")}
                >
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
                      color="#E82E5F"
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
                      style={[styles.input, !formData.district && styles.disabledInput]}
                      placeholder={formData.district ? "Select Assembly" : "First select Parliament"}
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.constituency}
                      editable={false}
                      pointerEvents="none"
                    />
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#E82E5F"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Experience</Text>
                <TouchableOpacity
                  onPress={() => openBottomSheet("experience")}
                >
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select Experience"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.experience}
                      editable={false}
                      pointerEvents="none"
                    />
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#E82E5F"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Expertise</Text>
                <TouchableOpacity
                  onPress={() => openBottomSheet("expertise")}
                >
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select Expertise"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.expertise}
                      editable={false}
                      pointerEvents="none"
                    />
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#E82E5F"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
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
            </View>

            <View style={styles.row}>
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
                onPress={() => navigation.navigate("addmember")}
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
    height:Platform.OS==="ios" ? "100%":"",
  },
  card: {
    backgroundColor: "#FDFDFD",
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
    color:"#3E5C76",
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
    maxHeight: Dimensions.get('window').height * 0.7,
    marginTop: Platform.OS === 'ios' ? 200 : 0,
    marginBottom:Platform.OS==="ios" ? "-14%":"",
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

export default Add_Agent;