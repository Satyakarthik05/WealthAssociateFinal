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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { API_URL } from "../data/ApiUrl";

const AddExpertForm = ({ closeModal }) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const locationInputRef = useRef();

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

  // Dropdown states
  const [filteredConstituencies, setFilteredConstituencies] = useState([]);
  const [filteredExpertTypes, setFilteredExpertTypes] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showExpertTypeDropdown, setShowExpertTypeDropdown] = useState(false);

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
    "INTERIOR & ARCHITECTS",
    "SURVEY & PLANNING",
    "VAASTU PANDITS",
    "LAND VALUERS",
    "BANKING",
    "AGRICULTURE",
    "REGISTRATION &\nDOCUMENTATION",
    "AUDITING",
    "LIAISONING",
  ];

  // Fetch all constituencies
  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
        if (!response.ok) {
          throw new Error("Failed to fetch constituencies");
        }
        const data = await response.json();

        const allConstituencies = data.flatMap((district) =>
          district.assemblies.map((assembly) => ({
            name: assembly.name,
            district: district.parliament,
          }))
        );

        setConstituencies(allConstituencies);
        setFilteredConstituencies(allConstituencies);
        setFilteredExpertTypes(expertTypes);
      } catch (error) {
        console.error("Error fetching constituencies:", error);
        Alert.alert("Error", "Failed to load location data");
      }
    };

    fetchConstituencies();
  }, []);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });

    if (key === "expertType") {
      setAdditionalFields({});
    }

    if (key === "location") {
      const filtered = constituencies.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredConstituencies(filtered);
    }

    if (key === "expertType") {
      const filtered = expertTypes.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredExpertTypes(filtered);
    }
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

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.expertType ||
      !form.qualification ||
      !form.experience ||
      !form.location ||
      !form.mobile ||
      !form.officeAddress ||
      !photo
    ) {
      Alert.alert("Error", "Please fill all the fields and upload a photo.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("expertType", form.expertType);
      formData.append("qualification", form.qualification);
      formData.append("experience", form.experience);
      formData.append("location", form.location);
      formData.append("mobile", form.mobile);
      formData.append("officeAddress", form.officeAddress);

      Object.keys(additionalFields).forEach((key) => {
        formData.append(key, additionalFields[key]);
      });

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
          const type = match ? `image/${match[1]}` : `image`;

          formData.append("photo", {
            uri: localUri,
            name: filename,
            type,
          });
        }
      } else {
        Alert.alert("Error", "No photo selected.");
        return;
      }

      const response = await fetch(`${API_URL}/expert/registerExpert`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        closeModal();
      } else {
        Alert.alert("Error", data.message || "Failed to register expert.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={[styles.container, { width: isSmallScreen ? "90%" : 350 }]}
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>Add Expert</Text>
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.label}>Expert Photo</Text>
              {photo ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.uploadedImage} />
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
            ].map(({ label, key, placeholder, keyboardType }) => (
              <View style={styles.formGroup} key={key}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  value={form[key]}
                  onChangeText={(text) => handleChange(key, text)}
                  keyboardType={keyboardType || "default"}
                />
              </View>
            ))}

            {/* Location Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location (Constituency)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Search Constituency"
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  value={form.location}
                  ref={locationInputRef}
                  onChangeText={(text) => {
                    handleChange("location", text);
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => {
                    setShowLocationDropdown(true);
                    setShowExpertTypeDropdown(false);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowLocationDropdown(false), 200)
                  }
                />
                {showLocationDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      keyboardShouldPersistTaps="always"
                    >
                      {filteredConstituencies.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleChange("location", item.name);
                            setShowLocationDropdown(false);
                            // Focus management - optional
                            // this.locationInput.blur();
                          }}
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expert Type</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Search Expert Type"
                  placeholderTextColor="rgba(25, 25, 25, 0.5)"
                  value={form.expertType}
                  onChangeText={(text) => {
                    handleChange("expertType", text);
                    setShowExpertTypeDropdown(true);
                  }}
                  onFocus={() => {
                    setShowExpertTypeDropdown(true);
                    setShowLocationDropdown(false);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowExpertTypeDropdown(false), 200)
                  }
                />
                {showExpertTypeDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll}>
                      {filteredExpertTypes.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleChange("expertType", item);
                            setShowExpertTypeDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
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
                      onChangeText={(text) =>
                        handleAdditionalFieldChange(key, text)
                      }
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
                onPress={closeModal}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  keyboardView: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
    marginVertical: 20,
  },
  header: {
    width: "100%",
    marginBottom: 10,
    backgroundColor: "#E91E63",
    paddingVertical: 15,
    alignItems: "center",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  formGroup: {
    width: "100%",
    marginBottom: 10,
    position: "relative",
    zIndex: 1,
  },
  inputWrapper: {
    position: "relative",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#F9F9F9",
  },
  dropdownList: {
    width: "100%",
    maxHeight: 200,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginTop: 5,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
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
    borderColor: "#E91E63",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  addButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  addText: {
    color: "white",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  additionalFieldsSection: {
    width: "100%",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default AddExpertForm;
