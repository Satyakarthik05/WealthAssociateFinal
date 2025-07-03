import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import { useWindowDimensions } from "react-native";

export let exportedFullName = "";
export let exportedMobileNumber = "";

// Cache for user data
let userDataCache = null;
let lastFetchTime = 0;
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

export const clearHeaderCache = () => {
  userDataCache = null;
  lastFetchTime = 0;
};

const Header = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const route = useRoute();
  const [showBackButton, setShowBackButton] = useState(false);
  const [userData, setUserData] = useState({
    details: {},
    userType: "",
    loading: true,
  });
  const [activeTab, setActiveTab] = useState("newhome");
  const [referralInfo, setReferralInfo] = useState(null);

  const tabs = [
    {
      label: "Home",
      icon: "home-outline",
      screenName: "newhome",
      iconActive: "home",
    },
    {
      label: "Add Member",
      icon: "person-add-outline",
      screenName: "addmember",
      iconActive: "person-add",
    },
    {
      label: "Property",
      icon: "business-outline",
      screenName: "propertyhome",
      iconActive: "business",
    },
    {
      label: "Expert Panel",
      icon: "people-outline",
      screenName: "expertpanel",
      iconActive: "people",
    },
    {
      label: "Core Client",
      icon: "star-outline",
      screenName: "coreclipro",
      iconActive: "star",
    },
  ];

  const checkAuthAndNavigate = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Main Screen" }],
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking auth:", error);
      navigation.reset({
        index: 0,
        routes: [{ name: "Main Screen" }],
      });
      return false;
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const noBackScreens = [
        "newhome",
        "Main Screen",
        "Starting Screen",
        "Home",
        "Admin",
        "CallCenterDashboard",
      ];

      const shouldHideBackButton = noBackScreens.includes(route.name);
      const state = navigation.getState();
      const isInitialRoute =
        state?.routes[state?.index || 0]?.name === route.name;

      setShowBackButton(!shouldHideBackButton && !isInitialRoute);

      // Update active tab based on current route
      if (route.params?.setActiveTab) {
        setActiveTab(route.params.setActiveTab);
      } else {
        const currentTab = tabs.find((tab) => tab.screenName === route.name);
        if (currentTab) {
          setActiveTab(currentTab.screenName);
        }
      }
    }, [route.name, navigation, route.params])
  );

  const fetchAndStoreReferralInfo = useCallback(async (identifier, isReferredBy) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token || !identifier) return;

      const response = await fetch(
        `${API_URL}/properties/getPropertyreffered`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token || "",
          },
          body: JSON.stringify({
            referredBy: identifier,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          const details = isReferredBy ? data.referredByDetails : data.addedByDetails;
          if (details) {
            const infoToStore = {
              name: details.name || details.Name || "Not Available",
              mobileNumber: details.Number || "N/A",
              identifier,
              isReferredBy,
              timestamp: Date.now(),
            };
            
            await AsyncStorage.setItem(
              "referredAddedByInfo",
              JSON.stringify(infoToStore)
            );
            setReferralInfo(infoToStore);
            return infoToStore;
          }
        }
      } else if (response.status === 404) {
        // Store "Not Available" if referral not found
        const infoToStore = {
          name: "Not Available",
          mobileNumber: "N/A",
          identifier,
          isReferredBy,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem("referredAddedByInfo", JSON.stringify(infoToStore));
        setReferralInfo(infoToStore);
        return infoToStore;
      }
    } catch (error) {
      console.error("Error fetching referral info:", error);
      // Store error state
      const infoToStore = {
        name: "Error Loading",
        mobileNumber: "N/A",
        identifier,
        isReferredBy,
        timestamp: Date.now(),
        error: true,
      };
      await AsyncStorage.setItem("referredAddedByInfo", JSON.stringify(infoToStore));
      setReferralInfo(infoToStore);
      return infoToStore;
    }
    return null;
  }, []);

  const getCachedReferralInfo = useCallback(async () => {
    try {
      const cachedInfo = await AsyncStorage.getItem("referralInfo");
      if (cachedInfo) {
        const parsedInfo = JSON.parse(cachedInfo);
        // Check if cache is fresh (less than 1 hour old)
        if (Date.now() - parsedInfo.timestamp < 3600000) {
          setReferralInfo(parsedInfo);
          return parsedInfo;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting cached referral info:", error);
      return null;
    }
  }, []);

  const fetchUserDetails = useCallback(async () => {
    try {
      // First check authentication
      const isAuthenticated = await checkAuthAndNavigate();
      if (!isAuthenticated) return;

      const now = Date.now();
      
      // Check AsyncStorage first for user data
      const cachedUserData = await AsyncStorage.getItem("userDetails");
      if (cachedUserData) {
        const parsedData = JSON.parse(cachedUserData);
        userDataCache = {
          details: parsedData,
          userType: parsedData.userType,
        };
        lastFetchTime = now;

        setUserData({
          details: parsedData,
          userType: parsedData.userType,
          loading: false,
        });

        // Check for referral info
        const cachedReferral = await getCachedReferralInfo();
        if (!cachedReferral) {
          if (parsedData.ReferredBy) {
            await fetchAndStoreReferralInfo(parsedData.ReferredBy, true);
          } else if (parsedData.AddedBy) {
            await fetchAndStoreReferralInfo(parsedData.AddedBy, false);
          }
        }
        return;
      }

      // If no cached data or cache expired, proceed with API fetch
      const [token, userType] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userType"),
      ]);

      if (!token || !userType) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("userType");
        navigation.reset({
          index: 0,
          routes: [{ name: "Main Screen" }],
        });
        return;
      }

      let endpoint = "";
      let finalUserType = userType;

      switch (userType) {
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

      const response = await fetch(endpoint, { headers: { token } });

      if (response.status === 401) {
        // Token expired or invalid
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("userType");
        navigation.reset({
          index: 0,
          routes: [{ name: "Main Screen" }],
        });
        return;
      }

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const details = await response.json();

      if (
        (userType === "WealthAssociate" || userType === "ReferralAssociate") &&
        details.AgentType === "ValueAssociate"
      ) {
        finalUserType = "ValueAssociate";
        await AsyncStorage.setItem("userTypevalue", "ValueAssociate");
      }

      // Store user details in AsyncStorage
      const mobileNumber =
        details.MobileNumber || details.MobileIN || details.Number;
      exportedFullName = details?.FullName || details?.Name || "User";
      exportedMobileNumber = mobileNumber || "";

      const userDataToStore = {
        ...details,
        userType: finalUserType,
        mobileNumber,
      };

      await AsyncStorage.setItem(
        "userDetails",
        JSON.stringify(userDataToStore)
      );
      userDataCache = { details: userDataToStore, userType: finalUserType };
      lastFetchTime = now;

      setUserData({
        details: userDataToStore,
        userType: finalUserType,
        loading: false,
      });

      // Fetch and store referral info if applicable
      if (
        [
          "WealthAssociate",
          "ValueAssociate",
          "Customer",
          "CoreMember",
          "ReferralAssociate",
        ].includes(finalUserType)
      ) {
        if (details.ReferredBy) {
          await fetchAndStoreReferralInfo(details.ReferredBy, true);
        }
      } else if (details.AddedBy) {
        await fetchAndStoreReferralInfo(details.AddedBy, false);
      }
    } catch (error) {
      console.error("Header data fetch failed:", error);
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userType");
      navigation.reset({
        index: 0,
        routes: [{ name: "Main Screen" }],
      });
    }
  }, [checkAuthAndNavigate, navigation, getCachedReferralInfo, fetchAndStoreReferralInfo]);

  useEffect(() => {
    const initializeData = async () => {
      // First try to get cached data
      const cachedReferral = await getCachedReferralInfo();
      if (!cachedReferral) {
        // If no cached referral, fetch user details which will handle referral
        await fetchUserDetails();
      } else {
        // If we have cached referral, just fetch user details
        await fetchUserDetails();
      }
    };

    initializeData();
  }, [fetchUserDetails, getCachedReferralInfo]);

  const handleProfilePress = useCallback(() => {
    const goToProfile = async () => {
      const userTypee = await AsyncStorage.getItem("userType");
      console.log(userTypee);

      if (!userData.userType) {
        navigation.navigate("Main", {
          screen: "DefaultProfile",
        });
        return;
      }

      const profileRoutes = {
        WealthAssociate: "agentprofile",
        ValueAssociate: "agentprofile",
        ReferralAssociate: "agentprofile",
        Customer: "CustomerProfile",
        CoreMember: "CoreProfile",
        Investor: "InvestorProfile",
        NRI: "nriprofile",
        SkilledResource: "SkilledProfile",
      };

      navigation.navigate("Main", {
        screen: profileRoutes[userTypee] || "DefaultProfile",
        params: {
          userId: userData.details?._id,
          userType: userData.userType,
        },
      });
    };

    goToProfile();
  }, [userData.details?._id, userData.userType, navigation]);

  const getUserInitials = () => {
    const name = userData.details?.FullName || userData.details?.Name || "User";
    const nameParts = name.split(" ");
    let initials = "";

    if (nameParts.length === 1) {
      initials = nameParts[0].charAt(0).toUpperCase();
    } else {
      initials =
        nameParts[0].charAt(0).toUpperCase() +
        nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    }

    return initials;
  };

  const showReferralCode = [
    "WealthAssociate",
    "ValueAssociate",
    "Customer",
    "CoreMember",
    "ReferralAssociate",
  ].includes(userData.userType);

  const handleTabPress = (screenName) => {
    setActiveTab(screenName);
    navigation.navigate("Main", { screen: screenName });
  };

  const isActive = (screenName) => {
    return activeTab === screenName || route.name === screenName;
  };

  if (userData.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#555" />
      </View>
    );
  }

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.clippingWrapper}>
        <View style={styles.container}>
          {showBackButton && (
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Main", {
                    screen: "newhome",
                    params: { setActiveTab: "newhome" },
                  });
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={26} color="#555" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate("Main", { screen: "newhome" })}
            style={styles.logoContainer}
          >
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.userInfoContainer}>
            <Text
              style={styles.userName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userData.details?.FullName ||
                userData.details?.Name ||
                "Welcome User"}
            </Text>
            {showReferralCode && (
              <Text
                style={styles.userRef}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Ref: {userData.details?.MyRefferalCode || "N/A"}
                
              </Text>
            )}
          </View>

          {/* Web-only navigation tabs */}
          {Platform.OS === "web" && width >= 450 && (
            <View style={styles.webNavContainer}>
              {tabs.map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.webNavItem,
                    isActive(tab.screenName) && styles.webNavItemActive,
                  ]}
                  onPress={() => handleTabPress(tab.screenName)}
                >
                  <Ionicons
                    name={isActive(tab.screenName) ? tab.iconActive : tab.icon}
                    size={20}
                    color={isActive(tab.screenName) ? "#3E5C76" : "#555"}
                  />
                  <Text
                    style={[
                      styles.webNavLabel,
                      {
                        color: isActive(tab.screenName) ? "#3E5C76" : "#555",
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("Main", { screen: "liked" })}
            style={styles.heartButton}
          >
            <FontAwesome name="heart-o" size={23} color="#3E5C76" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.profileButton}
          >
            <View style={styles.profileInitialsContainer}>
              <Text style={styles.profileInitials}>{getUserInitials()}</Text>
            </View>
          </TouchableOpacity>
          <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#D8E3E7",
    top: 20,
    padding: 0,
    margin: 0,
    overflow: "hidden",
    borderRadius: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 70,
    paddingHorizontal: 16,
    backgroundColor: "#FDFDFD",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: Platform.OS === "ios" ? "10%" : "auto",
    ...Platform.select({
      web: {
        width: "100%",
        borderBottomWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  loadingContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    ...Platform.select({
      web: {
        width: "80%",
        marginLeft: "auto",
        marginRight: "auto",
      },
    }),
  },
  backButton: {
    paddingRight: 10,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 50,
    height: 50,
    left: Platform.OS === "web" ? 20 : 0,
    bottom: Platform.OS === "web" ? 5 : 0,
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
    left: Platform.OS === "web" ? 20 : 0,
  },
  userName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#3E5C76",
  },
  userRef: {
    fontSize: 12,
    color: "#3E5C76",
    marginTop: 2,
  },
  profileButton: {
    padding: 5,
    marginLeft: 10,
  },
  profileInitialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3E5C76",
    justifyContent: "center",
    alignItems: "center",
  },
  clippingWrapper: {
    ...Platform.select({
      web: {
        width: "100%",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
      },
      default: {
        width: "100%",
      },
    }),
    overflow: "hidden",
    backgroundColor: "#FDFDFD",
    alignSelf: "center",
  },
  profileInitials: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  heartButton: {
    padding: 0,
    marginRight: 3,
  },
  webNavContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    right: "20%",
  },
  webNavItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  webNavItemActive: {
    backgroundColor: "#FDFDFD",
    opacity: 2,
  },
  webNavLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Header;
