import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { API_URL } from "../../../data/ApiUrl";

const AgricultureForm = ({ closeModal, propertyId, initialData }) => {
  const [formData, setFormData] = useState({
    passBook: "",
    oneB: "",
    rrsr: "",
    fmb: "",
    surveyNumber: "",
    boundaries: {
      east: "",
      west: "",
      north: "",
      south: "",
    },
    extent: "",
    exactLocation: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        passBook: initialData.passBook || "",
        oneB: initialData.oneB || "",
        rrsr: initialData.rrsr || "",
        fmb: initialData.fmb || "",
        surveyNumber: initialData.surveyNumber || "",
        boundaries: initialData.boundaries || {
          east: "",
          west: "",
          north: "",
          south: "",
        },
        extent: initialData.extent || "",
        exactLocation: initialData.exactLocation || "",
      });
    }
  }, [initialData]);

  const handleOption = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBoundaryChange = (direction, value) => {
    setFormData((prev) => ({
      ...prev,
      boundaries: {
        ...prev.boundaries,
        [direction]: value,
      },
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
          body: JSON.stringify({
            agricultureDetails: formData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update agriculture details"
        );
      }

      Alert.alert("Success", "Agriculture details updated successfully!");
      closeModal(true);
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update agriculture details"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    closeModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>Agriculture Details</Text>
        <Text style={styles.propertyId}>Property ID: {propertyId}</Text>

        {["passBook", "oneB", "rrsr", "fmb"].map((item) => (
          <View key={item} style={styles.optionRow}>
            <Text style={styles.label}>
              {item === "oneB"
                ? "1B"
                : item === "rrsr"
                ? "RRSR"
                : item === "fmb"
                ? "FMB"
                : "Pass Book"}
            </Text>

            <TouchableOpacity
              style={styles.checkOption}
              onPress={() => handleOption(item, "Yes")}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.checkbox,
                  formData[item] === "Yes" && styles.checked,
                ]}
              >
                {formData[item] === "Yes" && <Text style={styles.tick}>✓</Text>}
              </View>
              <Text>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkOption}
              onPress={() => handleOption(item, "No")}
              disabled={isSubmitting}
            >
              <View
                style={[
                  styles.checkbox,
                  formData[item] === "No" && styles.checked,
                ]}
              >
                {formData[item] === "No" && <Text style={styles.tick}>✓</Text>}
              </View>
              <Text>No</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.label}>Survey Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Survey Number"
          value={formData.surveyNumber}
          onChangeText={(text) => handleOption("surveyNumber", text)}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Boundaries</Text>
        <TextInput
          style={styles.input}
          placeholder="East "
          value={formData.boundaries.east}
          onChangeText={(text) => handleBoundaryChange("east", text)}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder="West "
          value={formData.boundaries.west}
          onChangeText={(text) => handleBoundaryChange("west", text)}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder="North "
          value={formData.boundaries.north}
          onChangeText={(text) => handleBoundaryChange("north", text)}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder="South "
          value={formData.boundaries.south}
          onChangeText={(text) => handleBoundaryChange("south", text)}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Extent (in Sq. Ft or Acres)</Text>
        <TextInput
          style={styles.input}
          placeholder="Eg: 5000 Sq. Ft or 2 Acres"
          value={formData.extent}
          onChangeText={(text) => handleOption("extent", text)}
          editable={!isSubmitting}
        />

        <Text style={styles.label}>Exact Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Exact Location"
          value={formData.exactLocation}
          onChangeText={(text) => handleOption("exactLocation", text)}
          editable={!isSubmitting}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 30,
  },
  container: {
    padding: 20,
    marginHorizontal: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#0D47A1",
  },
  propertyId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  checkOption: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#555",
    marginRight: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  checked: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  tick: {
    color: "#fff",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#90CAF9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#0D47A1",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AgricultureForm;
