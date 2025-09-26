import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Checkbox } from "react-native-paper";
import { API_URL } from "../../../data/ApiUrl";

const { width } = Dimensions.get("window");

// Updated PlatformCheckbox component
const PlatformCheckbox = ({ label, status, onPress }) => {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webCheckboxContainer}>
        <input
          type="checkbox"
          checked={status === "checked"}
          onChange={onPress}
          style={styles.webCheckbox}
        />
        <Text style={styles.webCheckboxLabel}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={styles.checkboxItem}>
      <Checkbox.Android
        status={status}
        onPress={onPress}
        color="#0D47A1"
      />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
  );
};

const PropertyForm = ({ closeModal, propertyId, initialData }) => {
  const [formData, setFormData] = useState({
    FlatLocation: "",
    bhk: "",
    area: "",
    carpetArea: "",
    totalArea: "",
    floors: "",
    portions: "",
    furnishing: null,
    projectStatus: null,
    facing: null,
    carParking: null,
    BankLoanFacility: null,
    facilities: {
      water: false,
      vastu: false,
      documents: false,
      lift: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        FlatLocation: initialData.FlatLocation || "",
        bhk: initialData.bhk || "",
        area: initialData.area || "",
        carpetArea: initialData.carpetArea || "",
        totalArea: initialData.totalArea || "",
        floors: initialData.floors || "",
        portions: initialData.portions || "",
        furnishing: initialData.furnishing || null,
        projectStatus: initialData.projectStatus || null,
        facing: initialData.facing || null,
        carParking: initialData.carParking || null,
        BankLoanFacility: initialData.BankLoanFacility || null,
        facilities: {
          water: initialData.facilities?.water || false,
          vastu: initialData.facilities?.vastu || false,
          documents: initialData.facilities?.documents || false,
          lift: initialData.lift?.lift || false,
        },
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFacilityChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [key]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!propertyId) {
      Alert.alert("Error", "Property ID is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/properties/${propertyId}/dynamic`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update property");
      }

      Alert.alert("Success", "Property details updated successfully");
      closeModal(true);
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", error.message || "An error occurred while updating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Update Property Details</Text>

      {/* BHK Input */}
      <Text style={styles.heading}>BHK Type</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2BHK"
        value={formData.bhk}
        onChangeText={(text) => handleInputChange("bhk", text)}
      />

      {/* Area Input */}
      <Text style={styles.heading}>Area (sq. ft)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2400 sq.ft"
        keyboardType="numeric"
        value={formData.area}
        onChangeText={(text) => handleInputChange("area", text)}
      />
      <Text style={styles.heading}>No of floors</Text>
      <TextInput
        style={styles.input}
        placeholder="No of floors"
        keyboardType="numeric"
        value={formData.floors}
        onChangeText={(text) => handleInputChange("floors", text)}
      />
      <Text style={styles.heading}>No of Portions</Text>
      <TextInput
        style={styles.input}
        placeholder="No of portions"
        keyboardType="numeric"
        value={formData.portions}
        onChangeText={(text) => handleInputChange("portions", text)}
      />

      {/* Furnishing Checkboxes */}
      <Text style={styles.heading}>Furnishing</Text>
      <View style={styles.checkboxContainer}>
        {["Semi-Furnished", "Fully-Furnished"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={formData.furnishing === option ? "checked" : "unchecked"}
            onPress={() =>
              handleInputChange(
                "furnishing",
                formData.furnishing === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Project Status */}
      <Text style={styles.heading}>Project Status</Text>
      <View style={styles.checkboxContainer}>
        {["Ready to Move", "Under Construction"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={formData.projectStatus === option ? "checked" : "unchecked"}
            onPress={() =>
              handleInputChange(
                "projectStatus",
                formData.projectStatus === option ? null : option
              )
            }
          />
        ))}
      </View>

      <Text style={styles.heading}>Facing Direction</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Facing Direction"
        value={formData.direction}
        onChangeText={(value) => handleInputChange("direction", value)}
      />

      {/* Carpet Area */}
      <Text style={styles.heading}>Carpet Area (sq. ft)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2000 sq.ft"
        keyboardType="numeric"
        value={formData.carpetArea}
        onChangeText={(text) => handleInputChange("carpetArea", text)}
      />

      {/* Car Parking */}
      <Text style={styles.heading}>Car Parking</Text>
      <View style={styles.checkboxContainer}>
        {["Yes", "No"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={formData.carParking === option ? "checked" : "unchecked"}
            onPress={() =>
              handleInputChange(
                "carParking",
                formData.carParking === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Project Facilities */}
      <Text style={styles.heading}>Project Facilities</Text>
      <View style={styles.checkboxContainer}>
        {[
          { label: "24-hour Water Supply", key: "water" },
          { label: "100% Vastu", key: "vastu" },
          { label: "Clear Title & Documents", key: "documents" },
          { label: "lift", key: "lift" },
        ].map(({ label, key }) => (
          <PlatformCheckbox
            key={key}
            label={label}
            status={formData.facilities[key] ? "checked" : "unchecked"}
            onPress={() => handleFacilityChange(key, !formData.facilities[key])}
          />
        ))}
      </View>
      <Text style={styles.heading}>Flat/Apartment Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Flat Location"
        value={formData.FlatLocation}
        onChangeText={(value) => handleInputChange("FlatLocation", value)}
      />

      {/* Bank Loan Facility */}
      <Text style={styles.heading}>Bank Loan Facility</Text>
      <View style={styles.checkboxContainer}>
        {["Yes", "No"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={
              formData.BankLoanFacility === option ? "checked" : "unchecked"
            }
            onPress={() =>
              handleInputChange(
                "BankLoanFacility",
                formData.BankLoanFacility === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.buttonSubmit, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Details</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonCancel, isSubmitting && styles.disabledButton]}
          onPress={() => closeModal(false)}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#E3F2FD",
    flexGrow: 1,
    width: width > 500 ? width * 0.4 : width * 0.9,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#0D47A1",
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1A237E",
  },
  input: {
    borderWidth: 1,
    borderColor: "#90CAF9",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  checkboxContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#64B5F6",
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  buttonSubmit: {
    backgroundColor: "#0D47A1",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonCancel: {
    backgroundColor: "#DC3545",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Web-specific styles
  webCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  webCheckbox: {
    marginRight: 8,
    width: 18,
    height: 18,
  },
  webCheckboxLabel: {
    fontSize: 16,
  },
});

export default PropertyForm;