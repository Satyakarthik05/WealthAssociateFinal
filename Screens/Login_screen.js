import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  BackHandler,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import logo1 from "../assets/logo2.png";
import logo2 from "../assets/logosub.png";

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState("");
  const navigation = useNavigation();
  const [adminData, setAdminData] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 768;

  useEffect(() => {
    if (clickCount === 5) {
      setClickCount(0);
      Alert.alert("Welcome to call center dashboard");
      navigation.navigate("CallCenterLogin");
    }
  }, [clickCount]);

  const handleLogoPress = () => {
    setClickCount((prev) => prev + 1);
  };

  useEffect(() => {
    fetchAdminData();
    getLoginType();
  }, []);

  const getLoginType = async () => {
    try {
      const type = await AsyncStorage.getItem("loginType");
      if (type) {
        setLoginType(type);
      }
    } catch (error) {
      console.error("Error getting login type:", error);
    }
  };

  const fetchAdminData = async () => {
    try {
      const response = await fetch(`${API_URL}/admindata`);
      if (!response.ok) {
        throw new Error("Failed to fetch admin data");
      }
      const data = await response.json();
      setAdminData(data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      Alert.alert("Error", "Failed to fetch admin data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (
      mobileNumber === `${adminData?.UserName}` &&
      password === `${adminData?.Password}`
    ) {
      navigation.navigate("Admin");
      return;
    }

    if (!mobileNumber || !password) {
      setErrorMessage("Please enter both mobile number and password");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      let endpoint = "";
      let userType = "";

      switch (loginType) {
        case "WealthAssociate":
          endpoint = `${API_URL}/agent/AgentLogin`;
          userType = "WealthAssociate";
          break;
        case "Customer":
          endpoint = `${API_URL}/customer/CustomerLogin`;
          userType = "Customer";
          break;
        case "CoreMember":
          endpoint = `${API_URL}/core/coreLogin`;
          userType = "CoreMember";
          break;
        case "ReferralAssociate":
          endpoint = `${API_URL}/agent/AgentLogin`;
          userType = "WealthAssociate";
          break;
        case "Investor":
          endpoint = `${API_URL}/investors/investorlogin`;
          userType = "Investor";
          break;
        case "NRI":
          endpoint = `${API_URL}/nri/nrilogin`;
          userType = "NRI";
          break;
        case "SkilledResource":
          endpoint = `${API_URL}/skillLabour/skilllogin`;
          userType = "SkilledResource";
          break;
        case "CallCenter":
          endpoint = `${API_URL}/callexe/logincall-executives`;
          userType = "CallCenter";
          break;
        default:
          endpoint = `${API_URL}/agent/AgentLogin`;
          userType = "WealthAssociate";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          MobileNumber: mobileNumber,
          Password: password,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        const token = data.token;
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userType", userType);

        if (userType === "CallCenter") {
          navigation.navigate("CallCenterDashboard");
        } else {
          navigation.navigate("Main");
        }
      } else {
        setErrorMessage(
          data.message || "Mobile number or password is incorrect"
        );
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [])
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isMobileWidth && styles.mobileScrollContainer
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={[
              styles.card,
              isMobileWidth ? styles.mobileCard : styles.webCard
            ]}>
              {/* Left Section - Only shown on web in larger views */}
              {Platform.OS === "web" && !isMobileWidth && (
                <View style={styles.leftSection}>
                  <TouchableOpacity 
                    onPress={handleLogoPress}
                    style={styles.logoContainer}
                  >
                    <Image
                      source={logo1}
                      style={styles.logo}
                      resizeMode="contain"
                      onError={(e) => console.log('Image error:', e.nativeEvent.error)}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Right Section - Form content */}
              <View style={[
                styles.rightSection,
                isMobileWidth && styles.mobileRightSection
              ]}>
                {Platform.OS !== "web" && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Icon name="arrow-back" size={24} color="#3E5C76" />
                  </TouchableOpacity>
                )}

                <View style={styles.header}>
                  <Image
                    source={logo2}
                    style={[
                      styles.appLogo,
                      isMobileWidth && styles.mobileAppLogo
                    ]}
                    resizeMode="contain"
                  />
                  <TouchableOpacity onPress={handleLogoPress}>
                    <Text style={styles.welcomeText}>
                      Welcome back! Log in to your {loginType} account
                    </Text>
                  </TouchableOpacity>
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="Ex. 9063392872"
                        placeholderTextColor="#999"
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                      />
                      <Icon
                        name="call-outline"
                        size={20}
                        color="#3E5C76"
                        style={styles.inputIcon}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="Enter your password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Icon
                          name={showPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color="#3E5C76"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.loginButton, loading && styles.disabledButton]}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Login</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.forgotPassword}
                      onPress={() => navigation.navigate("Forgetpassword")}
                    >
                      <Text style={styles.forgotPasswordText}>
                        Forgot your password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  mobileScrollContainer: {
    padding: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    padding: 24,
  },
  webCard: {
    width: '80%',
    maxWidth: 1000,
    flexDirection: 'row',
    minHeight: 600,
  },
  mobileCard: {
    width: '100%',
    maxWidth: 500,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    maxWidth: 300,
    height: 250,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
    }),
  },
  rightSection: {
    flex: 1,
    position: 'relative',
    paddingLeft: 24,
  },
  mobileRightSection: {
    paddingLeft: 0,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 0,
    left: Platform.OS === 'web' ? 16 : 0,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appLogo: {
    width: 120,
    height: 100,
    marginBottom: 16,
  },
  mobileAppLogo: {
    width: 100,
    height: 80,
  },
  welcomeText: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Cairo-SemiBold',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Cairo-Regular',
    paddingVertical: 14,
    outlineStyle: 'none',
  },
  inputIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  actions: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#3E5C76',
    borderRadius: 12,
    width: '100%',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
  },
  forgotPassword: {
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#3E5C76',
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});
