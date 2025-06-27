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

// Web-compatible checkbox component
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
  return <Checkbox.Item label={label} status={status} onPress={onPress} />;
};

const RentalPropertyForm = ({ closeModal, propertyId, initialData }) => {
  const [formData, setFormData] = useState({
    propertyLocation: "",
    bhk: "",
    area: "",
    carpetArea: "",
    floors: "",
    furnishing: null,
    propertyType: null,
    facing: null,
    preferredTenant: null,
    bachelorsAllowed: null,
    businessAllowed: null,
    availableFrom: "",
    monthlyRent: "",
    securityDeposit: "",
    maintenanceCharges: "",
    facilities: {
      water: false,
      powerBackup: false,
      parking: false,
      lift: false,
      wifi: false,
      ac: false,
      furnished: false,
      security: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        propertyLocation: initialData.propertyLocation || "",
        bhk: initialData.bhk || "",
        area: initialData.area || "",
        carpetArea: initialData.carpetArea || "",
        floors: initialData.floors || "",
        furnishing: initialData.furnishing || null,
        propertyType: initialData.propertyType || null,
        facing: initialData.facing || null,
        preferredTenant: initialData.preferredTenant || null,
        bachelorsAllowed: initialData.bachelorsAllowed || null,
        businessAllowed: initialData.businessAllowed || null,
        availableFrom: initialData.availableFrom || "",
        monthlyRent: initialData.monthlyRent || "",
        securityDeposit: initialData.securityDeposit || "",
        maintenanceCharges: initialData.maintenanceCharges || "",
        facilities: {
          water: initialData.facilities?.water || false,
          powerBackup: initialData.facilities?.powerBackup || false,
          parking: initialData.facilities?.parking || false,
          lift: initialData.facilities?.lift || false,
          wifi: initialData.facilities?.wifi || false,
          ac: initialData.facilities?.ac || false,
          furnished: initialData.facilities?.furnished || false,
          security: initialData.facilities?.security || false,
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
        throw new Error(result.message || "Failed to update rental property");
      }

      Alert.alert("Success", "Rental property details updated successfully");
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
      <Text style={styles.title}>Update Rental Property Details</Text>

      {/* Property Location */}
      <Text style={styles.heading}>Property Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter full address"
        value={formData.propertyLocation}
        onChangeText={(text) => handleInputChange("propertyLocation", text)}
      />

      {/* BHK Input */}
      <Text style={styles.heading}>BHK Type</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2BHK, 3BHK, Studio"
        value={formData.bhk}
        onChangeText={(text) => handleInputChange("bhk", text)}
      />

      {/* Area Input */}
      <Text style={styles.heading}>Area (sq. ft)</Text>
      <TextInput
        style={styles.input}
        placeholder="Total area in square feet"
        keyboardType="numeric"
        value={formData.area}
        onChangeText={(text) => handleInputChange("area", text)}
      />

      {/* Carpet Area */}
      <Text style={styles.heading}>Carpet Area (sq. ft)</Text>
      <TextInput
        style={styles.input}
        placeholder="Carpet area in square feet"
        keyboardType="numeric"
        value={formData.carpetArea}
        onChangeText={(text) => handleInputChange("carpetArea", text)}
      />

      {/* Floors */}
      <Text style={styles.heading}>Floor Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2 (or 'Ground')"
        value={formData.floors}
        onChangeText={(text) => handleInputChange("floors", text)}
      />

      {/* Furnishing */}
      <Text style={styles.heading}>Furnishing</Text>
      <View style={styles.checkboxContainer}>
        {["Fully Furnished", "Semi Furnished", "Unfurnished"].map((option) => (
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

      {/* Property Type */}
      <Text style={styles.heading}>Property Type</Text>
      <View style={styles.checkboxContainer}>
        {["Apartment", "Independent House", "Villa", "PG"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={formData.propertyType === option ? "checked" : "unchecked"}
            onPress={() =>
              handleInputChange(
                "propertyType",
                formData.propertyType === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Facing Direction */}
      <Text style={styles.heading}>Facing Direction</Text>
      <View style={styles.checkboxContainer}>
        {[
          "North",
          "South",
          "East",
          "West",
          "North-East",
          "North-West",
          "South-East",
          "South-West",
        ].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={formData.facing === option ? "checked" : "unchecked"}
            onPress={() =>
              handleInputChange(
                "facing",
                formData.facing === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Preferred Tenant */}
      <Text style={styles.heading}>Preferred Tenant</Text>
      <View style={styles.checkboxContainer}>
        {["Family", "Bachelor", "Company", "Anyone"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={
              formData.preferredTenant === option ? "checked" : "unchecked"
            }
            onPress={() =>
              handleInputChange(
                "preferredTenant",
                formData.preferredTenant === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Bachelors Allowed */}
      <Text style={styles.heading}>Bachelors Allowed?</Text>
      <View style={styles.checkboxContainer}>
        {["Yes", "No"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={
              formData.bachelorsAllowed === option ? "checked" : "unchecked"
            }
            onPress={() =>
              handleInputChange(
                "bachelorsAllowed",
                formData.bachelorsAllowed === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Business Allowed */}
      <Text style={styles.heading}>Business/Commercial Use Allowed?</Text>
      <View style={styles.checkboxContainer}>
        {["Yes", "No"].map((option) => (
          <PlatformCheckbox
            key={option}
            label={option}
            status={
              formData.businessAllowed === option ? "checked" : "unchecked"
            }
            onPress={() =>
              handleInputChange(
                "businessAllowed",
                formData.businessAllowed === option ? null : option
              )
            }
          />
        ))}
      </View>

      {/* Rental Details */}
      <Text style={styles.heading}>Monthly Rent (₹)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter monthly rent amount"
        keyboardType="numeric"
        value={formData.monthlyRent}
        onChangeText={(text) => handleInputChange("monthlyRent", text)}
      />

      <Text style={styles.heading}>Security Deposit (₹)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter security deposit amount"
        keyboardType="numeric"
        value={formData.securityDeposit}
        onChangeText={(text) => handleInputChange("securityDeposit", text)}
      />

      <Text style={styles.heading}>Maintenance Charges (₹)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter monthly maintenance charges"
        keyboardType="numeric"
        value={formData.maintenanceCharges}
        onChangeText={(text) => handleInputChange("maintenanceCharges", text)}
      />

      <Text style={styles.heading}>Available From</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/YYYY"
        value={formData.availableFrom}
        onChangeText={(text) => handleInputChange("availableFrom", text)}
      />

      {/* Facilities */}
      <Text style={styles.heading}>Facilities</Text>
      <View style={styles.checkboxContainer}>
        {[
          { label: "24/7 Water Supply", key: "water" },
          { label: "Power Backup", key: "powerBackup" },
          { label: "Parking Available", key: "parking" },
          { label: "Lift/Elevator", key: "lift" },
          { label: "WiFi Included", key: "wifi" },
          { label: "AC Available", key: "ac" },
          { label: "Fully Furnished", key: "furnished" },
          { label: "Security", key: "security" },
        ].map(({ label, key }) => (
          <PlatformCheckbox
            key={key}
            label={label}
            status={formData.facilities[key] ? "checked" : "unchecked"}
            onPress={() => handleFacilityChange(key, !formData.facilities[key])}
          />
        ))}
      </View>

      {/* Buttons */}
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

export default RentalPropertyForm;
