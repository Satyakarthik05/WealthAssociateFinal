import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { API_URL } from "../../data/ApiUrl";
import { useNavigation } from "@react-navigation/native";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const AddExpertForm = ({ closeModal }) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 450;
  const fontsLoaded = useFontsLoader();
  const locationInputRef = useRef();
  const navigation = useNavigation();

  const [form, setForm] = useState({
    name: "",
    expertType: "",
    qualification: "",
    experience: "",
    location: "",
    mobile: "",
    officeAddress: "",
  });

  const [photo, setPhoto] = useState(null);
  const [file, setFile] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [additionalFields, setAdditionalFields] = useState({});
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const expertFields = {
    LEGAL: [
      { key: "specialization", label: "Specialization" },
      { key: "barCouncilId", label: "Bar Council ID" },
      { key: "courtAffiliation", label: "Court Affiliation" },
      { key: "lawFirmOrganisation", label: "Law Firm/Organization" },
    ],
    REVENUE: [
      { key: "landTypeExpertise", label: "Land Type Expertise" },
      { key: "revenueSpecialisation", label: "Revenue Specialisation" },
      { key: "govtApproval", label: "Government Approval" },
      {
        key: "certificationLicenseNumber",
        label: "Certification/License Number",
      },
      { key: "revenueOrganisation", label: "Organization" },
      { key: "keyServicesProvided", label: "Key Services Provided" },
    ],
    ENGINEERS: [
      { key: "engineeringField", label: "Engineering Field" },
      { key: "engineerCertifications", label: "Certifications" },
      { key: "projectsHandled", label: "Projects Handled" },
      { key: "engineerOrganisation", label: "Organization" },
      {
        key: "specializedSkillsTechnologies",
        label: "Specialized Skills/Technologies",
      },
      { key: "majorProjectsWorkedOn", label: "Major Projects Worked On" },
      { key: "govtLicensed", label: "Government Licensed" },
    ],
    ARCHITECTS: [
      { key: "architectureType", label: "Architecture Type" },
      { key: "softwareUsed", label: "Software Used" },
      { key: "architectLicenseNumber", label: "License Number" },
      { key: "architectFirm", label: "Firm/Organization" },
      { key: "architectMajorProjects", label: "Major Projects" },
    ],
    "PLANS & APPROVALS": [
      { key: "approvalType", label: "Approval Type" },
      { key: "govtApproved", label: "Government Approved" },
      { key: "approvalOrganisation", label: "Organization" },
      { key: "approvalLicenseNumber", label: "License Number" },
      { key: "approvalMajorProjects", label: "Major Projects" },
    ],
    "VAASTU PANDITS": [
      { key: "vaastuSpecialization", label: "Vaastu Specialization" },
      { key: "vaastuOrganisation", label: "Organization" },
      { key: "vaastuCertifications", label: "Certifications" },
      { key: "remediesProvided", label: "Remedies Provided" },
      { key: "consultationMode", label: "Consultation Mode" },
    ],
    "LAND SURVEY & VALUERS": [
      { key: "surveyType", label: "Survey Type" },
      { key: "govtCertified", label: "Government Certified" },
      { key: "surveyOrganisation", label: "Organization" },
      { key: "surveyLicenseNumber", label: "License Number" },
      { key: "surveyMajorProjects", label: "Major Projects" },
    ],
    BANKING: [
      { key: "bankingSpecialisation", label: "Banking Specialisation" },
      { key: "bankingService", label: "Banking Service" },
      { key: "registeredWith", label: "Registered With" },
      { key: "bankName", label: "Bank Name" },
      { key: "bankingGovtApproved", label: "Government Approved" },
    ],
    AGRICULTURE: [
      { key: "agricultureType", label: "Agriculture Type" },
      { key: "agricultureCertifications", label: "Certifications" },
      { key: "agricultureOrganisation", label: "Organization" },
      { key: "servicesProvided", label: "Services Provided" },
      { key: "typesOfCrops", label: "Types of Crops" },
    ],
    "REGISTRATION & DOCUMENTATION": [
      { key: "registrationSpecialisation", label: "Specialisation" },
      { key: "documentType", label: "Document Type" },
      { key: "processingTime", label: "Processing Time" },
      { key: "registrationGovtCertified", label: "Government Certified" },
      { key: "additionalServices", label: "Additional Services" },
    ],
    AUDITING: [
      { key: "auditingSpecialisation", label: "Auditing Specialisation" },
      { key: "auditType", label: "Audit Type" },
      { key: "auditCertificationNumber", label: "Certification Number" },
      { key: "auditOrganisation", label: "Organization" },
      { key: "auditServices", label: "Audit Services" },
      { key: "auditGovtCertified", label: "Government Certified" },
    ],
    LIAISONING: [
      { key: "liaisoningSpecialisations", label: "Liaisoning Specialisations" },
      { key: "liaisoningCertificationNumber", label: "Certification Number" },
      { key: "liaisoningOrganisation", label: "Organization" },
      { key: "liaisoningServicesProvided", label: "Services Provided" },
    ],
  };

  const expertTypes = [
    "LEGAL",
    "REVENUE",
    "ENGINEERS",
    "ARCHITECTS",
    "PLANS & APPROVALS",
    "VAASTU PANDITS",
    "LAND SURVEY & VALUERS",
    "BANKING",
    "AGRICULTURE",
    "REGISTRATION & DOCUMENTATION",
    "AUDITING",
    "LIAISONING",
  ];

  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
        if (!response.ok) throw new Error("Failed to fetch constituencies");
        const data = await response.json();

        const allConstituencies = data.flatMap((district) =>
          district.assemblies.map((assembly) => ({
            name: assembly.name,
            district: district.parliament,
          }))
        );

        setConstituencies(allConstituencies);
      } catch (error) {
        console.error("Error fetching constituencies:", error);
        Alert.alert("Error", "Failed to load location data");
      }
    };

    fetchConstituencies();
  }, []);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    if (key === "expertType") setAdditionalFields({});
  };

  const handleAdditionalFieldChange = (key, value) => {
    setAdditionalFields({ ...additionalFields, [key]: value });
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

        if (!result.canceled && result.assets?.length > 0) {
          setPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
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

      if (!result.canceled && result.assets?.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const openBottomSheet = (type) => {
    Keyboard.dismiss();
    setBottomSheetType(type);
    setSearchTerm("");
    setFilteredData(type === "location" ? constituencies : expertTypes);
    setBottomSheetVisible(true);
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    const data = bottomSheetType === "location" ? constituencies : expertTypes;
    setFilteredData(
      data.filter((item) =>
        (item.name || item).toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  const handleSelectItem = (item) => {
    const key = bottomSheetType === "location" ? "location" : "expertType";
    handleChange(key, bottomSheetType === "location" ? item.name : item);
    setBottomSheetVisible(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.expertType || !form.location || !photo) {
      Alert.alert(
        "Error",
        "Please fill all required fields and upload a photo."
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value)
      );
      Object.entries(additionalFields).forEach(([key, value]) =>
        formData.append(key, value)
      );

      if (photo) {
        if (Platform.OS === "web") {
          if (file) {
            formData.append("photo", file);
          } else if (photo.startsWith("blob:")) {
            const response = await fetch(photo);
            const blob = await response.blob();
            formData.append(
              "photo",
              new File([blob], "photo.jpg", { type: blob.type })
            );
          }
        } else {
          const localUri = photo;
          const filename = localUri.split("/").pop();
          const type = filename.match(/\.(\w+)$/)?.[1]
            ? `image/${filename.match(/\.(\w+)$/)?.[1]}`
            : `image`;
          formData.append("photo", { uri: localUri, name: filename, type });
        }
      }

      const response = await fetch(`${API_URL}/expert/registerExpert`, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        closeModal();
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectItem(item)}
    >
      <Text style={styles.listItemText}>
        {bottomSheetType === "expertType" ? item : item.name}
      </Text>
      {bottomSheetType === "location" && (
        <Text style={styles.listItemSubText}>{item.district}</Text>
      )}
    </TouchableOpacity>
  );

  const renderBottomSheet = () => (
    <Modal
      visible={bottomSheetVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setBottomSheetVisible(false)}
    >
      <View style={styles.modalOuterContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalKeyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {bottomSheetType === "location"
                  ? "Select Constituency"
                  : "Select Expert Type"}
              </Text>
              <View style={styles.searchContainer}>
                <TextInput
                  ref={locationInputRef}
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  onChangeText={handleSearch}
                  value={searchTerm}
                  autoFocus={true}
                />
                <MaterialIcons
                  name="search"
                  size={24}
                  color="#3E5C76"
                  style={styles.searchIcon}
                />
              </View>
              <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={(item, index) =>
                  bottomSheetType === "expertType"
                    ? item
                    : `${item.name}-${index}`
                }
                style={styles.modalList}
                keyboardShouldPersistTaps="handled"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setBottomSheetVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E5C76" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Add Expert</Text>
          <View style={styles.card}>
            <View style={styles.uploadSection}>
              <Text style={styles.label}>Expert Photo</Text>
              {photo ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.uploadedImage} />
                  <TouchableOpacity style={styles.removeButton} onPress={() => setPhoto(null)}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity style={styles.uploadButton} onPress={selectImageFromGallery}>
                    <MaterialIcons name="photo-library" size={24} color="#555" />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadButton} onPress={takePhotoWithCamera}>
                    <MaterialIcons name="camera-alt" size={24} color="#555" />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {[
              { label: "Name", key: "name", placeholder: "Enter expert name" },
              {
                label: "Qualification",
                key: "qualification",
                placeholder: "Ex. BA LLB",
              },
              {
                label: "Experience",
                key: "experience",
                placeholder: "Ex. 5 Years",
              },
              {
                label: "Mobile",
                key: "mobile",
                placeholder: "Ex. 9063392872",
                keyboardType: "numeric",
              },
              {
                label: "Office Address",
                key: "officeAddress",
                placeholder: "Full address",
              },
            ].map((field) => (
              <View style={styles.formGroup} key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChangeText={(text) => handleChange(field.key, text)}
                  keyboardType={field.keyboardType || "default"}
                />
              </View>
            ))}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location (Constituency)</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => openBottomSheet("location")}
              >
                <Text
                  style={
                    form.location ? styles.inputText : styles.placeholderText
                  }
                >
                  {form.location || "Select Constituency"}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#555"
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expert Type</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => openBottomSheet("expertType")}
              >
                <Text
                  style={
                    form.expertType ? styles.inputText : styles.placeholderText
                  }
                >
                  {form.expertType || "Select Expert Type"}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#555"
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
            </View>

            {form.expertType && expertFields[form.expertType] && (
              <View style={styles.additionalFieldsSection}>
                <Text style={styles.sectionHeader}>
                  {form.expertType.replace(/([A-Z])/g, " $1").trim()} Details
                </Text>
                {expertFields[form.expertType].map(({ key, label }) => (
                  <View style={styles.formGroup} key={key}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter ${label}`}
                      value={additionalFields[key] || ""}
                      onChangeText={(text) => handleAdditionalFieldChange(key, text)}
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.addButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.addText}>Add</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      {renderBottomSheet()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D8E3E7",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 20,
    marginBottom: 100,
    width: "95%",
    maxWidth: 800,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    padding: 15,
  },
  formGroup: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    padding: 12,
    paddingRight: 40,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  inputText: {
    color: "#2B2D42",
  },
  placeholderText: {
    color: "rgba(25, 25, 25, 0.5)",
  },
  dropdownIcon: {
    position: "absolute",
    right: 15,
    top: 12,
  },
  uploadSection: {
    width: "100%",
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: "center",
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  uploadOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  uploadButton: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    width: "45%",
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  removeButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 8,
    width: 120,
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  additionalFieldsSection: {
    width: "100%",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 15,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  addButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 30,
    marginRight: 25,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#3E5C76",
    padding: 12,
    borderRadius: 30,
    minWidth: 120,
    alignItems: "center",
  },
  addText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
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
    marginBottom: Platform.OS === "ios" ? "-14%" : "",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2B2D42",
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
  },
  listItemSubText: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
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
  },
});

export default AddExpertForm;
