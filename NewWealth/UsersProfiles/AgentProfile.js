import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import Modify_Deatils from "./AgentUpdateProfile";
import CustomModal from "../../Components/CustomModal";
import { useNavigation } from "@react-navigation/native";
import logo1 from "../../assets/man2.png";
import { clearHeaderCache } from "../MainScreen/Uppernavigation";

const Agent_Profile = ({ onDetailsUpdates }) => {
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== "web" || width < 450;
  const [isEditing, setIsEditing] = useState(false);
  const [Details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    getDetails();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
      }

      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== "granted") {
        alert("Sorry, we need camera permissions to make this work!");
      }
    }
  };

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
            setProfileImage(imageUrl);
            setFile(file);
            uploadProfileImage(file);
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
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setProfileImage(result.assets[0].uri);
          uploadProfileImage(result.assets[0].uri);
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
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const uploadProfileImage = async (imageUri) => {
    setIsUploading(true);
    try {
      const agentId = Details._id; // Get agent ID from stored details
      const formData = new FormData();

      if (Platform.OS === "web") {
        if (file) {
          formData.append("photo", file);
        } else if (
          typeof imageUri === "string" &&
          imageUri.startsWith("blob:")
        ) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const file = new File([blob], "profile.jpg", { type: blob.type });
          formData.append("photo", file);
        }
      } else {
        const localUri = imageUri;
        const filename = localUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("photo", {
          uri: localUri,
          name: filename,
          type,
        });
      }

      // Append agentId as a field (not inside the file object)
      formData.append("agentId", agentId);

      const response = await fetch(`${API_URL}/agent/updateProfileImage`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get detailed error from backend
        throw new Error(errorData.message || "Failed to update profile image");
      }

      const result = await response.json();
      if (result.success) {
        Alert.alert("Success", "Profile image updated successfully");
        getDetails(); // Refresh profile data
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to update profile image");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteProfileImage = async () => {
    Alert.alert(
      "Delete Profile Image",
      "Are you sure you want to remove your profile image?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("authToken");
              if (!token) {
                throw new Error("Authentication token not found");
              }

              const response = await fetch(
                `${API_URL}/agent/deleteProfileImage`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const result = await response.json();

              if (!response.ok) {
                throw new Error(
                  result.message || "Failed to delete profile image"
                );
              }

              if (result.success) {
                setProfileImage(null);
                Alert.alert("Success", "Profile image removed successfully");
                getDetails(); // Refresh profile data
              }
            } catch (error) {
              console.error("Error deleting profile image:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to remove profile image"
              );
            }
          },
        },
      ]
    );
  };

  const handleImagePicker = () => {
    Alert.alert("Select Image", "Choose an option", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Gallery",
        onPress: selectImageFromGallery,
      },
      {
        text: "Camera",
        onPress: takePhotoWithCamera,
      },
    ]);
  };

  const handleDetailsUpdate = () => {
    getDetails();
  };

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/agent/AgentDetails`, {
        method: "GET",
        headers: {
          token: token || "",
        },
      });
      const newDetails = await response.json();
      setDetails(newDetails);
      if (newDetails.photo) {
        setProfileImage(newDetails.photo);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching agent details:", error);
      setLoading(false);
    }
  };

  const LogOut = async () => {
    try {
      await AsyncStorage.multiRemove([
        "authToken",
        "userType",
        "userData",
        "referredAddedByInfo",
        "userTypevalue",
      ]);

      // Clear the in-memory header cache
      clearHeaderCache();

      // Navigate to main screen
      navigation.navigate("Main Screen");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const LogOuts = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            Alert.alert(
              "Your delete account request is successfully submitted. Our executive will reach you out soon to confirm."
            );
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false} // optional, in case of horizontal scroll
      >
        <View style={[styles.container, { width: isMobile ? "100%" : "80%" }]}>
          <Text style={styles.agentProfileText}>Agent Profile</Text>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF3366"
              style={styles.loader}
            />
          ) : (
            <>
              <View style={styles.profileHeader}>
                <View style={{ position: "relative" }}>
                  {isUploading ? (
                    <View style={[styles.avatar, styles.uploadingAvatar]}>
                      <ActivityIndicator size="small" color="#FF3366" />
                    </View>
                  ) : (
                    <Image
                      source={profileImage ? { uri: profileImage } : logo1}
                      style={styles.avatar}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={handleImagePicker}
                    disabled={isUploading}
                  >
                    <FontAwesome name="camera" size={20} color="white" />
                  </TouchableOpacity>

                  {profileImage && (
                    <TouchableOpacity
                      style={styles.deleteImageButton}
                      onPress={deleteProfileImage}
                      disabled={isUploading}
                    >
                      <MaterialIcons name="delete" size={20} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.profileName}>{Details.name}</Text>
              </View>
              <View style={styles.profileCard}>
                <View
                  style={[
                    styles.profileForm,
                    {
                      flexDirection: isMobile ? "column" : "row",
                      flexWrap: isMobile ? "nowrap" : "wrap",
                      justifyContent: isMobile ? "flex-start" : "space-between",
                    },
                  ]}
                >
                  {profileFields.map(({ label, icon, key }) => (
                    <CustomInput
                      key={key}
                      label={label}
                      icon={icon}
                      value={Details[key]}
                      labelStyle={styles.label}
                      isMobile={isMobile} // optional: pass to CustomInput if needed
                    />
                  ))}
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setModalVisible(true)}
                  >
                    <Text style={styles.buttonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={LogOut}
                  >
                    <Text style={styles.buttonTexts}>Logout</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                  onPress={LogOuts}
                >
                  <Text style={styles.buttonTexts}>Delete Your Account</Text>
                </TouchableOpacity>
              </View>

              <CustomModal
                isVisible={modalVisible}
                closeModal={() => setModalVisible(false)}
              >
                <Modify_Deatils
                  closeModal={() => setModalVisible(false)}
                  onDetailsUpdate={handleDetailsUpdate}
                />
              </CustomModal>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const profileFields = [
  { label: "Full Name", icon: "user", key: "FullName" },
  { label: "Mobile Number", icon: "phone", key: "MobileNumber" },
  { label: "Email", icon: "envelope", key: "Email" },
  { label: "Select District", icon: "map-marker", key: "District" },
  { label: "Select Constituency", icon: "location-arrow", key: "Contituency" },
  { label: "Location", icon: "map", key: "Locations" },
  { label: "Select Expertise", icon: "briefcase", key: "Expertise" },
  { label: "Select Experience", icon: "calendar", key: "Experience" },
  { label: "Referral Code", icon: "users", key: "MyRefferalCode" },
];

const CustomInput = ({ label, icon, value, isMobile }) => (
  <View style={[styles.inputWrapper, { width: isMobile ? "100%" : "30%" }]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value || "-"}
        editable={false}
        pointerEvents="none"
      />
      <FontAwesome name={icon} size={20} color="#3E5C76" style={styles.icon} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#D8E3E7",
  },
  scrollView: {
    flex: 1,
    marginBottom: 60,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 20, // space at the top
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    alignItems: "center",
    padding: 20,
    width: Platform.OS === "web" ? "80%" : "100%",
    alignSelf: "center",
    height: "100%",
    minHeight: "100vh",
  },
  agentProfileText: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 5,
    fontFamily: "OpenSanssemibold",
  },
  profileForm: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    flexWrap: Platform.OS === "web" ? "wrap" : "nowrap",
    justifyContent: Platform.OS === "web" ? "space-between" : "flex-start",
    width: "100%",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "OpenSanssemibold",
    backgroundColor: "FDFDFD",
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 9,
    borderRadius: 10,
    elevation: 3,
    width: Platform.OS === "web" ? "100%" : "100%",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    // fontFamily: "OpenSanssemibold",
    width: Platform.OS === "web" ? "100%" : 200,
  },
  inputLabel: {
    marginBottom: 5,
    fontWeight: "600",
    fontFamily: "OpenSanssemibold",
  },
  icon: {
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 15,
  },
  buttonTexts: {
    color: "#fff",
    fontSize: 16,
    backgroundColor: "#3E5C76",
    padding: 10,
    borderRadius: 15,
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  uploadingAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  loader: {
    marginTop: 50,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 0,
  },
  profileCard: {
    width: Platform.OS === "web" ? "80%" : "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    paddingBottom: 20,
  },
  cameraButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#3E5C76",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteImageButton: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "#3E5C76",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Agent_Profile;
