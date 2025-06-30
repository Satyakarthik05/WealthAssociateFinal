import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
  Dimensions,
  Animated,
  FlatList,
} from "react-native";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const expertTypes = [
  { name: "LEGAL", code: "LEGAL" },
  { name: "REVENUE", code: "REVENUE" },
  { name: "ENGINEERS", code: "ENGINEERS" },
  { name: "INTERIOR & ARCHITECTS", code: "INTERIOR_ARCHITECTS" },
  { name: "SURVEY & PLANNING", code: "SURVEY_PLANNING" },
  { name: "VAASTU PANDITS", code: "VAASTU_PANDITS" },
  { name: "LAND VALUERS", code: "LAND_VALUERS" },
  { name: "BANKING", code: "BANKING" },
  { name: "AGRICULTURE", code: "AGRICULTURE" },
  { name: "REGISTRATION & DOCUMENTATION", code: "REGISTRATION_DOCUMENTATION" },
  { name: "AUDITING", code: "AUDITING" },
  { name: "LIAISONING", code: "LIAISONING" },
];

const { width, height } = Dimensions.get("window");

const RequestedExpert = ({ closeModal }) => {
  const fontsLoaded = useFontsLoader();
  const [selectedExpert, setSelectedExpert] = useState("");
  const [reason, setReason] = useState("");
  const [Details, setDetails] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState("");
  const [expertSearch, setExpertSearch] = useState("");
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const { width } = useWindowDimensions();
  const isMobile = width < 450;

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
      Alert.alert("Error", "Failed to load user details");
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  const validateForm = () => {
    if (!selectedExpert) {
      Alert.alert("Error", "Please select an expert type.");
      return false;
    }
    return true;
  };

  const handleRequest = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const requestData = {
      expertType: selectedExpert,
      reason: reason.trim(),
      UserType: userType,
    };

    if (userType === "WealthAssociate" || userType === "ReferralAssociate") {
      requestData.WantedBy = Details?.MobileNumber || "Unknown";
    } else if (userType === "Customer") {
      requestData.WantedBy = Details?.MobileNumber;
    } else if (userType === "CoreMember") {
      requestData.WantedBy = Details?.MobileNumber;
    } else if (userType === "Investor") {
      requestData.WantedBy = Details?.MobileNumber;
    } else if (userType === "NRI") {
      requestData.WantedBy = Details?.MobileIN;
    } else if (userType === "SkilledResource") {
      requestData.WantedBy = Details?.MobileNumber;
    }

    try {
      const response = await fetch(`${API_URL}/direqexp/direqexp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        setModalVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to submit request. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Network Error",
        "Unable to connect to the server. Please check your internet connection."
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpertTypes = expertTypes.filter((item) =>
    item.name.toLowerCase().includes(expertSearch.toLowerCase())
  );

  const renderExpertItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setSelectedExpert(item.name);
        setShowExpertModal(false);
        setExpertSearch("");
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setTimeout(() => {
        Alert.alert("Success", "Expert request submitted successfully!");
        navigation.goBack();
      }, 100);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#D8E3E7" }}>
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            width: isMobile ? "90%" : "40%",
            paddingHorizontal: isMobile ? 20 : 30,
            paddingVertical: 30,
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Request Expert Assistance</Text>
          <View
            style={[styles.formContainer, { marginTop: isMobile ? 20 : 40 }]}
          >
            {/* Expert Type Input */}
            <Text style={styles.label}>Expert Type</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowExpertModal(true)}
              activeOpacity={0.8}
            >
              <TextInput
                style={styles.input}
                placeholder="Select Expert Type"
                placeholderTextColor="rgba(25, 25, 25, 0.5)"
                value={selectedExpert}
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

            {/* Reason Textbox */}
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please describe why you need this expert..."
              placeholderTextColor="rgba(25, 25, 25, 0.5)"
              multiline
              minLength={10}
              value={reason}
              onChangeText={setReason}
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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

        {/* Expert Type Modal */}
        <Modal
          visible={showExpertModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowExpertModal(false)}
        >
          <View style={styles.modalOuterContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboardAvoidingView}
              keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Expert Type</Text>
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search expert types..."
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setExpertSearch}
                      value={expertSearch}
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
                    data={filteredExpertTypes}
                    renderItem={renderExpertItem}
                    keyExtractor={(item) => item.code}
                    style={styles.modalList}
                    keyboardShouldPersistTaps="handled"
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowExpertModal(false);
                      setExpertSearch("");
                    }}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
            <View style={styles.successModalContent}>
              <MaterialIcons name="check-circle" size={60} color="#4BB543" />
              <Text style={styles.successText}>
                Request Submitted Successfully!
              </Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Platform.OS === "android" || Platform.OS === "ios" ? "100%" : "40%",
    borderRadius: 5,
    paddingBottom: 30,
    padding: 30,
    paddingRight: 30,
    backgroundColor: "#D8E3E7",
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: "10%",
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    textAlign: "center",
    color: "black",
    backgroundColor: "#D8E3E7",
    alignSelf: "center",
    paddingHorizontal: 16,
    height: 25,
    marginTop: 75,
    borderRadius: 20,
    display: "flex",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    fontFamily: "OpenSanssemibold",
  },
  formContainer: {
    marginBottom: 10,
    backgroundColor: "#FDFDFD",
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#2B2D42",
    fontFamily: "OpenSanssemibold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E0E6ED",
    borderRadius: 25,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    paddingRight: 40,
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
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  postButton: {
    flex: 1,
    marginRight: 10,
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
    marginTop: Platform.OS === "ios" ? 200 : 0,
    marginBottom: Platform.OS === "ios" ? "-13%" : "",
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
  // Success modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  successModalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
    maxWidth: 400,
  },
  successText: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#2B2D42",
  },
  successButton: {
    backgroundColor: "#3E5C76",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 15,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RequestedExpert;
