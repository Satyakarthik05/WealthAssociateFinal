import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  AppState,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../../data/ApiUrl";
import logo1 from "../../../assets/man.png";
import io from "socket.io-client";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

const { width, height } = Dimensions.get("window");

// Define background task
const BACKGROUND_FETCH_TASK = "agent-notification-task";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/agent/newagents`, {
      headers: { token },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Agent Request",
            body: `You have ${data.length} new agent requests`,
            sound: "default",
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

export default function ViewAgents() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [editedAgent, setEditedAgent] = useState({
    FullName: "",
    District: "",
    Contituency: "",
    MobileNumber: "",
    MyRefferalCode: "",
    AadhaarNumber: "",
    PANNumber: "",
    BankAccountNumber: "",
  });
  const [photo, setPhoto] = useState(null);
  const [file, setFile] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [referrerDetails, setReferrerDetails] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [newAgents, setNewAgents] = useState([]);
  const [executiveId, setExecutiveId] = useState(null);
  const [sound, setSound] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNewAgentsPanel, setShowNewAgentsPanel] = useState(false);
  const [userStatus, setUserStatus] = useState("active");
  const soundIntervalRef = useRef(null);
  const processedAgentIdsRef = useRef(new Set());
  const newAgentsScrollRef = useRef(null);
  const [appState, setAppState] = useState(AppState.currentState);

  const isMobile = Platform.OS !== "web";

  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/preview.mp3")
      );
      setSound(sound);
    };

    loadSound();

    return () => {
      newSocket.disconnect();
      if (sound) {
        sound.unloadAsync();
      }
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const registerBackgroundTask = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (err) {
        console.log("Background Fetch failed to register", err);
      }
    };

    registerBackgroundTask();

    const loadSound = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/preview.mp3")
      );
      setSound(sound);
    };

    loadSound();

    const requestPermissions = async () => {
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
    };

    requestPermissions();

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        fetchAssignedAgents();
      }
      setAppState(nextAppState);
    };

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("new_agent", (data) => {
      if (userStatus === "active" && !processedAgentIdsRef.current.has(data.agent._id)) {
        processedAgentIdsRef.current.add(data.agent._id);
        setNewAgents((prev) => [data.agent, ...prev]);
        setNotificationCount((prev) => prev + 1);

        playNotificationSound();

        if (soundIntervalRef.current) {
          clearInterval(soundIntervalRef.current);
        }
        
        soundIntervalRef.current = setInterval(() => {
          playNotificationSound();
        }, 5000);
      }
    });

    socket.on("agent_assigned", (data) => {
      stopNotificationSound();
      setNewAgents((prev) =>
        prev.filter((agent) => agent._id !== data.agentId)
      );
      setAgents((prev) =>
        prev.map((agent) =>
          agent._id === data.agentId
            ? { ...agent, assignedExecutive: data.executiveId }
            : agent
        )
      );
    });

    return () => {
      socket.off("new_agent");
      socket.off("agent_assigned");
    };
  }, [socket, userStatus]);

  const playNotificationSound = async () => {
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require("../../../assets/siren.mp3")
        );
        setSound(newSound);
        await newSound.replayAsync();
      } else {
        await sound.replayAsync();
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "New Agent Request",
          body: "You have a new agent to review",
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const stopNotificationSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }

    if (sound) {
      sound.stopAsync();
    }
  };

  const handleCallAgent = async (mobileNumber) => {
    try {
      const callLog = {
        number: mobileNumber,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `callLog_${mobileNumber}`,
        JSON.stringify(callLog)
      );

      const url = `tel:${mobileNumber}`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error initiating call:", error);
      Alert.alert("Error", "Could not initiate call");
    }
  };

  const fetchUserStatus = async () => {
    try {
      const status = await AsyncStorage.getItem("userStatus");
      if (status) {
        setUserStatus(status);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  const fetchAssignedAgents = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const token = await getAuthToken();

      const [agentsRes, districtsRes] = await Promise.all([
        fetch(`${API_URL}/callexe/myagents`, {
          headers: {
            token: token || "",
          },
        }),
        fetch(`${API_URL}/alldiscons/alldiscons`, {
          headers: {
            token: token || "",
          },
        }),
      ]);

      if (!agentsRes.ok) throw new Error("Failed to fetch assigned agents");
      if (!districtsRes.ok) throw new Error("Failed to fetch districts");

      const agentsData = await agentsRes.json();
      const districtsData = await districtsRes.json();

      const assignedAgents = agentsData.data.filter(
        (agent) => !newAgents.some((newAgent) => newAgent._id === agent._id)
      );

      const sortedAgents = assignedAgents.sort((a, b) => {
        if (a.CallExecutiveCall === "Done" && b.CallExecutiveCall !== "Done")
          return 1;
        if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall === "Done")
          return -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setAgents(sortedAgents);
      setFilteredAgents(sortedAgents);
      setDistricts(districtsData || []);

      sortedAgents.forEach((agent) => {
        if (agent?.ReferredBy) {
          fetchReferrerDetails(agent.ReferredBy);
        }
      });
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", error.message || "Failed to load assigned agents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReferrerDetails = async (referredBy) => {
    if (!referredBy || referrerDetails[referredBy]) return;

    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/properties/getPropertyreffered`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token || "",
          },
          body: JSON.stringify({
            referredBy: referredBy,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          const details = data.referredByDetails || data.addedByDetails;
          if (details) {
            setReferrerDetails((prev) => ({
              ...prev,
              [referredBy]: {
                name:
                  details.name ||
                  details.Name ||
                  details.FullName ||
                  "Referrer",
                mobileNumber: details.Number || details.MobileNumber || "N/A",
              },
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching referrer details:", error);
    }
  };

  useEffect(() => {
    const getExecutiveId = async () => {
      try {
        const storedId = await AsyncStorage.getItem("callexecutiveId");
        if (storedId) {
          setExecutiveId(storedId);
        } else {
          console.warn("No executive ID found in AsyncStorage");
        }
      } catch (error) {
        console.error(
          "Error retrieving executive ID from AsyncStorage:",
          error
        );
      }
    };

    getExecutiveId();
    fetchAssignedAgents();
    fetchUserStatus();
    
    const interval = setInterval(fetchAssignedAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(
        (agent) =>
          (agent.FullName &&
            agent.FullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (agent.MobileNumber && agent.MobileNumber.includes(searchQuery)) ||
          (agent.MyRefferalCode &&
            agent.MyRefferalCode.toLowerCase().includes(
              searchQuery.toLowerCase()
            ))
      );
      setFilteredAgents(filtered);
    }
  }, [searchQuery, agents]);

  const handleRefresh = async () => {
    await fetchAssignedAgents();
  };

  const handleMarkAsDone = async (agentId) => {
    const confirm = () => {
      if (Platform.OS === "web") {
        return window.confirm(
          "Are you sure you want to mark this agent as done?"
        );
      } else {
        return new Promise((resolve) => {
          Alert.alert("Confirm", "Mark this agent as done?", [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Confirm", onPress: () => resolve(true) },
          ]);
        });
      }
    };

    if (!(await confirm())) return;

    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_URL}/agent/markasdone/${agentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to update status");

      const result = await response.json();

      setAgents((prevAgents) => {
        const updated = prevAgents.map((agent) =>
          agent._id === agentId
            ? { ...agent, CallExecutiveCall: "Done" }
            : agent
        );
        return updated.sort((a, b) => {
          if (a.CallExecutiveCall === "Done" && b.CallExecutiveCall !== "Done")
            return 1;
          if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall === "Done")
            return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });

      setFilteredAgents((prevAgents) => {
        const updated = prevAgents.map((agent) =>
          agent._id === agentId
            ? { ...agent, CallExecutiveCall: "Done" }
            : agent
        );
        return updated.sort((a, b) => {
          if (a.CallExecutiveCall === "Done" && b.CallExecutiveCall !== "Done")
            return 1;
          if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall === "Done")
            return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });

      Alert.alert("Success", "Agent marked as done");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", error.message || "Failed to update agent status");
    }
  };

  const handleAcceptAgent = async (agentId) => {
    try {
      const response = await fetch(`${API_URL}/agent/assign/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          executiveId,
          action: "accept",
        }),
      });

      if (!response.ok) throw new Error("Failed to accept agent");

      const result = await response.json();

      stopNotificationSound();

      setNotificationCount((prev) => prev - 1);
      setNewAgents((prev) => prev.filter((agent) => agent._id !== agentId));

      processedAgentIdsRef.current.add(agentId);

      Alert.alert("Success", "Agent assigned to you successfully");

      fetchAssignedAgents();
    } catch (error) {
      console.error("Accept error:", error);
      Alert.alert("Error", error.message || "Failed to accept agent");
    }
  };

  const handleRejectAgent = async (agentId) => {
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_URL}/agent/assign/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token || "",
        },
        body: JSON.stringify({
          executiveId,
          action: "reject",
        }),
      });

      if (!response.ok) throw new Error("Failed to reject agent");

      const result = await response.json();

      stopNotificationSound();

      setNewAgents((prev) => prev.filter((agent) => agent._id !== agentId));
      setNotificationCount((prev) => prev - 1);

      processedAgentIdsRef.current.add(agentId);

      Alert.alert("Success", "Agent rejected");
    } catch (error) {
      console.error("Reject error:", error);
      Alert.alert("Error", error.message || "Failed to reject agent");
    }
  };

  const selectImageFromGallery = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPhoto(imageUrl);
            setFile(file);
          }
        };
        input.click();
      } else {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
          Alert.alert("Permission is required to upload a photo.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error selecting image from gallery:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Camera permission is required to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent);
    setEditedAgent({
      FullName: agent.FullName,
      District: agent.District,
      Contituency: agent.Contituency,
      MobileNumber: agent.MobileNumber,
      MyRefferalCode: agent.MyRefferalCode,
      AadhaarNumber: agent.AadhaarNumber || "",
      PANNumber: agent.PANNumber || "",
      BankAccountNumber: agent.BankAccountNumber || "",
    });
    setPhoto(agent.photo ? `${API_URL}${agent.photo}` : null);

    if (agent.District) {
      const district = districts.find((d) => d.parliament === agent.District);
      setConstituencies(district?.assemblies || []);
    }
    setEditModalVisible(true);
  };

  const handleDistrictChange = (district) => {
    setEditedAgent({
      ...editedAgent,
      District: district,
      Contituency: "",
    });
    const districtData = districts.find((d) => d.parliament === district);
    setConstituencies(districtData?.assemblies || []);
  };

  const handleSaveEditedAgent = async () => {
    if (!editedAgent.FullName || !editedAgent.MobileNumber) {
      Alert.alert("Error", "Full Name and Mobile Number are required");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAuthToken();
      const formData = new FormData();

      formData.append("FullName", editedAgent.FullName);
      formData.append("District", editedAgent.District);
      formData.append("Contituency", editedAgent.Contituency);
      formData.append("MobileNumber", editedAgent.MobileNumber);
      formData.append("MyRefferalCode", editedAgent.MyRefferalCode);
      formData.append("AadhaarNumber", editedAgent.AadhaarNumber);
      formData.append("PANNumber", editedAgent.PANNumber);
      formData.append("BankAccountNumber", editedAgent.BankAccountNumber);

      if (photo) {
        if (Platform.OS === "web") {
          if (file) {
            formData.append("photo", file);
          } else if (typeof photo === "string" && photo.startsWith("blob:")) {
            const response = await fetch(photo);
            const blob = await response.blob();
            const file = new File([blob], "photo.jpg", { type: blob.type });
            formData.append("photo", file);
          }
        } else {
          const localUri = photo;
          const filename = localUri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image";

          formData.append("photo", {
            uri: localUri,
            name: filename,
            type,
          });
        }
      }

      const response = await fetch(
        `${API_URL}/agent/updateagent/${selectedAgent._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to update agent");

      const updatedAgent = await response.json();

      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent._id === selectedAgent._id ? updatedAgent.data : agent
        )
      );
      setFilteredAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent._id === selectedAgent._id ? updatedAgent.data : agent
        )
      );

      setEditModalVisible(false);
      Alert.alert("Success", "Agent updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", error.message || "Failed to update agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAgent = (agentId) => {
    const confirmDelete = () => {
      if (Platform.OS === "web") {
        return window.confirm("Are you sure you want to delete this agent?");
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this agent?",
            [
              {
                text: "Cancel",
                onPress: () => resolve(false),
                style: "cancel",
              },
              { text: "Delete", onPress: () => resolve(true) },
            ]
          );
        });
      }
    };

    confirmDelete().then(async (confirmed) => {
      if (!confirmed) return;

      try {
        const token = await getAuthToken();

        const response = await fetch(
          `${API_URL}/agent/deleteagent/${agentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to delete agent");

        setAgents((prevAgents) =>
          prevAgents.filter((agent) => agent._id !== agentId)
        );
        setFilteredAgents((prevAgents) =>
          prevAgents.filter((agent) => agent._id !== agentId)
        );
        Alert.alert("Success", "Agent deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        Alert.alert("Error", error.message || "Failed to delete agent");
      }
    });
  };

  const toggleNewAgentsPanel = () => {
    setShowNewAgentsPanel(!showNewAgentsPanel);
    if (notificationCount > 0 && !showNewAgentsPanel) {
      stopNotificationSound();
    }
  };

  const scrollToNewAgents = () => {
    if (newAgentsScrollRef.current && newAgents.length > 0) {
      newAgentsScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const renderMobileView = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0000ff"]}
          />
        }
      >
        <View style={styles.mobileHeader}>
          <Text style={styles.heading}>My Assigned Agents</Text>
          <TouchableOpacity
            style={styles.notificationBadgeContainer}
            onPress={toggleNewAgentsPanel}
          >
            <Ionicons name="notifications" size={24} color="#333" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showNewAgentsPanel && (
          <View style={styles.mobileNotificationPanel}>
            <Text style={styles.notificationHeading}>New Agent Requests</Text>
            {newAgents.length === 0 ? (
              <View style={styles.noNotificationsContainer}>
                <Ionicons name="notifications-off" size={40} color="#ccc" />
                <Text style={styles.noNotifications}>No new agent requests</Text>
              </View>
            ) : (
              newAgents.map((agent) => (
                <View key={agent._id} style={styles.notificationCard}>
                  <View style={styles.notificationCardHeader}>
                    <Text style={styles.newBadge}>NEW</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(agent.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={styles.notificationCardBody}>
                    <Image
                      source={
                        agent.photo
                          ? { uri: `${API_URL}${agent.photo}` }
                          : logo1
                      }
                      style={styles.notificationAvatar}
                    />
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationName}>
                        {agent.FullName}
                      </Text>
                      <View style={styles.phoneRow}>
                        <Text style={styles.notificationDetail}>
                          <MaterialIcons name="phone" size={14} color="#555" />{" "}
                          {agent.MobileNumber}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleCallAgent(agent.MobileNumber)}
                          style={styles.callButton}
                        >
                          <Ionicons name="call" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.notificationDetail}>
                        <MaterialIcons
                          name="location-on"
                          size={14}
                          color="#555"
                        />{" "}
                        {agent.District || "N/A"}
                      </Text>

                      <View style={styles.notificationButtons}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAcceptAgent(agent._id)}
                        >
                          <Ionicons name="checkmark" size={18} color="white" />
                          <Text style={styles.buttonText}> Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectAgent(agent._id)}
                        >
                          <Ionicons name="close" size={18} color="white" />
                          <Text style={styles.buttonText}> Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, mobile or referral code"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading agents...</Text>
          </View>
        ) : filteredAgents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.noAgentsText}>
              {searchQuery
                ? "No matching agents found"
                : "No agents assigned to you"}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {filteredAgents.map((agent) => (
              <View
                key={agent._id}
                style={[
                  styles.card,
                  agent.CallExecutiveCall === "Done"
                    ? styles.doneCard
                    : styles.pendingCard,
                ]}
              >
                <Image
                  source={
                    agent.photo ? { uri: `${API_URL}${agent.photo}` } : logo1
                  }
                  style={styles.avatar}
                />
                <View style={styles.infoContainer}>
                  {agent.FullName && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Name</Text>
                      <Text style={styles.value}>: {agent.FullName}</Text>
                    </View>
                  )}
                  {agent.District && (
                    <View style={styles.row}>
                      <Text style={styles.label}>District</Text>
                      <Text style={styles.value}>: {agent.District}</Text>
                    </View>
                  )}
                  {agent.Contituency && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Constituency</Text>
                      <Text style={styles.value}>
                        : {agent.Contituency}
                      </Text>
                    </View>
                  )}
                  {agent.MobileNumber && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Mobile</Text>
                      <View style={styles.phoneRow}>
                        <Text style={styles.value}>: {agent.MobileNumber}</Text>
                        <TouchableOpacity
                          onPress={() => handleCallAgent(agent.MobileNumber)}
                          style={styles.smallCallButton}
                        >
                          <Ionicons name="call" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {agent.MyRefferalCode && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Referral Code</Text>
                      <Text style={styles.value}>
                        : {agent.MyRefferalCode}
                      </Text>
                    </View>
                  )}
                  {agent.ReferredBy && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Referred By</Text>
                      <Text style={styles.value}>
                        :{" "}
                        {referrerDetails[agent.ReferredBy]?.name ||
                          "Loading..."}
                        {referrerDetails[agent.ReferredBy]
                          ?.mobileNumber && (
                          <Text>
                            {" "}
                            (
                            {referrerDetails[agent.ReferredBy].mobileNumber}
                            )
                          </Text>
                        )}
                      </Text>
                    </View>
                  )}
                  {agent.AadhaarNumber && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Aadhaar</Text>
                      <Text style={styles.value}>
                        : {agent.AadhaarNumber}
                      </Text>
                    </View>
                  )}
                  {agent.PANNumber && (
                    <View style={styles.row}>
                      <Text style={styles.label}>PAN</Text>
                      <Text style={styles.value}>: {agent.PANNumber}</Text>
                    </View>
                  )}
                  {agent.BankAccountNumber && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Bank Account</Text>
                      <Text style={styles.value}>
                        : {agent.BankAccountNumber}
                      </Text>
                    </View>
                  )}
                  <View style={styles.row}>
                    <Text style={styles.label}>Status</Text>
                    <Text
                      style={[
                        styles.value,
                        agent.CallExecutiveCall === "Done"
                          ? styles.doneStatus
                          : styles.pendingStatus,
                      ]}
                    >
                      :{" "}
                      {agent.CallExecutiveCall === "Done"
                        ? "Done"
                        : "Pending"}
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  {agent.CallExecutiveCall !== "Done" && (
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => handleMarkAsDone(agent._id)}
                    >
                      <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditAgent(agent)}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAgent(agent._id)}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Agent</Text>

            <ScrollView>
              <View style={styles.uploadSection}>
                <Text style={styles.inputLabel}>Passport Size Photo</Text>
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setPhoto(null)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={selectImageFromGallery}
                    >
                      <MaterialIcons
                        name="photo-library"
                        size={24}
                        color="#555"
                      />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={takePhotoWithCamera}
                    >
                      <MaterialIcons name="camera-alt" size={24} color="#555" />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={editedAgent.FullName}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, FullName: text })
                }
              />

              <Text style={styles.inputLabel}>Aadhaar Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Aadhaar Number"
                value={editedAgent.AadhaarNumber}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, AadhaarNumber: text })
                }
                keyboardType="numeric"
                maxLength={12}
              />

              <Text style={styles.inputLabel}>PAN Number</Text>
              <TextInput
                style={styles.input}
                placeholder="PAN Number"
                value={editedAgent.PANNumber}
                onChangeText={(text) =>
                  setEditedAgent({
                    ...editedAgent,
                    PANNumber: text.toUpperCase(),
                  })
                }
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Bank Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Bank Account Number"
                value={editedAgent.BankAccountNumber}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, BankAccountNumber: text })
                }
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={editedAgent.MobileNumber}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, MobileNumber: text })
                }
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Referral Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code"
                value={editedAgent.MyRefferalCode}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, MyRefferalCode: text })
                }
              />

              <Text style={styles.inputLabel}>District</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedAgent.District}
                  onValueChange={handleDistrictChange}
                  style={styles.picker}
                  dropdownIconColor="#000"
                >
                  <Picker.Item label="Select District" value="" />
                  {districts.map((district) => (
                    <Picker.Item
                      key={district.parliament}
                      label={district.parliament}
                      value={district.parliament}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Constituency</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedAgent.Contituency}
                  onValueChange={(itemValue) => {
                    setEditedAgent({
                      ...editedAgent,
                      Contituency: itemValue,
                    });
                  }}
                  style={styles.picker}
                  dropdownIconColor="#000"
                  enabled={!!editedAgent.District}
                >
                  <Picker.Item label="Select Constituency" value="" />
                  {constituencies.map((constituency) => (
                    <Picker.Item
                      key={constituency.name}
                      label={constituency.name}
                      value={constituency.name}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEditedAgent}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  const renderWebView = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.splitContainer}>
        <View style={styles.leftPanel}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              Platform.OS !== "web" ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#0000ff"]}
                />
              ) : undefined
            }
          >
            <View style={styles.header}>
              <Text style={styles.heading}>My Assigned Agents</Text>
              <TouchableOpacity
                style={styles.notificationBadgeContainer}
                onPress={scrollToNewAgents}
              >
                <Ionicons name="notifications" size={24} color="#333" />
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, mobile or referral code"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading agents...</Text>
              </View>
            ) : filteredAgents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.noAgentsText}>
                  {searchQuery
                    ? "No matching agents found"
                    : "No agents assigned to you"}
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cardContainer}>
                {filteredAgents.map((agent) => (
                  <View
                    key={agent._id}
                    style={[
                      styles.card,
                      agent.CallExecutiveCall === "Done"
                        ? styles.doneCard
                        : styles.pendingCard,
                    ]}
                  >
                    <Image
                      source={
                        agent.photo
                          ? { uri: `${API_URL}${agent.photo}` }
                          : logo1
                      }
                      style={styles.avatar}
                    />
                    <View style={styles.infoContainer}>
                      {agent.FullName && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Name</Text>
                          <Text style={styles.value}>: {agent.FullName}</Text>
                        </View>
                      )}
                      {agent.District && (
                        <View style={styles.row}>
                          <Text style={styles.label}>District</Text>
                          <Text style={styles.value}>: {agent.District}</Text>
                        </View>
                      )}
                      {agent.Contituency && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Constituency</Text>
                          <Text style={styles.value}>
                            : {agent.Contituency}
                          </Text>
                        </View>
                      )}
                      {agent.MobileNumber && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Mobile</Text>
                          <View style={styles.phoneRow}>
                            <Text style={styles.value}>: {agent.MobileNumber}</Text>
                            <TouchableOpacity
                              onPress={() => handleCallAgent(agent.MobileNumber)}
                              style={styles.smallCallButton}
                            >
                              <Ionicons name="call" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      {agent.MyRefferalCode && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Referral Code</Text>
                          <Text style={styles.value}>
                            : {agent.MyRefferalCode}
                          </Text>
                        </View>
                      )}
                      {agent.ReferredBy && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Referred By</Text>
                          <Text style={styles.value}>
                            :{" "}
                            {referrerDetails[agent.ReferredBy]?.name ||
                              "Loading..."}
                            {referrerDetails[agent.ReferredBy]
                              ?.mobileNumber && (
                              <Text>
                                {" "}
                                (
                                {referrerDetails[agent.ReferredBy].mobileNumber}
                                )
                              </Text>
                            )}
                          </Text>
                        </View>
                      )}
                      {agent.AadhaarNumber && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Aadhaar</Text>
                          <Text style={styles.value}>
                            : {agent.AadhaarNumber}
                          </Text>
                        </View>
                      )}
                      {agent.PANNumber && (
                        <View style={styles.row}>
                          <Text style={styles.label}>PAN</Text>
                          <Text style={styles.value}>: {agent.PANNumber}</Text>
                        </View>
                      )}
                      {agent.BankAccountNumber && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Bank Account</Text>
                          <Text style={styles.value}>
                            : {agent.BankAccountNumber}
                          </Text>
                        </View>
                      )}
                      <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text
                          style={[
                            styles.value,
                            agent.CallExecutiveCall === "Done"
                              ? styles.doneStatus
                              : styles.pendingStatus,
                          ]}
                        >
                          :{" "}
                          {agent.CallExecutiveCall === "Done"
                            ? "Done"
                            : "Pending"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.buttonContainer}>
                      {agent.CallExecutiveCall !== "Done" && (
                        <TouchableOpacity
                          style={styles.doneButton}
                          onPress={() => handleMarkAsDone(agent._id)}
                        >
                          <Text style={styles.buttonText}>Done</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAgent(agent)}
                      >
                        <Text style={styles.buttonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAgent(agent._id)}
                      >
                        <Text style={styles.buttonText}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                          onPress={() => handleCallAgent(agent.MobileNumber)}
                          style={styles.callButton}
                        >
                          <Ionicons name="call" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.rightPanel}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationHeading}>New Agent Requests</Text>
            {notificationCount > 0 && (
              <View style={styles.notificationCountBadge}>
                <Text style={styles.notificationCountText}>
                  {notificationCount}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.notificationScrollView}
            ref={newAgentsScrollRef}
          >
            {newAgents.length === 0 ? (
              <View style={styles.noNotificationsContainer}>
                <Ionicons name="notifications-off" size={40} color="#ccc" />
                <Text style={styles.noNotifications}>
                  No new agent requests
                </Text>
              </View>
            ) : (
              newAgents.map((agent) => (
                <View key={agent._id} style={styles.notificationCard}>
                  <View style={styles.notificationCardHeader}>
                    <Text style={styles.newBadge}>NEW</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(agent.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={styles.notificationCardBody}>
                    <Image
                      source={
                        agent.photo
                          ? { uri: `${API_URL}${agent.photo}` }
                          : logo1
                      }
                      style={styles.notificationAvatar}
                    />
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationName}>
                        {agent.FullName}
                      </Text>
                      <View style={styles.phoneRow}>
                        <Text style={styles.notificationDetail}>
                          <MaterialIcons name="phone" size={14} color="#555" />{" "}
                          {agent.MobileNumber}
                        </Text>
                        
                      </View>
                      <Text style={styles.notificationDetail}>
                        <MaterialIcons
                          name="location-on"
                          size={14}
                          color="#555"
                        />{" "}
                        {agent.District || "N/A"}
                      </Text>

                      <View style={styles.notificationButtons}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAcceptAgent(agent._id)}
                        >
                          <Ionicons name="checkmark" size={18} color="white" />
                          <Text style={styles.buttonText}> Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectAgent(agent._id)}
                        >
                          <Ionicons name="close" size={18} color="white" />
                          <Text style={styles.buttonText}> Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Agent</Text>

            <ScrollView>
              <View style={styles.uploadSection}>
                <Text style={styles.inputLabel}>Passport Size Photo</Text>
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setPhoto(null)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={selectImageFromGallery}
                    >
                      <MaterialIcons
                        name="photo-library"
                        size={24}
                        color="#555"
                      />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={takePhotoWithCamera}
                    >
                      <MaterialIcons name="camera-alt" size={24} color="#555" />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={editedAgent.FullName}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, FullName: text })
                }
              />

              <Text style={styles.inputLabel}>Aadhaar Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Aadhaar Number"
                value={editedAgent.AadhaarNumber}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, AadhaarNumber: text })
                }
                keyboardType="numeric"
                maxLength={12}
              />

              <Text style={styles.inputLabel}>PAN Number</Text>
              <TextInput
                style={styles.input}
                placeholder="PAN Number"
                value={editedAgent.PANNumber}
                onChangeText={(text) =>
                  setEditedAgent({
                    ...editedAgent,
                    PANNumber: text.toUpperCase(),
                  })
                }
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Bank Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Bank Account Number"
                value={editedAgent.BankAccountNumber}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, BankAccountNumber: text })
                }
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={editedAgent.MobileNumber}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, MobileNumber: text })
                }
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Referral Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code"
                value={editedAgent.MyRefferalCode}
                onChangeText={(text) =>
                  setEditedAgent({ ...editedAgent, MyRefferalCode: text })
                }
              />

              <Text style={styles.inputLabel}>District</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedAgent.District}
                  onValueChange={handleDistrictChange}
                  style={styles.picker}
                  dropdownIconColor="#000"
                >
                  <Picker.Item label="Select District" value="" />
                  {districts.map((district) => (
                    <Picker.Item
                      key={district.parliament}
                      label={district.parliament}
                      value={district.parliament}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Constituency</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={editedAgent.Contituency}
                  onValueChange={(itemValue) => {
                    setEditedAgent({
                      ...editedAgent,
                      Contituency: itemValue,
                    });
                  }}
                  style={styles.picker}
                  dropdownIconColor="#000"
                  enabled={!!editedAgent.District}
                >
                  <Picker.Item label="Select Constituency" value="" />
                  {constituencies.map((constituency) => (
                    <Picker.Item
                      key={constituency.name}
                      label={constituency.name}
                      value={constituency.name}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEditedAgent}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  return isMobile ? renderMobileView() : renderWebView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  splitContainer: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  mobileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  mobileNotificationPanel: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
  searchContainer: {
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noAgentsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  refreshButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  doneCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  pendingCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: "#ddd",
    alignSelf: "center",
  },
  infoContainer: {
    width: "100%",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    width: "100%",
  },
  label: {
    fontWeight: "bold",
    fontSize: 14,
    width: 120,
    color: "#555",
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  doneStatus: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  pendingStatus: {
    color: "#F44336",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: width > 600 ? "50%" : "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: height * 0.9,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    marginRight: 10,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadSection: {
    width: "100%",
    marginBottom: 15,
  },
  photoContainer: {
    alignItems: "center",
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  uploadOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  uploadButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    width: "45%",
  },
  uploadButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: "#555",
  },
  removeButton: {
    backgroundColor: "#ff4444",
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  notificationHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  notificationCountBadge: {
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  notificationCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationScrollView: {
    flex: 1,
    padding: 10,
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noNotifications: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
    fontSize: 16,
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
  notificationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  notificationButtons: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  callButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    padding: 5,
    // marginLeft: 10,
  },
  smallCallButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    padding: 3,
    marginLeft: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});