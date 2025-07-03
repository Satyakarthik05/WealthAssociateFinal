import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../data/ApiUrl";

const AddValueProjects = ({ closeModal }) => {
  const [form, setForm] = useState({
    companyName: "",
    officeAddress: "",
    city: "",
    website: "",
    mobile: "",
    photo: null, // Changed from 'logo' to 'photo' to match PostProperty
    file: null, // Added to store the file object for web
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Clean up temporary URLs on unmount
  useEffect(() => {
    return () => {
      if (
        Platform.OS === "web" &&
        form.photo &&
        form.photo.startsWith("blob:")
      ) {
        URL.revokeObjectURL(form.photo); // Clean up the temporary URL
      }
    };
  }, [form.photo]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.companyName) newErrors.companyName = "Company name is required.";
    if (!form.officeAddress)
      newErrors.officeAddress = "Office address is required.";
    if (!form.city) newErrors.city = "City is required.";
    if (!form.mobile) newErrors.mobile = "Mobile number is required.";
    if (!form.photo) newErrors.photo = "Logo is required."; // Changed from 'logo' to 'photo'
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const blobToFile = (blob, fileName) => {
    return new File([blob], fileName, { type: blob.type });
  };

  const handleAddClient = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("companyName", form.companyName);
        formData.append("officeAddress", form.officeAddress);
        formData.append("city", form.city);
        formData.append("website", form.website);
        formData.append("mobile", form.mobile);

        // Handle image upload
        if (form.photo) {
          if (Platform.OS === "web") {
            if (form.file) {
              // If form.file exists (web), append it to FormData
              formData.append("photo", form.file);
            } else if (
              typeof form.photo === "string" &&
              form.photo.startsWith("http")
            ) {
              // If form.photo is a URL (web image)
              formData.append("photoUrl", form.photo); // Send it as URL to the backend
            }
          } else {
            // Handle mobile (URI from gallery)
            formData.append("photo", {
              uri: form.photo, // URI for mobile (image path)
              name: "photo.jpg", // You can modify this as needed
              type: "image/jpeg", // Ensure this matches the file type you're uploading
            });
          }
        } else {
          console.error("No photo selected.");
          return; // Don't proceed if no photo is selected
        }

        const response = await fetch(
          `${API_URL}/coreproject/addValueProjects`,
          {
            method: "POST",
            body: formData,
            headers: {
              // Don't set Content-Type for FormData, it is automatically set by the browser
            },
          }
        );

        const result = await response.json();
        if (response.ok) {
          Alert.alert("Success", "Core client added successfully!");
          closeModal();
        } else {
          Alert.alert("Error", result.message || "Failed to add core client.");
        }
      } catch (error) {
        console.error("Error adding core client:", error);
        Alert.alert("Error", "An error occurred while adding the core client.");
      } finally {
        setLoading(false);
      }
    }
  };

  const selectImageFromGallery = async () => {
    try {
      if (Platform.OS === "web") {
        // Handle image selection for web
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            const imageUrl = URL.createObjectURL(file);
            setForm({ ...form, photo: imageUrl, file }); // Store both URL and file
          }
        };
        input.click();
      } else {
        // Handle image selection for mobile
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
          alert("Permission is required to upload a photo.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setForm({ ...form, photo: result.assets[0].uri });
        }
      }
    } catch (error) {
      console.error("Error selecting image from gallery:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Add Value Projects</Text>
      </View>

      <Text style={styles.label}>Logo</Text>
      <TouchableOpacity
        onPress={selectImageFromGallery}
        style={styles.uploadContainer}
      >
        {form.photo ? (
          <Image
            source={{ uri: form.photo }}
            style={styles.logo}
            onError={(e) =>
              console.error("Failed to load image:", e.nativeEvent.error)
            }
          />
        ) : (
          <View style={styles.uploadRow}>
            <Ionicons name="cloud-upload-outline" size={20} color="#555" />
            <Text style={styles.uploadText}> Upload Logo</Text>
          </View>
        )}
      </TouchableOpacity>
      {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}

      <Text style={styles.label}>Company Name</Text>
      <TextInput
        placeholder="Ex. Harischandra Townships"
        style={styles.input}
        value={form.companyName}
        onChangeText={(text) => setForm({ ...form, companyName: text })}
      />
      {errors.companyName && (
        <Text style={styles.errorText}>{errors.companyName}</Text>
      )}

      <Text style={styles.label}>Project Name</Text>
      <TextInput
        placeholder="Ex. Harischandra Townships"
        style={styles.input}
        value={form.officeAddress}
        onChangeText={(text) => setForm({ ...form, officeAddress: text })}
      />
      {errors.officeAddress && (
        <Text style={styles.errorText}>{errors.officeAddress}</Text>
      )}

      <Text style={styles.label}>Project Address</Text>
      <TextInput
        placeholder="Ex. Road no.1, Srinivasa Nagar Colony"
        style={styles.input}
        value={form.city}
        onChangeText={(text) => setForm({ ...form, city: text })}
      />
      {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

      <Text style={styles.label}>city</Text>
      <TextInput
        placeholder="Vijayawada"
        style={styles.input}
        value={form.website}
        onChangeText={(text) => setForm({ ...form, website: text })}
      />

      <Text style={styles.label}>website</Text>
      <TextInput
        placeholder="Ex. www.wealthassociatesindia.com"
        style={styles.input}
        keyboardType="phone-pad"
        value={form.mobile}
        onChangeText={(text) => setForm({ ...form, mobile: text })}
      />
      {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={handleAddClient}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#000",
    width: 350,
    padding: 20,
    alignSelf: "center",
  },
  headerContainer: {
    backgroundColor: "#D81B60",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 25,
    padding: 10,
    marginVertical: 5,
  },
  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadText: {
    color: "#555",
    fontWeight: "bold",
    marginLeft: 5,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  addButton: {
    backgroundColor: "#D81B60",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default AddValueProjects;
