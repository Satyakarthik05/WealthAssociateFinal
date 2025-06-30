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
  Pressable,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 450;

const AddNRIMember = ({ closeModal }) => {
  const fontsLoaded = useFontsLoader();
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    locality: "",
    indianLocation: "",
    occupation: "",
    mobileIN: "",
    mobileCountryNo: "",
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
  const [countries, setCountries] = useState([
    { label: "United Arab Emirates", value: "uae" },
    { label: "United States of America", value: "usa" },
    { label: "Saudi Arabia", value: "saudi_arabia" },
    { label: "Canada", value: "canada" },
    { label: "United Kingdom", value: "uk" },
    { label: "Australia", value: "australia" },
    { label: "Kuwait", value: "kuwait" },
    { label: "Qatar", value: "qatar" },
    { label: "Oman", value: "oman" },
    { label: "Singapore", value: "singapore" },
  ]);

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
      case "country":
        setFilteredData(countries);
        break;
      case "indianLocation":
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
      case "country":
        setFilteredData(
          countries.filter((item) =>
            item.label.toLowerCase().includes(text.toLowerCase())
          )
        );
        break;
      case "indianLocation":
        const assemblies = constituencies.flatMap(
          (district) => district.assemblies
        );
        setFilteredData(
          assemblies.filter((item) =>
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
      case "country":
        handleInputChange("country", item.label);
        break;
      case "indianLocation":
        handleInputChange("indianLocation", item.name);
        break;
    }
    setBottomSheetVisible(false);
  };

  const handleAddMember = async () => {
    const {
      name,
      country,
      locality,
      indianLocation,
      occupation,
      mobileIN,
      mobileCountryNo,
    } = formData;

    if (
      !name ||
      !country ||
      !locality ||
      !indianLocation ||
      !occupation ||
      !mobileIN ||
      !mobileCountryNo
    ) {
      Alert.alert("Error", "Please fill all the fields");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const addedByValue =
      userDetails.MobileNumber ||
      userDetails.MobileIN ||
      userDetails.Number ||
      "Wealthassociate";

    try {
      const response = await fetch(`${API_URL}/nri/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Name: name,
          Country: country,
          Locality: locality,
          IndianLocation: indianLocation,
          Occupation: occupation,
          MobileIN: mobileIN,
          MobileCountryNo: mobileCountryNo,
          AddedBy: addedByValue,
          RegisteredBy: "Wealth",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        navigation.goBack();
      } else {
        setErrorMessage(data.message || "Failed to add NRI member");
      }
    } catch (error) {
      console.error("Error adding NRI member:", error);
      setErrorMessage("Failed to connect to server");
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
        {bottomSheetType === "country" ? item.label : item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBottomSheet = () => {
    let title = "";
    switch (bottomSheetType) {
      case "country":
        title = "Select Country";
        break;
      case "indianLocation":
        title = "Select Location in India";
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
                    bottomSheetType === "country"
                      ? item.value
                      : `${item.code}-${index}`
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
          <Text style={styles.title}>Add NRI Member</Text>
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
                    placeholder="Enter full name"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.name}
                    onChangeText={(text) => handleInputChange("name", text)}
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
                <Text style={styles.label}>Country</Text>
                <TouchableOpacity onPress={() => openBottomSheet("country")}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select country"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.country}
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
                <Text style={styles.label}>Locality (Abroad)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. Dallas"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.locality}
                    onChangeText={(text) => handleInputChange("locality", text)}
                  />
                  <MaterialIcons
                    name="location-city"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location in India</Text>
                <TouchableOpacity
                  onPress={() => openBottomSheet("indianLocation")}
                >
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex. Vijayawada"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={formData.indianLocation}
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
                <Text style={styles.label}>Occupation</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. Software Engineer"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={formData.occupation}
                    onChangeText={(text) =>
                      handleInputChange("occupation", text)
                    }
                  />
                  <MaterialIcons
                    name="work"
                    size={20}
                    color="#3E5C76"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile IN (WhatsApp No.)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. 9063392872"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    keyboardType="phone-pad"
                    value={formData.mobileIN}
                    onChangeText={(text) => handleInputChange("mobileIN", text)}
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
                <Text style={styles.label}>
                  Mobile Country No (WhatsApp No.)
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. 9063392872"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    keyboardType="phone-pad"
                    value={formData.mobileCountryNo}
                    onChangeText={(text) =>
                      handleInputChange("mobileCountryNo", text)
                    }
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleAddMember}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Add Member</Text>
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
    fontSize: 20,
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
  // Bottom sheet styles (copied from Register_screen)
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
    fontSize: 20,
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

export default AddNRIMember;
