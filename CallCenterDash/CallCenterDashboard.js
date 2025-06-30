import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
  Switch,
  Alert,
  Linking,
  AppState,
  Animated,
} from "react-native";
import { API_URL } from "../data/ApiUrl";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomModal from "../Components/CustomModal";
import ViewApprovedProperties from "./Screens/Properties/ViewApprovedProperties";
import Viewallagents from "./Screens/Agent/ViewAllAgents";
import NewExperts from "./ExpertPanel/NewExperts";
import Dashboard from "./Screens/Callcentre";
import ViewAgents from "./Screens/Agent/ViewAgents";
import ViewCustomers from "./Screens/Customer/View_customers";
import ViewPostedProperties from "./Screens/Properties/ViewPostedProperties";
import RequestedProperties from "./Screens/Properties/ViewRequestedProperties";
import ViewAgentsCall from "./Screens/Agent/AgentsCall";
import ViewCustomersCalls from "./Screens/Customer/ViewCustCalls";
import ExpertPanelReq from "./ExpertPanel/ExpertReq";
import ViewAllInvesters from "./Screens/View/ViewAllInvestors";
import AllSkilledLabours from "./Screens/View/AllSkilledLabours";
import ViewNri from "./Screens/View/ViewNri";
import ExpertPanel from "./ExpertPanel/ExpertRoute";
import io from "socket.io-client";
import logo1 from "./assets/logo.png";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const isMobile = width < 768;
const isWeb = Platform.OS === "web";

