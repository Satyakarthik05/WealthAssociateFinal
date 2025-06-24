import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logo1 from "../assets/logosub.png";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const RegisterCustomer = () => {
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  const [district, setDistrict] = useState("");
  const [constituency, setConstituency] = useState("");
  const [occupation, setOccupation] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState(null);
  const [districtSearch, setDistrictSearch] = useState("");
  const [constituencySearch, setConstituencySearch] = useState("");
  const [occupationSearch, setOccupationSearch] = useState("");
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showConstituencyModal, setShowConstituencyModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [occupationOptions, setOccupationOptions] = useState([]);
  const [Details, setDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const mobileRef = useRef(null);
  const districtRef = useRef(null);
  const navigation = useNavigation();

  const filteredDistricts = districts.filter((item) =>
    item.parliament.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const filteredConstituencies = constituencies.filter((item) =>
    item.name.toLowerCase().includes(constituencySearch.toLowerCase())
  );

  const filteredOccupations = occupationOptions.filter((item) =>
    item.name.toLowerCase().includes(occupationSearch.toLowerCase())
  );

  const fetchDistrictsAndConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error("Error fetching districts and constituencies:", error);
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

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/agent/AgentDetails`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });
      const newDetails = await response.json();
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  useEffect(() => {
    fetchDistrictsAndConstituencies();
    fetchOccupations();
    getDetails();
  }, []);

  useEffect(() => {
    if (Details.MyRefferalCode) {
      setReferralCode(Details.MyRefferalCode);
    }
  }, [Details]);

  useEffect(() => {
    if (district) {
      const selectedDistrict = districts.find(
        (item) => item.parliament === district
      );
      if (selectedDistrict) {
        setConstituencies(selectedDistrict.assemblies);
      }
    }
  }, [district]);

  const handleRegister = async () => {
    if (
      !fullname.trim() ||
      !mobile.trim() ||
      !district.trim() ||
      !constituency.trim() ||
      !location.trim() ||
      !occupation.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const selectedDistrict = districts.find((d) => d.parliament === district);
    const selectedConstituency = constituencies.find(
      (a) => a.name === constituency
    );

    if (!selectedDistrict || !selectedConstituency) {
      Alert.alert("Error", "Invalid district or constituency selected.");
      setIsLoading(false);
      return;
    }

    const referenceId = `${selectedDistrict.parliamentCode}${selectedConstituency.code}`;

    const userData = {
      FullName: fullname,
      MobileNumber: mobile,
      District: district,
      Contituency: constituency,
      Locations: location,
      Occupation: occupation,
      ReferredBy: referralCode || "WA0000000001",
      Password: "Wealth",
      MyRefferalCode: referenceId,
      RegisteredBY: "WealthAssociate",
    };

    try {
      const response = await fetch(`${API_URL}/customer/CustomerRegister`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert("Success", "Registration successful!");
        navigation.navigate("Login");
      } else if (response.status === 400) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Mobile number already exists.");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDistrictItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setDistrict(item.parliament);
        setShowDistrictModal(false);
        setDistrictSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.parliament}</Text>
    </TouchableOpacity>
  );

  const renderConstituencyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setConstituency(item.name);
        setShowConstituencyModal(false);
        setConstituencySearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderOccupationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setOccupation(item.name);
        setShowOccupationModal(false);
        setOccupationSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            (width < 450 || Platform.OS === 'android') && styles.smallScreenScrollContainer
          ]}
          style={styles.scrollView}
          nestedScrollEnabled={true}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#2B2D42" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.screenTitle}>REGISTER CUSTOMER</Text>
            </View>
            <Image source={logo1} style={styles.logo} />
          </View>
          <View style={styles.card}>
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <View style={styles.webInputWrapper}>
              {/* Row 1 */}
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={fullname}
                      onChangeText={setFullname}
                      returnKeyType="next"
                      onSubmitEditing={() => mobileRef.current.focus()}
                    />
                    <FontAwesome
                      name="user"
                      size={20}
                      color="#E82E5F"
                      style={styles.icon}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={mobileRef}
                      style={styles.input}
                      placeholder="Mobile Number"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="number-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => districtRef.current.focus()}
                    />
                    <MaterialIcons
                      name="phone"
                      size={20}
                      color="#E82E5F"
                      style={styles.icon}
                    />
                  </View>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Select Parliament</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowDistrictModal(true)}
                  >
                    <TextInput
                      ref={districtRef}
                      style={styles.input}
                      placeholder="Select parliament"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={district}
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
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Select Assemblie</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowConstituencyModal(true)}
                    disabled={!district}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder={
                        district
                          ? "Select Assemblie"
                          : "Select parliament first"
                      }
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={constituency}
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
                </View>
              </View>

              {/* Row 3 */}
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Select Occupation</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowOccupationModal(true)}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Select Occupation"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={occupation}
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
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Location"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={location}
                      onChangeText={setLocation}
                    />
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#E82E5F"
                      style={styles.icon}
                    />
                  </View>
                </View>
              </View>

              {/* Row 4 */}
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Referral Code</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Referral Code"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={referralCode || "WA0000000001"}
                      onChangeText={setReferralCode}
                      editable={false}
                    />
                    <MaterialIcons
                      name="card-giftcard"
                      size={20}
                      color="#E82E5F"
                      style={styles.icon}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.navigate("RegisterAS")}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {isLoading && (
              <ActivityIndicator
                size="large"
                color="#E82E5F"
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* District Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOuterContainer}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Parliament</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search parliament..."
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  onChangeText={setDistrictSearch}
                  value={districtSearch}
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
                data={filteredDistricts}
                renderItem={renderDistrictItem}
                keyExtractor={(item) => item._id}
                style={styles.modalList}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowDistrictModal(false);
                  setDistrictSearch("");
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Constituency Modal */}
      <Modal
        visible={showConstituencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConstituencyModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOuterContainer}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Assemblies</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search assemblies..."
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  onChangeText={setConstituencySearch}
                  value={constituencySearch}
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
                data={filteredConstituencies}
                renderItem={renderConstituencyItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.modalList}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowConstituencyModal(false);
                  setConstituencySearch("");
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Occupation Modal */}
      <Modal
        visible={showOccupationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOccupationModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOuterContainer}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Occupation</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search occupation..."
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  onChangeText={setOccupationSearch}
                  value={occupationSearch}
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
                data={filteredOccupations}
                renderItem={renderOccupationItem}
                keyExtractor={(item) => item.code}
                style={styles.modalList}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowOccupationModal(false);
                  setOccupationSearch("");
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  smallScreenScrollContainer: {
    paddingHorizontal: 10,
    paddingTop: width < 450 && Platform.OS === "web" ? 310 : 0,
    height: "100vh"
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  card: {
    display: "flex",
    justifyContent: "center",
    width: width < 450 ? "90%" : Platform.OS === "web" ? (width > 1024 ? "60%" : "80%") : "90%",
    backgroundColor: "#FDFDFD",
    padding: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
    margin: 20,
    borderWidth: Platform.OS === "web" ? 0 : 1,
    borderColor: Platform.OS === "web" ? "transparent" : "#ccc",
  },
  webInputWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: 25,
  },
  inputRow: {
    flexDirection: width < 450 ? "column" : "row",
    justifyContent: "space-between",
    gap: 15,
  },
  inputContainer: {
    width: width < 450 ? "100%" : "48%",
    position: "relative",
    zIndex: 1,
  },
  inputWrapper: {
    position: "relative",
    zIndex: 1,
  },
  input: {
    width: "100%",
    height: 47,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    fontFamily: "Roboto-Regular",
  },
  logo: {
    width: width < 450 ? 105 : 100,
    height: width < 450 ? 105 : 100,
    resizeMode: "contain",
    top: Platform.OS === "ios" ? "20%" : "undefined",
    marginRight: 7,
    marginBottom: Platform.OS === "ios" ? "30%" : 40,
    left: Platform.OS === "ios" ? "-34%" : "undefined" && width < 450 ? -111 : "-45%",
  },
  icon: {
    position: "absolute",
    right: 10,
    top: 13,
    color: "#3E5C76",
  },
  label: {
    fontSize: 14,
    color: "#191919",
    marginBottom: 8,
    fontFamily: "Roboto-Medium",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginTop: 20,
    gap: 15,
  },
  registerButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    flex: 1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Roboto-Medium",
  },
  loadingIndicator: {
    marginTop: 20,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Roboto-Regular",
  },
  screenTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#2B2D42",
    left: 50,
    textAlign: "center",
    fontFamily: "Roboto-Bold",
    top: Platform.OS === "ios" ? "30%" : 50,
  },
  // Modal styles
  modalOuterContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
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
    marginTop:Platform.OS==="ios"?"30%":"",
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

export default RegisterCustomer;