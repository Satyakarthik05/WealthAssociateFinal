import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
  Platform,
  Linking,
} from "react-native";
import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import { NavigationIndependentTree } from "@react-navigation/native";
import MainScreen from "./Screens/MainScreen";
import RegisterAsScreen from "./Screens/Register_change";
import ForgotPassword from "./Screens/ForgetPassword";
import OTPVerification from "./Screens/OtpVerification";
import RegisterScreen from "./Screens/Register_screen";
import RegisterCustomer from "./Screens/Customer_Register";
import Login_screen from "./Screens/Login_screen";
import Admin_panel from "./Screens/Admin_panel";
import PrivacyPolicy from "./Screens/PrivacyPolicy";
import Admin from "./Admin_Pan/AdminDashboard";
import StartingScreen from "./StartingScreen";
import CallCenterDashboard from "./CallCenterDash/CallCenterDashboard";
import CallCenterLogin from "./CallCenterDash/Login_screen";
import New_Password from "./Screens/New_Password";
import NriRegister from "./Screens/AddNri";
import InvestorRegister from "./Screens/AddInvestors";
import SkilledRegister from "./Screens/Rskill";
import HomeScreen from "./NewWealth/MainScreen/Home";
import Add_Member from "./NewWealth/Add_Member/Add_Member";
import Agent_Profile from "./NewWealth/UsersProfiles/AgentProfile";
import PersistentLayout from "./NewWealth/MainScreen/MainNavigation";
import PropertyHome from "./NewWealth/Properties/PropertyHome";
import ExpertPanel from "./NewWealth/ExpertPanel/ExpertRoute";
import Coreclipro from "./NewWealth/CoreProCli/CoreClientsPro";
import PostProperty from "./NewWealth/Properties/PostProperty";
import RequestedProperty from "./NewWealth/Properties/RequestProperty";
import RequestedExpert from "./NewWealth/ExpertPanel/Requested_expert";
import Add_Agent from "./NewWealth/Add_Member/Add_Agent";
import RegisterValue from "./NewWealth/Add_Member/RegisterValue";
import Rrwa from "./NewWealth/Add_Member/Rrwa";
import Rewa from "./NewWealth/Add_Member/Rewa";
import PropertyDetailsScreen from "./NewWealth/Properties/ViewPropertyDetails";
import PropertyCard from "./NewWealth/MainScreen/PropertyCard";
import RegularProperties from "./NewWealth/Properties/PropertyTypesdata/RegularProperties";
import ApprovedProperties from "./NewWealth/Properties/PropertyTypesdata/ApprovesProperties";
import WealthProperties from "./NewWealth/Properties/PropertyTypesdata/WealthPropertys";
import ListedProperties from "./NewWealth/Properties/PropertyTypesdata/ListedPropertys";
import { API_URL } from "./data/ApiUrl";
import CoreProfile from "./NewWealth/UsersProfiles/CoreProfile";
import Customerprofile from "./NewWealth/UsersProfiles/CustomerProfile";
import Investorprofile from "./NewWealth/UsersProfiles/InvestorProfile";
import Skilledprofile from "./NewWealth/UsersProfiles/SkilledProfile";
import Addwealthassociate from "./NewWealth/Add_Member/Addwealthassociate";
import regicuss from "./NewWealth/Add_Member/Regicus";
import regnri from "./NewWealth/Add_Member/AddNri";
import regskill from "./NewWealth/Add_Member/Rskill";
import reginvestor from "./NewWealth/Add_Member/AddInvestors";
import NriProfile from "./NewWealth/UsersProfiles/NriProfile";
import Addexpert from "./NewWealth/ExpertPanel/AddExpert";
import SuppliersVendors from "./NewWealth/MainScreen/SuppliersVendors";
import AddSupplier from "./NewWealth/MainScreen/AddSupplier";
import vendor from "./NewWealth/MainScreen/Vendor";
import SkilledResources from "./NewWealth/MainScreen/SkilledResource";
import SkilledWorkersList from "./NewWealth/MainScreen/Skilllist";
import ViewAllRequestedProperties from "./NewWealth/Properties/AllrequestedProperties";
import ViewLikedProperties from "./NewWealth/Properties/ViewLikedProperties";
import { createNavigationContainerRef } from "@react-navigation/native";
import myAgents from "./NewWealth/Myagents/Myagents";
import LoadingScreen from "./NewWealth/MainScreen/Loadingscreen";
import RentalPropertiesScreen from "./NewWealth/Properties/PropertyTypesdata/Rental";
import callexestatus from "./NewWealth/MainScreen/CallExecutivesstatus";
import Analytics from "./NewWealth/MainScreen/Analytics";

const Stack = createStackNavigator();
const APP_VERSION = "1.2.1";
const EXPO_PROJECT_ID = "38b6a11f-476f-46f4-8263-95fe96a6d8ca";

