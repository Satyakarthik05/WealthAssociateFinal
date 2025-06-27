import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";

const { width } = Dimensions.get("window");

const Modify_Deatils = ({ closeModal, onDetailsUpdate, onDetailsUpdated }) => {
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [selectSkill, setSelectSkill] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState(null);
  const [isMobileEditable, setIsMobileEditable] = useState(false); // State to control mobile field editability

  const mobileRef = useRef(null);
  const emailRef = useRef(null);

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/investors/getinvestor`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });
      const newDetails = await response.json();
      console.log("Fetched Details:", newDetails); // Debugging: Log fetched details

      // Pre-fill the form fields with the fetched details
      if (newDetails.FullName) setFullname(newDetails.FullName);
      if (newDetails.MobileNumber) setMobile(newDetails.MobileNumber);
      if (newDetails.Email) setEmail(newDetails.Email);
      if (newDetails.Location) setLocation(newDetails.Location);
      if (newDetails.SelectSkill) setSelectSkill(newDetails.SelectSkill);
      if (newDetails.Password) setPassword(newDetails.Password);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  const handleRegister = async () => {
    if (
      !fullname ||
      !mobile ||
      // !email ||
      !location ||
      !selectSkill ||
      !password
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    const userData = {
      FullName: fullname,
      MobileNumber: mobile,
      Email: email,
      Location: location,
      SelectSkill: selectSkill,
      Password: password,
    };

    try {
      const response = await fetch(`${API_URL}/investors/updateInvestor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      setResponseStatus(response.status);

      if (response.ok) {
        Alert.alert("Success", "Details Updated successfully!");
        setIsMobileEditable(false); // Disable mobile number field
        closeModal();
        onDetailsUpdate();
        if (onDetailsUpdated) onDetailsUpdated(); // Check if the function exists before calling
      } else if (response.status === 400) {
        Alert.alert("Error", "Unable to Update details.");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      Alert.alert(
        "Error",
        "Failed to connect to the server. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          nestedScrollEnabled={true}
        >
              <Text style={styles.register_text}>Edit Details</Text>
          <View style={styles.card}>
            <View style={styles.register_main}>
            </View>
            {responseStatus === 400 && (
              <Text style={styles.errorText}>
                Mobile number already exists.
              </Text>
            )}

            <View style={styles.webInputWrapper}>
              {/* Row 1 */}
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Fullname</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setFullname}
                      value={fullname}
                      returnKeyType="next"
                      onSubmitEditing={() => mobileRef.current.focus()}
                    />
                    <FontAwesome
                      name="user"
                      size={20}
                      color="#3E5C76"
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
                      onChangeText={setMobile}
                      value={mobile}
                      keyboardType="number-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current.focus()}
                      editable={isMobileEditable} // Disable editing based on state
                    />
                    <MaterialIcons
                      name="phone"
                      size={20}
                      color="#3E5C76"
                      style={styles.icon}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
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
              </View>

              {/* Row 2 */}
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Select Skill</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Select Skill"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setSelectSkill}
                      value={selectSkill}
                    />
                    <MaterialIcons
                      name="work"
                      size={20}
                      color="#3E5C76"
                      style={styles.icon}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
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
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setPassword}
                      value={password}
                      secureTextEntry={true}
                    />
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color="#3E5C76"
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
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                disabled={isLoading}
                onPress={closeModal}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {isLoading && (
              <ActivityIndicator
                size="large"
                color="#3E5C76"
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </ScrollView>
        {/* <StatusBar style="auto" /> */}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    width:"100%",
    borderRadius:30,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#D8E3E7",
    borderRadius: 30,
  },
  register_main: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    width: Platform.OS === "web" ? "100%" : 260,
    height: 1,
    borderRadius: 20,
  },
  register_text: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    fontSize: 24,
    color: "black",
    fontFamily: "OpenSanssemibold",
  },
  card: {
    display: "flex",
    justifyContent: "center",
    width: Platform.OS === "web" ? (width > 1024 ? "100%" : "100%") : "90%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
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
    flexDirection:
      Platform.OS === "android" || Platform.OS !== "android" ? "column" : "row",
    justifyContent: "space-between",
    gap: 5,
  },
  inputContainer: {
    width:
      Platform.OS === "android" || Platform.OS !== "android" ? "100%" : "30%",
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
  },
  icon: {
    position: "absolute",
    right: 10,
    top: 13,
  },
  label: {
    fontSize: 16,
    color: "#191919",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginTop: 20,
  },
  registerButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  cancelButton: {
    backgroundColor: "#3E5C76",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
  },
  loadingIndicator: {
    marginTop: 20,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
});

export default Modify_Deatils;
