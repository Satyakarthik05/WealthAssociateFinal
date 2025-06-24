import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";
import { API_URL } from "../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import logo1 from "../assets/logosub.png";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const AddNRIMember = () => {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [locality, setLocality] = useState("");
  const [indianLocation, setIndianLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [mobileIN, setMobileIN] = useState("");
  const [mobileCountryNo, setMobileCountryNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [Details, setDetails] = useState({});
  const [constituencies, setConstituencies] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const navigation = useNavigation();
  
  const countries = [
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
  ];

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
    getDetails();
    fetchConstituencies();
  }, []);

  const fetchConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setConstituencies(data);
    } catch (error) {
      console.error("Error fetching constituencies:", error);
    }
  };

  const filteredConstituencies = constituencies.flatMap((item) =>
    item.assemblies.filter((assembly) =>
      assembly.name.toLowerCase().includes(locationSearch.toLowerCase())
    )
  );

  const filteredCountries = countries.filter((item) =>
    item.label.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setCountry(item.label);
        setShowCountryModal(false);
        setCountrySearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setIndianLocation(item.name);
        setShowLocationModal(false);
        setLocationSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const handleAddMember = async () => {
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
          AddedBy: "WA0000000001",
          RegisteredBy: "WealthAssociate",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        setName("");
        setCountry("");
        setLocality("");
        setIndianLocation("");
        setOccupation("");
        setMobileIN("");
        setMobileCountryNo("");
        navigation.navigate("Starting Screen");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to server");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2B2D42" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.screenTitle}>ADD NRI MEMBER</Text>
            </View>
            <Image source={logo1} style={styles.logo} />
          </View>

          <View style={styles.card}>
            {/* Row 1 */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={setName}
                    value={name}
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
                <Text style={styles.label}>Country</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowCountryModal(true)}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Select Country"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={country}
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

            {/* Row 2 */}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Locality (Abroad)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. Dallas"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={setLocality}
                    value={locality}
                  />
                  <MaterialIcons
                    name="location-on"
                    size={20}
                    color="#E82E5F"
                    style={styles.icon}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location in India</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowLocationModal(true)}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Select Location"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={indianLocation}
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
                <Text style={styles.label}>Occupation</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. Software Engineer"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={setOccupation}
                    value={occupation}
                  />
                  <MaterialIcons
                    name="work"
                    size={20}
                    color="#E82E5F"
                    style={styles.icon}
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
                    onChangeText={(text) =>
                      setMobileIN(text.replace(/[^0-9]/g, ""))
                    }
                    value={mobileIN}
                    keyboardType="phone-pad"
                    maxLength={10}
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

            {/* Row 4 - Single field */}
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { width: width < 450 ? '100%' : '48%' }]}>
                <Text style={styles.label}>Mobile Country No (WhatsApp No.)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. 9063392872"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={(text) =>
                      setMobileCountryNo(text.replace(/[^0-9]/g, ""))
                    }
                    value={mobileCountryNo}
                    keyboardType="phone-pad"
                    maxLength={15}
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

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleAddMember}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.navigate("RegisterAS")}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <ActivityIndicator
                size="large"
                color="#E82E5F"
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : null}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor="rgba(25, 25, 25, 0.5)"
                onChangeText={setCountrySearch}
                value={countrySearch}
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
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.value}
              style={styles.modalList}
              keyboardShouldPersistTaps="handled"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCountryModal(false);
                setCountrySearch("");
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : null}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
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
              data={filteredConstituencies}
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
    paddingTop: width < 450 && Platform.OS === "web" ? 280 : 0,
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
    margin: 10,
    borderWidth: Platform.OS === "web" ? 0 : 1,
    borderColor: Platform.OS === "web" ? "transparent" : "#ccc",
  },
  inputRow: {
    flexDirection: width < 450 ? "column" : "row",
    justifyContent: "space-between",
    gap: 15,
    width: '100%',
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    fontFamily: "Roboto-Regular",
  },
  logo: {
    width: width < 450 ? 105 : 100,
    height: width < 450 ? 105 : 100,
    resizeMode: "contain",
    marginRight: 7,
    top: Platform.OS === "ios" ? "20%" : "",
    marginBottom: 60,
    left: width < 450 ? -102 : "-43%",
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
  screenTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#2B2D42",
    top: 40,  
    left: 50,
    textAlign: "center",
    marginTop: Platform.OS === "ios" ? "18%" : "",
    fontFamily: "Roboto-Bold",
  },
  // Modal styles
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
    marginBottom:Platform.OS==="ios" ? "-30%":"10%",
    textAlign: "center",
    color: "#2B2D42",
    fontFamily: "Roboto-Bold",
  },
  searchContainer: {
    position: "relative",
    marginTop:Platform.OS==="ios"?"40%":"",
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

export default AddNRIMember;