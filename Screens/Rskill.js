import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { API_URL } from "../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import logo1 from "../assets/logosub.png";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const Rskill = ({ closeModal }) => {
  const [fullName, setFullName] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [Details, setDetails] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [constituencies, setConstituencies] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [filteredConstituencies, setFilteredConstituencies] = useState([]);
  const navigation = useNavigation();

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
  }, []);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch(`${API_URL}/discons/skills`);
        const data = await response.json();
        setSkills(data.skills);
        setFilteredSkills(data.skills);
      } catch (error) {
        alert("Error fetching skills: " + error.message);
      } finally {
        setLoadingSkills(false);
      }
    };

    const fetchConstituencies = async () => {
      try {
        const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
        const data = await response.json();
        setConstituencies(data);
        setFilteredConstituencies(data.flatMap((item) => item.assemblies));
      } catch (error) {
        console.error("Error fetching constituencies:", error);
      }
    };

    fetchSkills();
    fetchConstituencies();
  }, []);

  // Filter skills based on search input
  useEffect(() => {
    if (skillSearch) {
      const filtered = skills.filter((skillItem) =>
        skillItem.toLowerCase().includes(skillSearch.toLowerCase())
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills(skills);
    }
  }, [skillSearch, skills]);

  // Filter constituencies based on search input
  useEffect(() => {
    if (locationSearch) {
      const filtered = constituencies.flatMap((item) =>
        item.assemblies.filter((assembly) =>
          assembly.name.toLowerCase().includes(locationSearch.toLowerCase())
        )
      );
      setFilteredConstituencies(filtered);
    } else {
      setFilteredConstituencies(
        constituencies.flatMap((item) => item.assemblies)
      );
    }
  }, [locationSearch, constituencies]);

  const handleRegister = async () => {
    if (!fullName || !skill || !location || !mobileNumber) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/skillLabour/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FullName: fullName,
          SelectSkill: skill,
          Location: location,
          MobileNumber: mobileNumber,
          AddedBy: "WA0000000001",
          RegisteredBy: "WealthAssociate",
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Registration successful");
        setFullName("");
        setSkill("");
        setLocation("");
        setMobileNumber("");
        navigation.navigate("Starting Screen");
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", "Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSkillItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setSkill(item);
        setShowSkillModal(false);
        setSkillSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item}</Text>
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
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
              <Text style={styles.screenTitle}>REGISTER SKILLED RESOURCE</Text>
            </View>
            <Image source={logo1} style={styles.logo} />
          </View>

          <View style={styles.card}>
            {/* Input Row */}
            <View style={styles.inputRow}>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={setFullName}
                    value={fullName}
                  />
                  <FontAwesome
                    name="user"
                    size={20}
                    color="#3E5C76"
                    style={styles.icon}
                  />
                </View>
              </View>

              {/* Skill Select */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Skill</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowSkillModal(true)}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Select Skill"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={skill}
                    editable={false}
                    pointerEvents="none"
                  />
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#3E5C76"
                    style={styles.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Second Input Row */}
            <View style={styles.inputRow}>
              {/* Location Select */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setShowLocationModal(true)}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Select Location"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={location}
                    editable={false}
                    pointerEvents="none"
                  />
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#3E5C76"
                    style={styles.icon}
                  />
                </TouchableOpacity>
              </View>

              {/* Mobile Number Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. 9063392872"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    onChangeText={(text) =>
                      setMobileNumber(text.replace(/[^0-9]/g, ""))
                    }
                    value={mobileNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#3E5C76"
                    style={styles.icon}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
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
                color="#3E5C76"
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Skill Modal */}
      <Modal
        visible={showSkillModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSkillModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOuterContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Skill</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search skill..."
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  onChangeText={setSkillSearch}
                  value={skillSearch}
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
                data={filteredSkills}
                renderItem={renderSkillItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.modalList}
                keyboardShouldPersistTaps="handled"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowSkillModal(false);
                  setSkillSearch("");
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOuterContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View style={styles.modalContainer}>
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
                  color="#3E5C76"
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  inputRow: {
    flexDirection: width < 450 ? "column" : "row",
    justifyContent: "space-between",
    gap: 15,
    width: "100%",
  },
  inputContainer: {
    width: width < 450 ? "100%" : "48%",
    position: "relative",
    zIndex: 1,
    marginBottom: 15,
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
    marginRight: 7,
    marginBottom: 40,
    left: width < 450 ? -102 : -530,
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
    fontSize: 18,
    color: "#2B2D42",
    top: 50,
    left: 50,
    textAlign: "center",
    fontFamily: "Roboto-Bold",
  },
  // Modal styles
  modalOuterContainer: {
    flex: 1,
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
    marginBottom:Platform.OS==="ios" ? "-35%":"5%",
    textAlign: "center",
    color: "#2B2D42",
    fontFamily: "Roboto-Bold",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 15,
    marginTop:Platform.OS==="ios"?"75%":"",
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

export default Rskill;