import React, { useState, useEffect } from "react";
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
} from "react-native";
import { API_URL } from "../../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const screenHeight = Dimensions.get("window").height;
const { width } = Dimensions.get("window");
const isSmallScreen = width < 600;

const RegisterExecute = ({ closeModal }) => {
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [constituency, setConstituency] = useState("");
  const [occupation, setOccupation] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [constituencySearch, setConstituencySearch] = useState("");
  const [occupationSearch, setOccupationSearch] = useState("");
  const [showDistrictList, setShowDistrictList] = useState(false);
  const [showConstituencyList, setShowConstituencyList] = useState(false);
  const [showOccupationList, setShowOccupationList] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [occupationOptions, setOccupationOptions] = useState([]);
  const [Details, setDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const navigation = useNavigation();

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

  // Fetch all districts and constituencies from the API
  const fetchDistrictsAndConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setDistricts(data); // Set the fetched data to districts
    } catch (error) {
      console.error("Error fetching districts and constituencies:", error);
    }
  };

  // Fetch occupations
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
    fetchDistrictsAndConstituencies();
    fetchOccupations();
  }, []);

  // Filter districts based on search input
  const filteredDistricts = districts.filter((item) =>
    item.parliament.toLowerCase().includes(districtSearch.toLowerCase())
  );

  // Filter constituencies based on the selected district
  const filteredConstituencies =
    districts
      .find((item) => item.parliament === district)
      ?.assemblies.filter((assembly) =>
        assembly.name.toLowerCase().includes(constituencySearch.toLowerCase())
      ) || [];

  // Fetch agent details
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
    if (Details.MyRefferalCode) {
      setReferralCode(Details.MyRefferalCode);
    }
  }, [Details]);

  const closeAllDropdowns = () => {
    setShowDistrictList(false);
    setShowConstituencyList(false);
    setShowOccupationList(false);
  };

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
    setErrorMessage(""); // Clear any previous error message

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
        setErrorMessage(errorData.message || "Mobile number already exists."); // Set the error message
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Something went wrong."); // Set the error message
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMessage(
        "Failed to connect to the server. Please try again later."
      ); // Set the error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Adjust if needed
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        resetScrollToCoords={{ x: 0, y: 0 }} // Add this
      >
        <View
          style={[
            styles.container,
            isSmallScreen && styles.smallScreenContainer,
            {
              minHeight: isKeyboardVisible
                ? screenHeight * 0.6
                : screenHeight * 0.1, // Adjust minHeight dynamically
              justifyContent: "flex-start",
            },
          ]}
        >
          <Text style={styles.title}>Register Customer</Text>
          {/* Display the error message above the input fields */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. John Doe"
                value={fullname}
                onChangeText={setFullname}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. 9063 392872"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Parliament</Text>
              <TextInput
                style={styles.input}
                placeholder="Search Parliament"
                value={districtSearch}
                onChangeText={(text) => {
                  setDistrictSearch(text);
                  closeAllDropdowns();
                  setShowDistrictList(true);
                }}
                onFocus={() => {
                  closeAllDropdowns();
                  setShowDistrictList(true);
                }}
              />
              {showDistrictList && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.scrollView}>
                    {filteredDistricts.map((item) => (
                      <TouchableOpacity
                        key={item.parliament}
                        style={styles.listItem}
                        onPress={() => {
                          setDistrict(item.parliament);
                          setDistrictSearch(item.parliament);
                          closeAllDropdowns();
                        }}
                      >
                        <Text>{item.parliament}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Assembly</Text>
              <TextInput
                style={styles.input}
                placeholder="Search Assembly"
                value={constituencySearch}
                onChangeText={(text) => {
                  setConstituencySearch(text);
                  closeAllDropdowns();
                  setShowConstituencyList(true);
                }}
                onFocus={() => {
                  closeAllDropdowns();
                  setShowConstituencyList(true);
                }}
              />
              {showConstituencyList && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.scrollView}>
                    {filteredConstituencies.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.listItem}
                        onPress={() => {
                          setConstituency(item.name);
                          setConstituencySearch(item.name);
                          closeAllDropdowns();
                        }}
                      >
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Occupation</Text>
              <TextInput
                style={styles.input}
                placeholder="Select Occupation"
                value={occupationSearch}
                onChangeText={(text) => {
                  setOccupationSearch(text);
                  closeAllDropdowns();
                  setShowOccupationList(true);
                }}
                onFocus={() => {
                  closeAllDropdowns();
                  setShowOccupationList(true);
                }}
              />
              {showOccupationList && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.scrollView}>
                    {occupationOptions.map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        style={styles.listItem}
                        onPress={() => {
                          setOccupation(item.name);
                          setOccupationSearch(item.name);
                          closeAllDropdowns();
                        }}
                      >
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex. Vijayawada"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Referral Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code"
                placeholderTextColor="rgba(25, 25, 25, 0.5)"
                onChangeText={setReferralCode}
                editable={false}
                value={referralCode}
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                console.log("Cancel button clicked");
                navigation.goBack();
              }}
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
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 20,
  },
  container: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 30,
    elevation: 5,
    width: Platform.OS === "android" || Platform.OS === "ios" ? "90%" : "100%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ccc",
  },
  smallScreenContainer: {
    width: 300,
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#e91e63",
    textAlign: "center",
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  row: {
    flexDirection:
      Platform.OS === "android" || Platform.OS === "ios" ? "column" : "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  inputContainer: {
    width: Platform.OS === "android" || Platform.OS === "ios" ? "100%" : "48%",
    marginBottom: 10,
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    padding: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Platform.OS === "android" || Platform.OS === "ios" ? "auto" : 20,
  },
  registerButton: {
    backgroundColor: "#e91e63",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  dropdownContainer: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#e6708e",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
  },
  scrollView: {
    maxHeight: 200,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default RegisterExecute;