const BACKGROUND_FETCH_TASK = "dashboard-notification-task";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/callexe/newrequests`, {
      headers: { token },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.count > 0) {
        // Play sound even in background
        await playNotificationSound();

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Requests",
            body: `You have ${data.count} new requests to review`,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });
      }
    }
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    return BackgroundFetch.Result.Failed;
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});



const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw error;
  }
};

const CallCenterDashboard = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isMobile);
  const [expandedItems, setExpandedItems] = useState({});
  const [isViewCustVisible, setIsViewCustVisible] = useState(false);
  const [isViewAgentVisible, setIsViewAgentVisible] = useState(false);
  const [isViewPostPropVisible, setIsViewPostPropVisible] = useState(false);
  const [isViewRequestedPropVisible, setIsViewRequestedPropVisible] =
    useState(false);
  const [isViewAgentContVsible, setIsViewAgentContVisible] = useState(false);
  const [isCustCallVisible, setIsCustCallVisible] = useState(false);
  const [isViewApprovedProperties, setViewApprovedProperties] = useState(false);
  const [isExpertPanelReq, setExpertPanelReq] = useState(false);
  const [isViewInvestVisible, setIsViewInvestVisible] = useState(false);
  const [isViewSkillVisible, setIsViewSkillVisible] = useState(false);
  const [isViewNriVisible, setIsViewNriVisible] = useState(false);
  const [details, setDetails] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isViewallagents, setViewallagents] = useState(false);
  const [isExpertPanel, setExpertPanel] = useState(false);
  const [isNewExperts, setNewExperts] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [notificationSettings, setNotificationSettings] = useState({
    agents: false,
    customers: false,
    properties: false,
    requestedProperties: false,
    skilled: false,
    investors: false,
    expertRequests: false,
    expertRegistrations: false,
    expertCallRequests: false,
  });

  const [newNotifications, setNewNotifications] = useState({
    agents: [],
    customers: [],
    properties: [],
    requestedProperties: [],
    skilled: [],
    investors: [],
    expertRequests: [],
    expertRegistrations: [],
    expertCallRequests: [],
  });

  const [notificationCounts, setNotificationCounts] = useState({
    agents: 0,
    customers: 0,
    properties: 0,
    requestedProperties: 0,
    skilled: 0,
    investors: 0,
    expertRequests: 0,
    expertRegistrations: 0,
    expertCallRequests: 0,
  });

  const [pendingNotifications, setPendingNotifications] = useState({
    agents: [],
    customers: [],
    properties: [],
    requestedProperties: [],
    skilled: [],
    investors: [],
    expertRequests: [],
    expertRegistrations: [],
    expertCallRequests: [],
  });

  const [pendingCounts, setPendingCounts] = useState({
    agents: 0,
    customers: 0,
    properties: 0,
    requestedProperties: 0,
    skilled: 0,
    investors: 0,
    expertRequests: 0,
    expertRegistrations: 0,
    expertCallRequests: 0,
  });

  const navigation = useNavigation();
  const soundRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const processedNotificationIds = useRef(new Set());
  const [appState, setAppState] = useState(AppState.currentState);
  const socketRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
  // Initialize socket connection
  const socket = io(API_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
  });

  socketRef.current = socket;

  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}, []);

  useEffect(() => {
    const trackInitialLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

        if (callexecutiveId) {
          await fetch(
            `${API_URL}/callexe/${callexecutiveId}/update-login-time`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                token: `${token}` || "",
              },
            }
          );
        }
      } catch (error) {
        console.error("Error tracking initial login:", error);
      }
    };

    trackInitialLogin();
    getDetails();
    fetchPendingItems();
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log("App state changed to:", nextAppState);

      if (nextAppState === "background") {
        // Register background task when going to background
        await registerBackgroundFetch();
      } else if (nextAppState === "active") {
        // Check for pending items when coming to foreground
        fetchPendingItems();
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isActive, notificationSettings]);

  const registerBackgroundFetch = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 1 * 60, // Check every 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background fetch registered successfully");
    } catch (err) {
      console.log("Background Fetch failed to register", err);
    }
  };

  const fetchPendingItems = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

      const response = await fetch(
        `${API_URL}/callexe/${callexecutiveId}/pending-items`,
        {
          headers: { token },
        }
      );

      if (response.ok) {
        const { pendingItems } = await response.json();
        console.log("Pending items received:", pendingItems);

        if (pendingItems) {
          const newPendingNotifications = { ...pendingNotifications };
          const newPendingCounts = { ...pendingCounts };

          Object.entries(pendingItems).forEach(([type, items]) => {
            if (items && items.length > 0) {
              newPendingNotifications[type] = [
                ...items.map((item) => ({
                  ...item,
                  type,
                  createdAt: item.createdAt || new Date().toISOString(),
                  isPending: true,
                })),
              ];

              newPendingCounts[type] = items.length;

              // Play sound if there are pending items and user is active
              if (isActive && notificationSettings[type] && items.length > 0) {
                playNotificationSound();
              }
            }
          });

          setPendingNotifications(newPendingNotifications);
          setPendingCounts(newPendingCounts);
        }
      }
    } catch (error) {
      console.error("Error fetching pending items:", error);
    }
  };

  const trackLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

      if (callexecutiveId) {
        await fetch(
          `${API_URL}/callexe/${callexecutiveId}/update-logout-time`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              token: `${token}` || "",
            },
          }
        );
      }
    } catch (error) {
      console.error("Error tracking logout:", error);
    }
  };

  const loadSound = async () => {
    try {
      if (isWeb) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/siren.mp3")
      );
      soundRef.current = sound;
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  };

  const playNotificationSound = async () => {
    try {
      // Stop any existing sound
      if (soundIntervalRef.current) {
        stopNotificationSound();
      }

      if (
        (isWeb && !audioContextRef.current) ||
        (!isWeb && !soundRef.current)
      ) {
        await loadSound();
      }

      if (isWeb) {
        const response = await fetch(require("../assets/siren.mp3"));
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(
          arrayBuffer
        );

        const playSound = () => {
          if (!soundIntervalRef.current) return;

          audioSourceRef.current = audioContextRef.current.createBufferSource();
          audioSourceRef.current.buffer = audioBuffer;
          audioSourceRef.current.connect(audioContextRef.current.destination);
          audioSourceRef.current.start();

          audioSourceRef.current.onended = () => {
            if (soundIntervalRef.current) {
              setTimeout(playSound, 500);
            }
          };
        };

        soundIntervalRef.current = true;
        playSound();
      } else {
        if (soundRef.current) {
          // For mobile, play sound in a loop
          const playLoop = async () => {
            try {
              await soundRef.current.replayAsync();
              if (soundIntervalRef.current) {
                setTimeout(playLoop, 3000);
              }
            } catch (error) {
              console.error("Error in play loop:", error);
            }
          };

          soundIntervalRef.current = true;
          await playLoop();
        }
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const stopNotificationSound = () => {
    soundIntervalRef.current = false;

    if (isWeb) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
    } else {
      if (soundRef.current) {
        soundRef.current.stopAsync();
      }
    }
  };
useEffect(() => {
  if (!socketRef.current) return;

  const socket = socketRef.current;
const handleNewNotification = (type, data) => {
  const notificationId = data._id || `${type}-${Date.now()}`;

  // Only process if not already processed or if it's a pending item
  if (!processedNotificationIds.current.has(notificationId) || data.isPending) {
    processedNotificationIds.current.add(notificationId);

    setNewNotifications(prev => ({
      ...prev,
      [type]: [
        {
          ...data,
          type,
          createdAt: data.createdAt || new Date().toISOString(),
          isPending: data.isPending || false,
        },
        ...prev[type],
      ],
    }));

    setNotificationCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    // Always play sound for pending items if active
    if (isActive && (notificationSettings[type] || data.isPending)) {
      playNotificationSound();
      
      Notifications.scheduleNotificationAsync({
        content: {
          title: `New ${type}`,
          body: `New ${type} registered: ${
            data.FullName || data.propertyType || "Item"
          }`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    }
  }
};

  const handleAssignedByOther = (data) => {
    const { type, id } = data;

    // Remove from new notifications if present
    setNewNotifications(prev => {
      const updatedNew = {
        ...prev,
        [type]: prev[type].filter(item => item._id !== id)
      };
      
      // Check if we should stop the sound
      const totalNew = Object.values(updatedNew).reduce(
        (sum, items) => sum + items.length, 
        0
      );
      const totalPending = Object.values(pendingNotifications).reduce(
        (sum, items) => sum + items.length, 
        0
      );
      
      if (totalNew + totalPending <= 0) {
        stopNotificationSound();
      }

      return updatedNew;
    });

    // Remove from pending notifications if present
    setPendingNotifications(prev => {
      const updatedPending = {
        ...prev,
        [type]: prev[type].filter(item => item._id !== id)
      };
      
      return updatedPending;
    });

    // Update counts
    setNotificationCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1)
    }));

    setPendingCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1)
    }));
  };

  const notificationHandlers = {
    new_agent: (data) => handleNewNotification("agents", data.agent),
    new_customer: (data) => handleNewNotification("customers", data.customer),
    new_property: (data) => handleNewNotification("properties", data.property),
    new_requested_property: (data) => 
      handleNewNotification("requestedProperties", data.property),
    new_skilled_labor: (data) => handleNewNotification("skilled", data.labor),
    new_investor: (data) => handleNewNotification("investors", data.investor),
    new_requestExpert: (data) => 
      handleNewNotification("expertRequests", data.expert),
    new_Expert: (data) => 
      handleNewNotification("expertRegistrations", data.expert),
    new_requestedExpert: (data) => 
      handleNewNotification("expertCallRequests", data.expert),
    assigned_by_other: handleAssignedByOther,
  };

  // Set up all event listeners
  Object.entries(notificationHandlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });

  // Cleanup function
  return () => {
    Object.entries(notificationHandlers).forEach(([event, handler]) => {
      socket.off(event, handler);
    });
  };
}, [isActive, notificationSettings, notificationCounts, pendingCounts, pendingNotifications]);

  const toggleStatus = async () => {
    const newStatus = !isActive;

    try {
      const token = await AsyncStorage.getItem("authToken");
      const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

      const newNotificationSettings = newStatus
        ? notificationSettings
        : Object.keys(notificationSettings).reduce((acc, key) => {
            acc[key] = false;
            return acc;
          }, {});

      const endpoint = newStatus
        ? `${API_URL}/callexe/${callexecutiveId}/update-login-time`
        : `${API_URL}/callexe/${callexecutiveId}/update-logout-time`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          token: `${token}` || "",
        },
        body: JSON.stringify({
          status: newStatus ? "active" : "inactive",
          notificationSettings: newNotificationSettings,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsActive(newStatus);
        setNotificationSettings(newNotificationSettings);
        await AsyncStorage.setItem(
          "userStatus",
          newStatus ? "active" : "inactive"
        );

        if (!newStatus) {
          stopNotificationSound();
        } else {
          // When going active, check for pending items
          fetchPendingItems();
        }
      } else {
        console.error("Failed to toggle status:", result.message);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const toggleNotificationSetting = async (type) => {
    if (!isActive) {
      Alert.alert(
        "Error",
        "Please activate your status first to change notification settings"
      );
      return;
    }

    const newSettings = {
      ...notificationSettings,
      [type]: !notificationSettings[type],
    };

    try {
      const token = await AsyncStorage.getItem("authToken");
      const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

      const response = await fetch(
        `${API_URL}/callexe/${callexecutiveId}/notification-settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            token: `${token}` || "",
          },
          body: JSON.stringify({
            notificationSettings: newSettings,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setNotificationSettings(newSettings);

        // If enabling this notification type, fetch pending items
        if (newSettings[type]) {
          fetchPendingItemsForType(type);
        } else {
          // If disabling, clear pending notifications for this type
          setPendingNotifications((prev) => ({
            ...prev,
            [type]: [],
          }));
          setPendingCounts((prev) => ({
            ...prev,
            [type]: 0,
          }));
        }
      } else {
        throw new Error(result.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  const fetchPendingItemsForType = async (type) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

      const response = await fetch(
        `${API_URL}/callexe/${callexecutiveId}/pending-items/${type}`,
        {
          headers: { token },
        }
      );

      if (response.ok) {
        const { pendingItems } = await response.json();

        if (pendingItems && pendingItems.length > 0) {
          setPendingNotifications((prev) => ({
            ...prev,
            [type]: [
              ...pendingItems.map((item) => ({
                ...item,
                type,
                createdAt: item.createdAt || new Date().toISOString(),
                isPending: true,
              })),
              ...prev[type],
            ],
          }));

          setPendingCounts((prev) => ({
            ...prev,
            [type]: pendingItems.length,
          }));

          // Play sound if there are pending items and user is active
          if (isActive && notificationSettings[type]) {
            playNotificationSound();
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching pending items for ${type}:`, error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  const toggleMenuItem = (title) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleSubItemClick = (subItem) => {
    setIsViewCustVisible(false);
    setIsViewAgentVisible(false);
    setIsViewPostPropVisible(false);
    setIsViewRequestedPropVisible(false);
    setIsViewAgentContVisible(false);
    setIsCustCallVisible(false);
    setViewApprovedProperties(false);
    setExpertPanelReq(false);
    setIsViewInvestVisible(false);
    setIsViewSkillVisible(false);
    setIsViewNriVisible(false);
    setViewallagents(false);
    setExpertPanel(false);
    setNewExperts(false);

    if (isMobile) {
      setIsSidebarExpanded(false);
    }

    switch (subItem) {
      case "Dashboard":
        break;
      case "View Customers":
        setIsViewCustVisible(true);
        break;
      case "View Agents":
        setIsViewAgentVisible(true);
        break;
      case "View Posted Properties":
        setIsViewPostPropVisible(true);
        break;
      case "View Requested Properties":
        setIsViewRequestedPropVisible(true);
        break;
      case "View Agents Contacts":
        setIsViewAgentContVisible(true);
        break;
      case "View Customer Contacts":
        setIsCustCallVisible(true);
        break;
      case "ViewApprovedProperties":
        setViewApprovedProperties(true);
        break;
      case "Expert Panel Requests":
        setExpertPanelReq(true);
        break;
      case "View Investors":
        setIsViewInvestVisible(true);
        break;
      case "View Skilled Resource":
        setIsViewSkillVisible(true);
        break;
      case "View All Agents":
        setViewallagents(true);
        break;
      case "ExpertPanel":
        setExpertPanel(true);
        break;
      case "NewExperts":
        setNewExperts(true);
        break;
      case "View NRI Members":
        setIsViewNriVisible(true);
        break;
      default:
        break;
    }
  };

  const closeModal = () => {
    setIsViewCustVisible(false);
    setIsViewAgentVisible(false);
    setIsViewPostPropVisible(false);
    setIsViewRequestedPropVisible(false);
    setIsViewAgentContVisible(false);
    setIsCustCallVisible(false);
    setIsViewInvestVisible(false);
    setIsViewSkillVisible(false);
    setIsViewNriVisible(false);
    setViewallagents(false);
    setExpertPanel(false);
    setNewExperts(false);
  };

  const renderContent = () => {
    if (isViewAgentVisible) return <ViewAgents />;
    if (isViewCustVisible) return <ViewCustomers />;
    if (isViewPostPropVisible) return <ViewPostedProperties />;
    if (isViewRequestedPropVisible) return <RequestedProperties />;
    if (isViewAgentContVsible) return <ViewAgentsCall />;
    if (isCustCallVisible) return <ViewCustomersCalls />;
    if (isExpertPanelReq) return <ExpertPanelReq />;
    if (isViewInvestVisible) return <ViewAllInvesters />;
    if (isViewSkillVisible) return <AllSkilledLabours />;
    if (isViewNriVisible) return <ViewNri />;
    if (isViewApprovedProperties) return <ViewApprovedProperties />;
    if (isViewallagents) return <Viewallagents />;
    if (isExpertPanel) return <ExpertPanel />;
    if (isNewExperts) return <NewExperts />;
    return <Dashboard />;
  };

  const resetToDashboard = () => {
    setIsViewCustVisible(false);
    setIsViewAgentVisible(false);
    setIsViewPostPropVisible(false);
    setIsViewRequestedPropVisible(false);
    setIsViewAgentContVisible(false);
    setIsCustCallVisible(false);
    setViewApprovedProperties(false);
    setExpertPanelReq(false);
    setIsViewInvestVisible(false);
    setIsViewSkillVisible(false);
    setIsViewNriVisible(false);
    setViewallagents(false);
    setExpertPanel(false);
    setNewExperts(false);
  };

  const getNavigationScreen = (type) => {
    switch (type) {
      case "agents":
        return "View Agents";
      case "customers":
        return "View Customers";
      case "properties":
        return "View Posted Properties";
      case "requestedProperties":
        return "View Requested Properties";
      case "skilled":
        return "View Skilled Resource";
      case "investors":
        return "View Investors";
      case "expertRequests":
      case "expertCallRequests":
        return "Expert Panel Requests";
      case "expertRegistrations":
        return "ExpertPanel";
      default:
        return "Dashboard";
    }
  };

  const renderNotificationCard = (item, type) => {
    let title, name, phone, location;
    switch (type) {
      case "agents":
        title = item.isPending ? "Pending Agent" : "New Agent";
        name = item.FullName || "No name";
        phone = item.MobileNumber || "No phone";
        location = item.District || "No location";
        break;
      case "customers":
        title = item.isPending ? "Pending Customer" : "New Customer";
        name = item.FullName || "No name";
        phone = item.MobileNumber || "No phone";
        location = item.District || "No location";
        break;
      case "properties":
        title = item.isPending ? "Pending Property" : "New Property";
        name = item.propertyType || "No title";
        phone = item.PostedBy || "No phone";
        location =
          `${item.location || ""}, ${item.Constituency || ""}`.trim() ||
          "No location";
        break;
      case "requestedProperties":
        title = item.isPending
          ? "Pending Requested Property"
          : "Requested Property";
        name = item.propertyTitle || "No title";
        phone = item.PostedBy || "No phone";
        location = item.location || "No location";
        break;
      case "skilled":
        title = item.isPending ? "Pending Skilled Labor" : "New Skilled Labor";
        name = item.FullName || "No name";
        phone = item.MobileNumber || "No phone";
        location = item.District || "No location";
        break;
      case "investors":
        title = item.isPending ? "Pending Investor" : "New Investor";
        name = item.FullName || "No name";
        phone = item.MobileNumber || "No phone";
        location = item.District || "No location";
        break;
      case "expertRequests":
        title = item.isPending ? "Pending Expert Request" : "Expert Request";
        name = item.expertType || "No type";
        phone = item.WantedBy || "No requester";
        location = item.reason || "No reason provided";
        break;
      case "expertRegistrations":
        title = item.isPending
          ? "Pending Expert Registration"
          : "Expert Registration";
        name = item.name || "No name";
        phone = item.mobile || "No phone";
        location = item.expertType || "No type";
        break;
      case "expertCallRequests":
        title = item.isPending
          ? "Pending Expert Call Request"
          : "Expert Call Request";
        name = item.Name || "No name";
        phone = item.MobileNumber || "No phone";
        location = item.ExpertType || "No type";
        break;
      default:
        return null;
    }

    return (
      <View
        style={[
          styles.notificationCard,
          item.isPending && styles.pendingNotificationCard,
        ]}
        key={`${type}-${item._id}`}
      >
        <View
          style={[
            styles.notificationCardHeader,
            item.isPending && styles.pendingNotificationHeader,
          ]}
        >
          <Text
            style={[styles.newBadge, item.isPending && styles.pendingBadge]}
          >
            {title}
          </Text>
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.notificationCardBody}>
          <Image
            source={item.photo ? { uri: `${API_URL}${item.photo}` } : logo1}
            style={styles.notificationAvatar}
            onError={(e) =>
              console.log("Error loading image:", e.nativeEvent.error)
            }
          />
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationName}>{name}</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.notificationDetail}>
                <MaterialIcons name="phone" size={14} color="#555" /> {phone}
              </Text>
              {phone && (
                <TouchableOpacity
                  style={styles.smallCallButton}
                  onPress={() => phone && Linking.openURL(`tel:${phone}`)}
                >
                  <Ionicons name="call" size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.notificationDetail}>
              <MaterialIcons name="location-on" size={14} color="#555" />{" "}
              {location}
            </Text>

            <View style={styles.notificationButtons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => {
                  handleAcceptNotification(type, item._id, item.isPending);
                  handleSubItemClick(getNavigationScreen(type));
                }}
              >
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.buttonText}> Accept</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={styles.rejectButton}
                onPress={() =>
                  handleRejectNotification(type, item._id, item.isPending)
                }
              >
                <Ionicons name="close" size={18} color="white" />
                <Text style={styles.buttonText}> Reject</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </View>
    );
  };

 const handleAcceptNotification = async (type, id, isPending) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const executiveId = await AsyncStorage.getItem("callexecutiveId");

    const response = await fetch(`${API_URL}/callexe/${type}/${id}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token || "",
      },
      body: JSON.stringify({ executiveId }),
    });

    if (response.ok) {
      // Update state immediately
      if (isPending) {
        setPendingNotifications(prev => ({
          ...prev,
          [type]: prev[type].filter(item => item._id !== id)
        }));
        setPendingCounts(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1)
        }));
      } else {
        setNewNotifications(prev => ({
          ...prev,
          [type]: prev[type].filter(item => item._id !== id)
        }));
        setNotificationCounts(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1)
        }));
      }

      // Check if we should stop the sound
      const totalNew = Object.values(notificationCounts).reduce((sum, count) => sum + count, 0);
      const totalPending = Object.values(pendingCounts).reduce((sum, count) => sum + count, 0);
      
      if (totalNew + totalPending <= 0) {
        stopNotificationSound();
      }

      Alert.alert("Success", `${type} accepted successfully`);
    } else {
      const errorData = await response.json();
      Alert.alert("Error", errorData.message || "Failed to accept");
    }
  } catch (error) {
    console.error("Error accepting notification:", error);
    Alert.alert("Error", "Failed to accept. Please try again.");
  }
};

  const handleRejectNotification = async (type, id, isPending) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const executiveId = await AsyncStorage.getItem("callexecutiveId");

      const response = await fetch(`${API_URL}/callexe/${type}/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token || "",
        },
        body: JSON.stringify({ executiveId }),
      });

      if (response.ok) {
        if (isPending) {
          setPendingNotifications((prev) => ({
            ...prev,
            [type]: prev[type].filter((item) => item._id !== id),
          }));

          setPendingCounts((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] - 1),
          }));
        } else {
          setNewNotifications((prev) => ({
            ...prev,
            [type]: prev[type].filter((item) => item._id !== id),
          }));

          setNotificationCounts((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] - 1),
          }));
        }

        const totalNew = Object.values(notificationCounts).reduce(
          (sum, count) => sum + count,
          0
        );

        const totalPending = Object.values(pendingCounts).reduce(
          (sum, count) => sum + count,
          0
        );

        if (totalNew + totalPending <= 0) {
          stopNotificationSound();
        }

        Alert.alert("Success", `${type} rejected successfully`);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to reject");
      }
    } catch (error) {
      console.error("Error rejecting notification:", error);
      Alert.alert("Error", "Failed to reject. Please try again.");
    }
  };

  const renderNotificationSettings = () => (
    <View style={styles.notificationSettingsContainer}>
      <TouchableOpacity
        style={styles.settingsHeader}
        onPress={toggleNotificationSettings}
      >
        <Text style={styles.settingsTitle}>Notification Settings</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-down" size={24} color="#555" />
        </Animated.View>
      </TouchableOpacity>

      {showNotificationSettings && (
        <>
          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("View Agents");
              }}
            >
              <Text>Agents</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.agents && isActive}
              onValueChange={() => toggleNotificationSetting("agents")}
              disabled={!isActive}
            />
            {(notificationCounts.agents > 0 || pendingCounts.agents > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.agents + pendingCounts.agents}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("View Customers");
              }}
            >
              <Text>Customers</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.customers && isActive}
              onValueChange={() => toggleNotificationSetting("customers")}
              disabled={!isActive}
            />
            {(notificationCounts.customers > 0 ||
              pendingCounts.customers > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.customers + pendingCounts.customers}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("View Posted Properties");
              }}
            >
              <Text>Properties</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.properties && isActive}
              onValueChange={() => toggleNotificationSetting("properties")}
              disabled={!isActive}
            />
            {(notificationCounts.properties > 0 ||
              pendingCounts.properties > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.properties + pendingCounts.properties}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("View Requested Properties");
              }}
            >
              <Text>Requested Properties</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.requestedProperties && isActive}
              onValueChange={() =>
                toggleNotificationSetting("requestedProperties")
              }
              disabled={!isActive}
            />
            {(notificationCounts.requestedProperties > 0 ||
              pendingCounts.requestedProperties > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.requestedProperties +
                    pendingCounts.requestedProperties}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("View Skilled Resource");
              }}
            >
              <Text>Skilled Resources</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.skilled && isActive}
              onValueChange={() => toggleNotificationSetting("skilled")}
              disabled={!isActive}
            />
            {(notificationCounts.skilled > 0 || pendingCounts.skilled > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.skilled + pendingCounts.skilled}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("View Investors");
              }}
            >
              <Text>Investors</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.investors && isActive}
              onValueChange={() => toggleNotificationSetting("investors")}
              disabled={!isActive}
            />
            {(notificationCounts.investors > 0 ||
              pendingCounts.investors > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.investors + pendingCounts.investors}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("Expert Panel Requests");
              }}
            >
              <Text>Expert Requests</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.expertRequests && isActive}
              onValueChange={() => toggleNotificationSetting("expertRequests")}
              disabled={!isActive}
            />
            {(notificationCounts.expertRequests > 0 ||
              pendingCounts.expertRequests > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.expertRequests +
                    pendingCounts.expertRequests}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("ExpertPanel");
              }}
            >
              <Text>Expert Registrations</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.expertRegistrations && isActive}
              onValueChange={() =>
                toggleNotificationSetting("expertRegistrations")
              }
              disabled={!isActive}
            />
            {(notificationCounts.expertRegistrations > 0 ||
              pendingCounts.expertRegistrations > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.expertRegistrations +
                    pendingCounts.expertRegistrations}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingRow}>
            <TouchableOpacity
              style={styles.settingLabel}
              onPress={(e) => {
                e.stopPropagation();
                handleSubItemClick("NewExperts");
              }}
            >
              <Text>Expert Call Requests</Text>
            </TouchableOpacity>
            <Switch
              value={notificationSettings.expertCallRequests && isActive}
              onValueChange={() =>
                toggleNotificationSetting("expertCallRequests")
              }
              disabled={!isActive}
            />
            {(notificationCounts.expertCallRequests > 0 ||
              pendingCounts.expertCallRequests > 0) && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {notificationCounts.expertCallRequests +
                    pendingCounts.expertCallRequests}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderNotifications = () => {
    const totalNewNotifications = Object.values(notificationCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    const totalPendingNotifications = Object.values(pendingCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    const totalNotifications =
      totalNewNotifications + totalPendingNotifications;

    if (totalNotifications === 0 || !isActive) return null;

    return (
      <View style={styles.notificationsContainer}>
        <Text style={styles.sectionTitle}>
          Requests ({totalNotifications})
          {totalPendingNotifications > 0 && (
            <Text style={styles.pendingCountText}>
              {" "}
              ({totalPendingNotifications} pending)
            </Text>
          )}
        </Text>

        {notificationCounts.agents > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Agents ({notificationCounts.agents})
            </Text>
            {newNotifications.agents.map((agent) =>
              renderNotificationCard(agent, "agents")
            )}
          </View>
        )}

        {pendingCounts.agents > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Agents ({pendingCounts.agents})
            </Text>
            {pendingNotifications.agents.map((agent) =>
              renderNotificationCard(agent, "agents")
            )}
          </View>
        )}

        {notificationCounts.customers > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Customers ({notificationCounts.customers})
            </Text>
            {newNotifications.customers.map((customer) =>
              renderNotificationCard(customer, "customers")
            )}
          </View>
        )}

        {pendingCounts.customers > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Customers ({pendingCounts.customers})
            </Text>
            {pendingNotifications.customers.map((customer) =>
              renderNotificationCard(customer, "customers")
            )}
          </View>
        )}

        {notificationCounts.properties > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Properties ({notificationCounts.properties})
            </Text>
            {newNotifications.properties.map((property) =>
              renderNotificationCard(property, "properties")
            )}
          </View>
        )}

        {pendingCounts.properties > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Properties ({pendingCounts.properties})
            </Text>
            {pendingNotifications.properties.map((property) =>
              renderNotificationCard(property, "properties")
            )}
          </View>
        )}

        {notificationCounts.requestedProperties > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Requested Properties ({notificationCounts.requestedProperties})
            </Text>
            {newNotifications.requestedProperties.map((property) =>
              renderNotificationCard(property, "requestedProperties")
            )}
          </View>
        )}

        {pendingCounts.requestedProperties > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Requested Properties ({pendingCounts.requestedProperties})
            </Text>
            {pendingNotifications.requestedProperties.map((property) =>
              renderNotificationCard(property, "requestedProperties")
            )}
          </View>
        )}

        {notificationCounts.skilled > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Skilled Resources ({notificationCounts.skilled})
            </Text>
            {newNotifications.skilled.map((labor) =>
              renderNotificationCard(labor, "skilled")
            )}
          </View>
        )}

        {pendingCounts.skilled > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Skilled Resources ({pendingCounts.skilled})
            </Text>
            {pendingNotifications.skilled.map((labor) =>
              renderNotificationCard(labor, "skilled")
            )}
          </View>
        )}

        {notificationCounts.investors > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Investors ({notificationCounts.investors})
            </Text>
            {newNotifications.investors.map((investor) =>
              renderNotificationCard(investor, "investors")
            )}
          </View>
        )}

        {pendingCounts.investors > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Investors ({pendingCounts.investors})
            </Text>
            {pendingNotifications.investors.map((investor) =>
              renderNotificationCard(investor, "investors")
            )}
          </View>
        )}

        {notificationCounts.expertRequests > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Expert Requests ({notificationCounts.expertRequests})
            </Text>
            {newNotifications.expertRequests.map((request) =>
              renderNotificationCard(request, "expertRequests")
            )}
          </View>
        )}

        {pendingCounts.expertRequests > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Expert Requests ({pendingCounts.expertRequests})
            </Text>
            {pendingNotifications.expertRequests.map((request) =>
              renderNotificationCard(request, "expertRequests")
            )}
          </View>
        )}

        {notificationCounts.expertRegistrations > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Expert Registrations ({notificationCounts.expertRegistrations})
            </Text>
            {newNotifications.expertRegistrations.map((expert) =>
              renderNotificationCard(expert, "expertRegistrations")
            )}
          </View>
        )}

        {pendingCounts.expertRegistrations > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Expert Registrations ({pendingCounts.expertRegistrations})
            </Text>
            {pendingNotifications.expertRegistrations.map((expert) =>
              renderNotificationCard(expert, "expertRegistrations")
            )}
          </View>
        )}

        {notificationCounts.expertCallRequests > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Expert Call Requests ({notificationCounts.expertCallRequests})
            </Text>
            {newNotifications.expertCallRequests.map((call) =>
              renderNotificationCard(call, "expertCallRequests")
            )}
          </View>
        )}

        {pendingCounts.expertCallRequests > 0 && (
          <View style={styles.notificationSection}>
            <Text style={styles.subSectionTitle}>
              Pending Expert Call Requests ({pendingCounts.expertCallRequests})
            </Text>
            {pendingNotifications.expertCallRequests.map((call) =>
              renderNotificationCard(call, "expertCallRequests")
            )}
          </View>
        )}
      </View>
    );
  };

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/callexe/getcallexe`, {
        method: "GET",
        headers: {
          token: ` ${token}` || "",
        },
      });
      const userDetails = await response.json();
      setDetails(userDetails);
      AsyncStorage.setItem("callexecutiveId", userDetails._id);

      setNotificationSettings(
        userDetails.notificationSettings || {
          agents: false,
          customers: false,
          properties: false,
          requestedProperties: false,
          skilled: false,
          investors: false,
          expertRequests: false,
          expertRegistrations: false,
          expertCallRequests: false,
        }
      );

      setIsActive(userDetails.status === "active");

      const baseMenuItems = [
        {
          title: "Dashboard",
          icon: "home-outline",
          subItems: ["Dashboard"],
        },
        {
          title: "View Approved Properties",
          icon: "checkmark-done-outline",
          subItems: ["ViewApprovedProperties"],
        },
      ];

      switch (userDetails.assignedType) {
        case "Agent_Wealth_Associate":
          baseMenuItems.push({
            title: "Agents",
            icon: "person-outline",
            subItems: ["View Agents","View All Agents", "View Customers"],
          });
          break;
        case "Customers":
          baseMenuItems.push({
            title: "Customers",
            icon: "people-outline",
            subItems: ["View Customers", "View Agents"],
          });
          break;
        case "Property":
          baseMenuItems.push({
            title: "Properties",
            icon: "business-outline",
            subItems: ["View Posted Properties", "View Requested Properties"],
          });
          break;
        case "ExpertPanel":
          baseMenuItems.push({
            title: "Expert Panel",
            icon: "cog-outline",
            subItems: ["Expert Panel Requests", "ExpertPanel", "NewExperts"],
          });
          break;
        default:
          baseMenuItems.push(
            {
              title: "Agents",
              icon: "person-outline",
              subItems: ["View Agents", "View Agents Contacts"],
            },
            {
              title: "Customers",
              icon: "people-outline",
              subItems: ["View Customers", "View Customer Contacts"],
            },
            {
              title: "Properties",
              icon: "business-outline",
              subItems: ["View Posted Properties", "View Requested Properties"],
            },
            {
              title: "Expert Panel",
              icon: "cog-outline",
              subItems: ["Expert Panel Requests", "ExpertPanel", "NewExperts"],
            }
          );
      }

      baseMenuItems.push({
        title: "View",
        icon: "eye-outline",
        subItems: [
          "View Skilled Resource",
          "View NRI Members",
          "View Investors",
          "View All Agents",
        ],
      });

      setMenuItems(baseMenuItems);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchNewRequests = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/callexe/newrequests`, {
        headers: { token },
      });

      if (response.ok) {
        const data = await response.json();
        // Process the new requests data
      }
    } catch (error) {
      console.error("Error fetching new requests:", error);
    }
  };

  const toggleNotificationSettings = () => {
    Animated.timing(rotateAnim, {
      toValue: showNotificationSettings ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowNotificationSettings(!showNotificationSettings);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.container}>
      {Platform.OS === "android" && (
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      )}

      <View style={styles.navbar}>
        <TouchableOpacity onPress={resetToDashboard}>
          <Image
            source={require("../CallCenterDash/assets/logo.png")}
            style={styles.logo}
          />
        </TouchableOpacity>
        <View style={styles.sear_icons}>
          <View style={styles.rightIcons}>
            <TouchableOpacity
              onPress={toggleStatus}
              style={styles.toggleContainer}
            >
              <View
                style={[
                  styles.toggleTrack,
                  isActive ? styles.toggleActive : styles.toggleInactive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    isActive ? styles.thumbActive : styles.thumbInactive,
                  ]}
                />
              </View>
              <Text style={styles.toggleText}>
                {isActive ? "Active" : "Inactive"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notificationBadgeContainer}>
              <Ionicons name="notifications" size={24} color="#333" />
              {Object.values(notificationCounts).reduce(
                (sum, count) => sum + count,
                0
              ) +
                Object.values(pendingCounts).reduce(
                  (sum, count) => sum + count,
                  0
                ) >
                0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {Object.values(notificationCounts).reduce(
                      (sum, count) => sum + count,
                      0
                    ) +
                      Object.values(pendingCounts).reduce(
                        (sum, count) => sum + count,
                        0
                      )}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {details && (
              <Text style={styles.userName}>{details.name || "User"}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {(!isMobile || isSidebarExpanded) && (
          <View
            style={[
              styles.sidebar,
              isMobile && styles.mobileSidebar,
              isMobile && isSidebarExpanded && styles.expandedMobileSidebar,
            ]}
          >
            <ScrollView style={styles.sidebarScroll}>
              <FlatList
                data={menuItems}
                keyExtractor={(item) => item.title}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.menuItemContainer}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        if (item.subItems.length === 1) {
                          handleSubItemClick(item.subItems[0]);
                          if (isMobile) setIsSidebarExpanded(false);
                        } else {
                          toggleMenuItem(item.title);
                        }
                      }}
                    >
                      <Ionicons name={item.icon} size={24} color="#555" />
                      <Text style={styles.menuText}>{item.title}</Text>
                      {item.subItems.length > 1 && (
                        <Ionicons
                          name={
                            expandedItems[item.title]
                              ? "chevron-up-outline"
                              : "chevron-down-outline"
                          }
                          size={16}
                          color="#555"
                          style={styles.chevronIcon}
                        />
                      )}
                    </TouchableOpacity>

                    {expandedItems[item.title] && item.subItems && (
                      <View style={styles.subMenuContainer}>
                        {item.subItems.map((sub, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.subMenuItem}
                            onPress={() => {
                              handleSubItemClick(sub);
                              if (isMobile) setIsSidebarExpanded(false);
                            }}
                          >
                            <Text style={styles.subMenuText}>{sub}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              />
              <Text style={styles.lastUpdated}>
                Last Updated: {new Date().toLocaleDateString()}
              </Text>
            </ScrollView>
          </View>
        )}

        <View
          style={[
            styles.contentArea,
            isMobile && isSidebarExpanded && styles.contentAreaHidden,
          ]}
        >
          {isWeb ? (
            <div style={{ height: "100%", overflowY: "auto" }}>
              <View style={styles.userContent}>
                {details && (
                  <>
                    <Text style={styles.usersContentText}>
                      Welcome Back:{" "}
                      <Text style={{ color: "#E82E5F" }}>
                        {details.name || "User"}
                      </Text>
                    </Text>
                    <Text style={styles.usersContentText}>
                      Phone number:{" "}
                      <Text style={{ color: "#E82E5F" }}>
                        {details.phone || "N/A"}
                      </Text>
                    </Text>
                    <Text style={styles.usersContentText}>
                      Role:{" "}
                      <Text style={{ color: "#E82E5F" }}>
                        {details.assignedType || "N/A"}
                      </Text>
                    </Text>
                    <Text style={styles.usersContentText}>
                      Status:{" "}
                      <Text style={{ color: isActive ? "#4CAF50" : "#9E9E9E" }}>
                        {isActive ? "Active" : "Inactive"}
                      </Text>
                    </Text>

                    {renderNotificationSettings()}
                    {renderNotifications()}
                  </>
                )}
                {renderContent()}
              </View>
            </div>
          ) : (
            <ScrollView style={styles.contentScroll}>
              <View style={styles.userContent}>
                {details && (
                  <>
                    <Text style={styles.usersContentText}>
                      Welcome Back:{" "}
                      <Text style={{ color: "#E82E5F" }}>
                        {details.name || "User"}
                      </Text>
                    </Text>
                    <Text style={styles.usersContentText}>
                      Phone number:{" "}
                      <Text style={{ color: "#E82E5F" }}>
                        {details.phone || "N/A"}
                      </Text>
                    </Text>
                    <Text style={styles.usersContentText}>
                      Role:{" "}
                      <Text style={{ color: "#E82E5F" }}>
                        {details.assignedType || "N/A"}
                      </Text>
                    </Text>
                    <Text style={styles.usersContentText}>
                      Status:{" "}
                      <Text style={{ color: isActive ? "#4CAF50" : "#9E9E9E" }}>
                        {isActive ? "Active" : "Inactive"}
                      </Text>
                    </Text>

                    {renderNotificationSettings()}
                    {renderNotifications()}
                  </>
                )}
                {renderContent()}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {isMobile && (
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isSidebarExpanded && styles.toggleButtonExpanded,
          ]}
          onPress={toggleSidebar}
        >
          <Ionicons
            name={isSidebarExpanded ? "close-outline" : "menu-outline"}
            size={30}
            color="#000"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    ...(isWeb && {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
    }),
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    justifyContent: "space-between",
  },
  logo: {
    width: 100,
    height: 60,
    resizeMode: "contain",
    left: 50,
  },
  sear_icons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userName: {
    marginLeft: 10,
    fontWeight: "bold",
    color: "#555",
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRightWidth: 1,
    borderColor: "#ddd",
    width: 250,
  },
  mobileSidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  expandedMobileSidebar: {
    width: width * 0.8,
  },
  sidebarScroll: {
    flex: 1,
  },
  menuItemContainer: {
    marginBottom: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  chevronIcon: {
    marginLeft: "auto",
  },
  subMenuContainer: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: "#E82E5F",
    paddingLeft: 10,
  },
  subMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  subMenuText: {
    fontSize: 14,
    color: "#555",
    paddingVertical: 5,
  },
  lastUpdated: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#F0F5F5",
    ...(isWeb && {
      height: "calc(100vh - 80px)",
      overflow: "auto",
    }),
  },
  contentAreaHidden: {
    opacity: 0.3,
  },
  contentScroll: {
    flex: 1,
    ...(isWeb && {
      height: "100%",
      overflowY: "auto",
    }),
  },
  userContent: {
    backgroundColor: "#fff",
    padding: 15,
    margin: 10,
    borderRadius: 5,
  },
  usersContentText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  toggleButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 101,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  toggleButtonExpanded: {
    left: width * 0.8 - 40,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    left: 40,
    top: 10,
  },
  toggleTrack: {
    width: 50,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
  },
  toggleInactive: {
    backgroundColor: "#9E9E9E",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  thumbActive: {
    alignSelf: "flex-end",
  },
  thumbInactive: {
    alignSelf: "flex-start",
  },
  toggleText: {
    marginLeft: 5,
    color: "#555",
    fontWeight: "bold",
  },
  notificationSettingsContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingLabel: {
    flex: 1,
    paddingVertical: 10,
  },
  countBadge: {
    backgroundColor: "#E82E5F",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 10,
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  pendingNotificationCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  notificationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendingNotificationHeader: {
    backgroundColor: "#fff8e1",
  },
  newBadge: {
    backgroundColor: "#2196F3",
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadge: {
    backgroundColor: "#FFA500",
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
  },
  notificationCardBody: {
    padding: 10,
    flexDirection: "row",
  },
  notificationAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
    backgroundColor: "#ddd",
  },
  notificationInfo: {
    flex: 1,
  },
  notificationName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  notificationDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallCallButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    padding: 3,
    marginLeft: 5,
  },
  notificationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 5,
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  notificationBadgeContainer: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    right: -8,
    top: -8,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationsContainer: {
    marginTop: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
  },
  notificationSection: {
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  pendingCountText: {
    color: "#FFA500",
    fontWeight: "normal",
  },
});

export default CallCenterDashboard;
