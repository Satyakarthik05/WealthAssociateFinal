import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";

const AgentModifyDetails = ({
  closeModal,
  onDetailsUpdate,
  onDetailsUpdated,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 450;

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState(null);
  const [expertiseSearch, setExpertiseSearch] = useState("");
  const [experienceSearch, setExperienceSearch] = useState("");
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [isMobileEditable, setIsMobileEditable] = useState(false);

  const mobileRef = useRef(null);
  const emailRef = useRef(null);

  const expertiseOptions = [
    { name: "Residential", code: "01" },
    { name: "Commercial", code: "02" },
    { name: "Industrial", code: "03" },
    { name: "Agricultural", code: "04" },
  ];

  const experienceOptions = [
    { name: "0-1 years", code: "01" },
    { name: "1-3 years", code: "02" },
    { name: "3-5 years", code: "03" },
    { name: "5+ years", code: "04" },
  ];

  const filteredExpertise = expertiseOptions.filter((item) =>
    item.name.toLowerCase().includes(expertiseSearch.toLowerCase())
  );

  const filteredExperience = experienceOptions.filter((item) =>
    item.name.toLowerCase().includes(experienceSearch.toLowerCase())
  );

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

      if (newDetails.FullName) setFullName(newDetails.FullName);
      if (newDetails.MobileNumber) setMobile(newDetails.MobileNumber);
      if (newDetails.Email) setEmail(newDetails.Email);
      if (newDetails.Locations) setLocation(newDetails.Locations);
      if (newDetails.Expertise) {
        setExpertise(newDetails.Expertise);
        setExpertiseSearch(newDetails.Expertise);
      }
      if (newDetails.Experience) {
        setExperience(newDetails.Experience);
        setExperienceSearch(newDetails.Experience);
      }
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  const handleUpdate = async () => {
    if (
      !fullName ||
      !mobile ||
      !email ||
      !location ||
      !expertise ||
      !experience
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    const userData = {
      FullName: fullName,
      MobileNumber: mobile,
      Email: email,
      Locations: location,
      Expertise: expertise,
      Experience: experience,
    };

    try {
      const response = await fetch(`${API_URL}/agent/updateAgentDetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      setResponseStatus(response.status);

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        setIsMobileEditable(false);
        closeModal();
        onDetailsUpdate();
        if (onDetailsUpdated) onDetailsUpdated();
      } else if (response.status === 400) {
        Alert.alert("Error", "Unable to update profile.");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error during update:", error);
      Alert.alert(
        "Error",
        "Failed to connect to the server. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderExpertiseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setExpertise(item.name);
        setShowExpertiseModal(false);
        setExpertiseSearch("");
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderExperienceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setExperience(item.name);
        setShowExperienceModal(false);
        setExperienceSearch("");
      }}
      activeOpacity={0.7}
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
            isSmallScreen && styles.smallScreenScrollContainer,
          ]}
          style={styles.scrollView}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Edit Agent Profile</Text>

          <View style={[styles.card, !isSmallScreen && styles.desktopCard]}>
            {responseStatus === 400 && (
              <Text style={styles.errorText}>
                Mobile number already exists.
              </Text>
            )}

            <View style={styles.webInputWrapper}>
              {/* Row 1 */}
              <View
                style={[
                  styles.inputRow,
                  !isSmallScreen && styles.desktopInputRow,
                ]}
              >
                <View
                  style={[
                    styles.inputContainer,
                    !isSmallScreen && styles.desktopInputContainer,
                  ]}
                >
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setFullName}
                      value={fullName}
                      returnKeyType="next"
                      onSubmitEditing={() => mobileRef.current?.focus()}
                    />
                    <FontAwesome
                      name="user"
                      size={20}
                      color="#3E5C76"
                      style={styles.icon}
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    !isSmallScreen && styles.desktopInputContainer,
                  ]}
                >
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={mobileRef}
                      style={styles.input}
                      placeholder="Mobile Number"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setMobile}
                      value={mobile}
                      keyboardType="number-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      editable={isMobileEditable}
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

              {/* Row 2 */}
              <View
                style={[
                  styles.inputRow,
                  !isSmallScreen && styles.desktopInputRow,
                ]}
              >
                <View
                  style={[
                    styles.inputContainer,
                    !isSmallScreen && styles.desktopInputContainer,
                  ]}
                >
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={emailRef}
                      style={styles.input}
                      placeholder="Email"
                      value={email}
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setEmail}
                      returnKeyType="next"
                    />
                    <MaterialIcons
                      name="email"
                      size={20}
                      color="#3E5C76"
                      style={styles.icon}
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    !isSmallScreen && styles.desktopInputContainer,
                  ]}
                >
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Location"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setLocation}
                      value={location}
                    />
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#3E5C76"
                      style={styles.icon}
                    />
                  </View>
                </View>
              </View>

              {/* Row 3 */}
              <View
                style={[
                  styles.inputRow,
                  !isSmallScreen && styles.desktopInputRow,
                ]}
              >
                <View
                  style={[
                    styles.inputContainer,
                    !isSmallScreen && styles.desktopInputContainer,
                  ]}
                >
                  <Text style={styles.label}>Experience</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowExperienceModal(true)}
                    activeOpacity={0.7}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Select Experience"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={experience}
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
                <View
                  style={[
                    styles.inputContainer,
                    !isSmallScreen && styles.desktopInputContainer,
                  ]}
                >
                  <Text style={styles.label}>Expertise</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowExpertiseModal(true)}
                    activeOpacity={0.7}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Select Expertise"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={expertise}
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
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleUpdate}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Update Profile</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={closeModal}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <StatusBar style="auto" />
      </KeyboardAvoidingView>

      {/* Expertise Modal */}
      <Modal
        visible={showExpertiseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpertiseModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowExpertiseModal(false)}>
          <View style={styles.modalOuterContainer}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalKeyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Expertise</Text>
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search expertise..."
                        placeholderTextColor="rgba(25, 25, 25, 0.5)"
                        onChangeText={setExpertiseSearch}
                        value={expertiseSearch}
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
                      data={filteredExpertise}
                      renderItem={renderExpertiseItem}
                      keyExtractor={(item) => item.code}
                      style={styles.modalList}
                      keyboardShouldPersistTaps="handled"
                    />
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => {
                        setShowExpertiseModal(false);
                        setExpertiseSearch("");
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Experience Modal */}
      <Modal
        visible={showExperienceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExperienceModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowExperienceModal(false)}>
          <View style={styles.modalOuterContainer}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalKeyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Experience</Text>
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search experience..."
                        placeholderTextColor="rgba(25, 25, 25, 0.5)"
                        onChangeText={setExperienceSearch}
                        value={experienceSearch}
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
                      data={filteredExperience}
                      renderItem={renderExperienceItem}
                      keyExtractor={(item) => item.code}
                      style={styles.modalList}
                      keyboardShouldPersistTaps="handled"
                    />
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => {
                        setShowExperienceModal(false);
                        setExperienceSearch("");
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    width: Platform.OS === "web" ? "120%" : "100%",
    left: Platform.OS === "web" ? "-5%" : "undefined",
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  smallScreenScrollContainer: {
    paddingHorizontal: 0,
    paddingTop: 50,
  },
  screenTitle: {
    fontWeight: "700",
    fontSize: 22,
    color: "#2B2D42",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Roboto-Bold",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#FDFDFD",
    padding: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: "hidden",
    elevation: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: Platform.OS === "web" ? 0 : 1,
    borderColor: Platform.OS === "web" ? "transparent" : "#ccc",
    width: "95%",
    ...Platform.select({
      web: {
        transition: "all 0.3s ease",
        ":hover": {
          shadowOpacity: 0.3,
        },
      },
    }),
  },
  desktopCard: {
    width: "80%",
    minWidth: 650,
    maxWidth: 800,
  },
  webInputWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: 25,
  },
  inputRow: {
    flexDirection: "column",
    gap: 15,
    width: "100%",
    ...Platform.select({
      web: {
        transition: "flex-direction 0.3s ease",
      },
    }),
  },
  inputContainer: {
    width: "100%",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    height: 47,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 45,
    paddingRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    fontFamily: "Roboto-Regular",
  },
  icon: {
    position: "absolute",
    left: 15,
    top: 13,
    color: "#3E5C76",
    zIndex: 2,
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
  desktopInputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  desktopInputContainer: {
    width: "48%",
  },
  registerButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 44,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Roboto-Medium",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Roboto-Regular",
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
    maxHeight: "70%",
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
    marginTop: 10,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto-Bold",
  },
});

export default AgentModifyDetails;