export const navigationRef = createNavigationContainerRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const linking = {
  prefixes: ["https://www.wealthassociate.in", "wealthassociate://"],
  config: {
    screens: {
      "Main Screen": {
        path: "",
        initialRouteName: "Main Screen",
      },
      PrivacyPolicy: "privacy_policy",
    },
  },
  getInitialURL: async () => {
    if (Platform.OS === "web") {
      if (
        !window.performance ||
        performance.navigation.type === 0 ||
        performance.navigation.type === 1
      ) {
        return "/";
      }
    }
    const url = await Linking.getInitialURL();
    return url || "/";
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }) => listener(url);
    const subscription = Linking.addEventListener("url", onReceiveURL);
    return () => subscription.remove();
  },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Main Screen");
  const [expoPushToken, setExpoPushToken] = useState("");

  // Define the notification listeners using useRef
  const notificationListener = useRef();
  const responseListener = useRef();

  const handleNotificationPress = (notification) => {
    const data = notification.request.content.data;

    if (navigationRef.isReady()) {
      if (data?.screen === "PropertyDetails" && data?.propertyId) {
        navigationRef.navigate("Main", {
          screen: "PropertyDetails",
          params: { propertyId: data.propertyId },
        });
      }
    }
  };

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log("Notifications not supported on simulators");
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    try {
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: EXPO_PROJECT_ID,
        })
      ).data;

      setExpoPushToken(token);
      await sendTokenToBackend(token, Platform.OS);
      await AsyncStorage.setItem("expoPushToken", token);
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Push notifications need to be enabled for the best experience.",
        [{ text: "OK" }]
      );
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Notification received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Notification tapped/opened
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationPress(response.notification);
      });

    // Check if app was launched from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationPress(response.notification);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Auto-update logic
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync(); // Auto-restart the app
            return; // Exit early to avoid executing rest of the init twice
          }
        }

        const storedVersion = await AsyncStorage.getItem("appVersion");
        if (storedVersion !== APP_VERSION) {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("expoPushToken");
          await AsyncStorage.setItem("appVersion", APP_VERSION);
          await requestNotificationPermission();
        } else {
          const existingToken = await AsyncStorage.getItem("expoPushToken");
          if (!existingToken) {
            await requestNotificationPermission();
          }
        }

        const token = await AsyncStorage.getItem("authToken");
        const userType = await AsyncStorage.getItem("userType");

        if (token && userType) {
          switch (userType) {
            case "WealthAssociate":
            case "Referral":
              setInitialRoute("Main");
              break;
            case "Customer":
              setInitialRoute("Main");
              break;
            case "Investor":
              setInitialRoute("Main");
              break;
            case "Coremember":
              setInitialRoute("Main");
              break;
            case "SkilledLabour":
              setInitialRoute("Main");
              break;
            case "CallCenter":
            case "Call center":
              setInitialRoute("CallCenterDashboard");
              break;
            case "Nri":
              setInitialRoute("Main");
              break;
            case "Admin":
              setInitialRoute("Admin");
              break;
            default:
              setInitialRoute("Main Screen");
          }
        }
      } catch (error) {
        console.error("App initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* <ActivityIndicator size="large" color="#0000ff" /> */}
        <LoadingScreen />
      </View>
    );
  }

  const MainStack = () => (
    <PersistentLayout>
      <Stack.Navigator
        initialRouteName="newhome"
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        <Stack.Screen name="newhome" component={HomeScreen} />
        <Stack.Screen
          name="suppliersvendors"
          component={SuppliersVendors}
          options={{ title: "Suppliers & Vendors" }}
        />
        <Stack.Screen
          name="AddSupplier"
          component={AddSupplier}
          options={{ title: "Add Supplier" }}
        />
        <Stack.Screen
          name="VendorList"
          component={vendor}
          options={({ route }) => ({ title: route.params.vendorType })}
        />
        <Stack.Screen name="skilledresources" component={SkilledResources} />
        <Stack.Screen
          name="SkilledWorkersList"
          component={SkilledWorkersList}
          options={({ route }) => ({ title: route.params.categoryName })}
        />
        <Stack.Screen name="nrireg" component={NriRegister} />
        <Stack.Screen name="invreg" component={InvestorRegister} />
        <Stack.Screen name="skillreg" component={SkilledRegister} />
        <Stack.Screen name="addmember" component={Add_Member} />
        <Stack.Screen name="myagents" component={myAgents} />
        <Stack.Screen name="agentprofile" component={Agent_Profile} />
        <Stack.Screen name="InvestorProfile" component={Investorprofile} />
        <Stack.Screen name="CustomerProfile" component={Customerprofile} />
        <Stack.Screen name="SkilledProfile" component={Skilledprofile} />
        <Stack.Screen name="nriprofile" component={NriProfile} />
        <Stack.Screen name="CoreProfile" component={CoreProfile} />
        <Stack.Screen name="propertyhome" component={PropertyHome} />
        <Stack.Screen name="expertpanel" component={ExpertPanel} />
        <Stack.Screen name="coreclipro" component={Coreclipro} />
        <Stack.Screen name="requestexpert" component={RequestedExpert} />
        <Stack.Screen name="regularprop" component={RegularProperties} />
        <Stack.Screen name="approveprop" component={ApprovedProperties} />
        <Stack.Screen name="wealthprop" component={WealthProperties} />
        <Stack.Screen name="listedprop" component={ListedProperties} />
        <Stack.Screen name="regicuss" component={regicuss} />
        <Stack.Screen name="reginri" component={regnri} />
        <Stack.Screen name="regiskill" component={regskill} />
        <Stack.Screen name="regiinvestor" component={reginvestor} />
        <Stack.Screen name="addexpert" component={Addexpert} />
        <Stack.Screen name="liked" component={ViewLikedProperties} />
        <Stack.Screen name="callexestatus" component={callexestatus} />
        <Stack.Screen name="analytics" component={Analytics} />

        <Stack.Screen
          name="allreqprop"
          component={ViewAllRequestedProperties}
        />
        <Stack.Screen
          name="PropertyDetails"
          component={PropertyDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="postproperty" component={PostProperty} />
        <Stack.Screen name="requestproperty" component={RequestedProperty} />
        <Stack.Screen
          name="addagent"
          component={Add_Agent}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddRegionalWealthAssociate"
          component={Rrwa}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="AddValueWealthAssociate"
          component={RegisterValue}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="AddExecutiveWealthAssociate"
          component={Rewa}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="PropertyCard"
          component={PropertyCard}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="addwealthass"
          component={Addwealthassociate}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="RegisterCustomer"
          component={RegisterCustomer}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </PersistentLayout>
  );

  return (
    <NavigationIndependentTree>
      <NavigationContainer
        linking={Platform.OS === "web" ? linking : undefined}
      >
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="Main Screen"
            component={MainScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterAS"
            component={RegisterAsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Starting Screen"
            component={StartingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Forgetpassword"
            component={ForgotPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="otpscreen"
            component={OTPVerification}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="newpassword"
            component={New_Password}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterCustomer"
            component={RegisterCustomer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login_screen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={Admin_panel}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicy}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Admin"
            component={Admin}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CallCenterDashboard"
            component={CallCenterDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CallCenterLogin"
            component={CallCenterLogin}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainStack}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="nrireg"
            component={NriRegister}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="postproperty"
            component={PostProperty}
            options={{
              presentation: "modal",
              headerShown: false,
              cardOverlayEnabled: true,
              gestureEnabled: true,
              cardStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="requestproperty"
            component={RequestedProperty}
            options={{
              presentation: "modal",
              headerShown: false,
              cardOverlayEnabled: true,
              gestureEnabled: true,
              cardStyle: { backgroundColor: "transparent" },
            }}
          />

          <Stack.Screen
            name="addagent"
            component={Add_Agent}
            options={{
              presentation: "modal",
              headerShown: false,
              cardOverlayEnabled: true,
              gestureEnabled: true,
              cardStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="AddRegionalWealthAssociate"
            component={Rrwa}
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="AddValueWealthAssociate"
            component={RegisterValue}
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="AddExecutiveWealthAssociate"
            component={Rewa}
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="PropertyCard"
            component={PropertyCard}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="invreg"
            component={InvestorRegister}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="skillreg"
            component={SkilledRegister}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="newhome"
            component={MainStack}
            options={{ headerShown: false }}
          />

          <Stack.Screen name="addmember">
            {() => (
              <PersistentLayout>
                <Add_Member />
              </PersistentLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="agentprofile">
            {() => (
              <PersistentLayout>
                <Agent_Profile />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="nriprofile">
            {() => (
              <PersistentLayout>
                <NRI_Profile />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="SkilledProfile">
            {() => (
              <PersistentLayout>
                <SkilledProfile />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="propertyhome">
            {() => (
              <PersistentLayout>
                <PropertyHome />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="expertpanel">
            {() => (
              <PersistentLayout>
                <ExpertPanel />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="coreclipro">
            {() => (
              <PersistentLayout>
                <Coreclipro />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="requestexpert">
            {() => (
              <PersistentLayout>
                <RequestedExpert />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="regularprop">
            {() => (
              <PersistentLayout>
                <RegularProperties />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="rentalprop">
            {() => (
              <PersistentLayout>
                <RentalPropertiesScreen />
              </PersistentLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="PropertyDetails" options={{ headerShown: false }}>
            {(props) => (
              <PersistentLayout>
                <PropertyDetailsScreen {...props} />
              </PersistentLayout>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

async function sendTokenToBackend(token, deviceType) {
  try {
    const userId = await AsyncStorage.getItem("userId");
    const appVersion = Constants.expoConfig.version || APP_VERSION;
    const authToken = await AsyncStorage.getItem("authToken");

    const response = await fetch(`${API_URL}/noti/register-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        deviceType,
        appVersion,
        userId,
      }),
    });

    if (!response.ok) {
      console.warn("Failed to register token:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending token:", error);
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
});
