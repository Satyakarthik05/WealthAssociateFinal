import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";

const NRIModifyDetails = ({
  closeModal,
  onDetailsUpdate,
  onDetailsUpdated,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 450;

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");
  const [locality, setLocality] = useState("");
  const [occupation, setOccupation] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState(null);
  const [isMobileEditable, setIsMobileEditable] = useState(false);

  const mobileRef = useRef(null);
  const countryRef = useRef(null);

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/nri/getnri`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });
      const newDetails = await response.json();

      if (newDetails.Name) setName(newDetails.Name);
      if (newDetails.MobileIN) setMobile(newDetails.MobileIN);
      if (newDetails.Country) setCountry(newDetails.Country);
      if (newDetails.Locality) setLocality(newDetails.Locality);
      if (newDetails.Occupation) setOccupation(newDetails.Occupation);
      if (newDetails.Password) setPassword(newDetails.Password);
    } catch (error) {
      console.error("Error fetching NRI details:", error);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  const handleUpdate = async () => {
    if (!name || !mobile || !country || !locality || !occupation || !password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    const userData = {
      Name: name,
      MobileIN: mobile,
      Country: country,
      Locality: locality,
      Occupation: occupation,
      Password: password,
    };

    try {
      const response = await fetch(`${API_URL}/nri/updatenri`, {
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
          <Text style={styles.screenTitle}>Edit NRI Profile</Text>

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
                      onChangeText={setName}
                      value={name}
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
                      onSubmitEditing={() => countryRef.current.focus()}
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
                  <Text style={styles.label}>Country</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={countryRef}
                      style={styles.input}
                      placeholder="Country"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setCountry}
                      value={country}
                      returnKeyType="next"
                    />
                    <MaterialIcons
                      name="map"
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
                  <Text style={styles.label}>Occupation</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Occupation"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setOccupation}
                      value={occupation}
                    />
                    <MaterialIcons
                      name="work"
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
                  <Text style={styles.label}>Locality</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Locality"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      onChangeText={setLocality}
                      value={locality}
                    />
                    <MaterialIcons
                      name="location-on"
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
                onPress={handleUpdate}
                disabled={isLoading}
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
                disabled={isLoading}
                onPress={closeModal}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </View>
  );
};

// Reuse the exact same styles from your skilled profile component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D3E7E8",
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
});

export default NRIModifyDetails;
