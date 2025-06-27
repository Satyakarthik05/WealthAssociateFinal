import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  Animated,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../data/ApiUrl";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PropertyCard from "./PropertyCard";
import { useNavigation } from "@react-navigation/native";
import useFontsLoader from "../../assets/Hooks/useFontsLoader";

const PostProperty = ({ closeModal }) => {
  const { width, height } = useWindowDimensions();
  const isMobileView = Platform.OS !== "web" || width < 450;
  const fontsLoaded = useFontsLoader();
  
  // State declarations
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [propertyTypeSearch, setPropertyTypeSearch] = useState("");
  const [postedProperty, setPostedProperty] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef();

  const navigation = useNavigation();

  // Fetch user details based on user type
  const getUserDetails = async () => {
    try {
      const [token, storedUserType] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userType"),
      ]);

      if (!token || !storedUserType) return;

      setUserType(storedUserType);

      let endpoint = "";
      switch (storedUserType) {
        case "WealthAssociate":
        case "ReferralAssociate":
          endpoint = `${API_URL}/agent/AgentDetails`;
          break;
        case "Customer":
          endpoint = `${API_URL}/customer/getcustomer`;
          break;
        case "CoreMember":
          endpoint = `${API_URL}/core/getcore`;
          break;
        case "Investor":
          endpoint = `${API_URL}/investors/getinvestor`;
          break;
        case "NRI":
          endpoint = `${API_URL}/nri/getnri`;
          break;
        case "SkilledResource":
          endpoint = `${API_URL}/skillLabour/getskilled`;
          break;
        default:
          endpoint = `${API_URL}/agent/AgentDetails`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          token: token || "",
        },
      });
      const details = await response.json();
      setUserDetails(details);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchPropertyTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/discons/propertytype`);
      const data = await response.json();
      setPropertyTypes(data);
    } catch (error) {
      console.error("Error fetching property types:", error);
    }
  };

  const fetchConstituencies = async () => {
    try {
      const response = await fetch(`${API_URL}/alldiscons/alldiscons`);
      const data = await response.json();
      setConstituencies(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getUserDetails();
    fetchPropertyTypes();
    fetchConstituencies();
  }, []);

  // Filter functions for dropdowns
  const filteredPropertyTypes = propertyTypes.filter((item) =>
    item.name.toLowerCase().includes(propertyTypeSearch.toLowerCase())
  );

  const filteredConstituencies = constituencies.flatMap((item) =>
    item.assemblies.filter((assembly) =>
      assembly.name.toLowerCase().includes(locationSearch.toLowerCase())
    )
  );

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!propertyType) newErrors.propertyType = "Please select a property type";
    if (!location) newErrors.location = "Location is required";
    if (!price) newErrors.price = "Price is required";
    if (photos.length === 0)
      newErrors.photo = "Please upload at least one photo";
    if (photos.length > 4) newErrors.photo = "Maximum 4 photos allowed";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handlePost = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("propertyType", propertyType);
        formData.append("location", location);
        formData.append("price", price);
        formData.append(
          "PostedBy",
          userDetails.MobileNumber || userDetails.mobile
        );
        formData.append("fullName", userDetails.FullName || userDetails.Name);
        formData.append(
          "mobile",
          userDetails.MobileNumber || userDetails.MobileIN
        );
        formData.append("userType", userType);
        formData.append("propertyDetails", "");

        if (userDetails.MyRefferalCode) {
          formData.append("referralCode", userDetails.MyRefferalCode);
        }

        if (Platform.OS === "web") {
          files.forEach((file) => {
            formData.append("photos", file);
          });
        } else {
          photos.forEach((photoUri, index) => {
            formData.append("photos", {
              uri: photoUri,
              name: `photo_${index}.jpg`,
              type: "image/jpeg",
            });
          });
        }

        const response = await fetch(`${API_URL}/properties/addProperty`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (response.ok) {
          setPostedProperty({
            photo: result.photos?.[0] || photos[0],
            photos: result.photos || photos,
            location,
            price,
            propertyType,
            PostedBy: userDetails.MobileNumber || userDetails.MobileIN,
            fullName: userDetails.FullName || userDetails.Name,
            mobile: userDetails.MobileNumber || userDetails.MobileIN,
            propertyDetails: "",
            userType,
          });
          setModalVisible(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error("Error posting property:", error);
        alert("An error occurred while posting the property.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Image handling functions
  const selectImagesFromGallery = async () => {
    try {
      if (photos.length >= 4) {
        alert("You can upload a maximum of 4 photos");
        return;
      }

      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.onchange = (event) => {
          const newFiles = Array.from(event.target.files);
          const remainingSlots = 4 - photos.length;
          const filesToAdd = newFiles.slice(0, remainingSlots);

          if (filesToAdd.length > 0) {
            const newPhotos = filesToAdd.map((file) =>
              URL.createObjectURL(file)
            );
            setPhotos([...photos, ...newPhotos]);
            setFiles([...files, ...filesToAdd]);
          } else {
            alert(`You can only upload ${remainingSlots} more photo(s)`);
          }
        };
        input.click();
      } else {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
          alert("Permission is required to upload photos.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          allowsMultipleSelection: true,
          selectionLimit: 4 - photos.length,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newUris = result.assets.map((asset) => asset.uri);
          setPhotos([...photos, ...newUris]);
        }
      }
    } catch (error) {
      console.error("Error selecting images:", error);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      if (photos.length >= 4) {
        alert("You can upload a maximum of 4 photos");
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        alert("Camera permission is required to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
    }
  };

  // Clear dropdown selection
  const clearPropertyTypeSelection = () => {
    setPropertyType("");
    setPropertyTypeSearch("");
  };

  const clearLocationSelection = () => {
    setLocation("");
    setLocationSearch("");
  };

  const handleClosePropertyModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setPostedProperty(null);
      setTimeout(() => {
        alert("Property posted successfully");
        navigation.navigate("newhome");
      }, 100);
    });
  };

  // Dropdown modal handlers
  const handlePropertyTypePress = () => {
    Keyboard.dismiss();
    setActiveDropdown("propertyType");
    setDropdownModalVisible(true);
  };

  const handleLocationPress = () => {
    Keyboard.dismiss();
    setActiveDropdown("location");
    setDropdownModalVisible(true);
  };

  const handleDropdownClose = () => {
    Keyboard.dismiss();
    setDropdownModalVisible(false);
    setActiveDropdown(null);
  };

  const handlePropertyTypeSelect = (item) => {
    Keyboard.dismiss();
    setPropertyType(item.name);
    setPropertyTypeSearch(item.name);
    handleDropdownClose();
  };

  const handleLocationSelect = (item) => {
    Keyboard.dismiss();
    setLocation(item.name);
    setLocationSearch(item.name);
    handleDropdownClose();
  };

  // Render dropdown content
  const renderDropdownContent = () => {
    if (activeDropdown === "propertyType") {
      return (
        <View style={styles.dropdownContent}>
          <Text style={styles.dropdownTitle}>Select Property Type</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search property types..."
            value={propertyTypeSearch}
            onChangeText={setPropertyTypeSearch}
            autoFocus={true}
          />
          <ScrollView
            style={styles.dropdownScrollView}
            keyboardShouldPersistTaps="always"
          >
            {filteredPropertyTypes.map((item) => (
              <TouchableOpacity
                key={`${item.code}-${item.name}`}
                style={styles.dropdownItem}
                onPress={() => handlePropertyTypeSelect(item)}
                activeOpacity={0.6}
              >
                <Text style={styles.dropdownItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    } else if (activeDropdown === "location") {
      return (
        <View style={styles.dropdownContent}>
          <Text style={styles.dropdownTitle}>Select Location</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            value={locationSearch}
            onChangeText={setLocationSearch}
            autoFocus={true}
          />
          <ScrollView
            style={styles.dropdownScrollView}
            keyboardShouldPersistTaps="always"
          >
            {filteredConstituencies.map((item) => (
              <TouchableOpacity
                key={`${item.code}-${item.name}`}
                style={styles.dropdownItem}
                onPress={() => handleLocationSelect(item)}
                activeOpacity={0.6}
              >
                <Text style={styles.dropdownItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D8E3E7" }}>
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          keyboardVerticalOffset={60}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContainer,
              { minHeight: Platform.OS === "web" ? "100vh" : height },
            ]}
            showsVerticalScrollIndicator={Platform.OS !== "web"}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View
              style={[
                styles.titleWrapper,
                isMobileView && styles.titleWrapperMobile,
              ]}
            >
              <Text style={styles.title}>Post a Property</Text>
            </View>

            <View
              style={[
                styles.formContainer,
                isMobileView && styles.formContainerMobile,
              ]}
            >
              {/* Photo Upload Section */}
              <Text style={styles.label}>Upload Photos (Max 4)</Text>
              <View style={styles.uploadSection}>
                {photos && photos.length > 0 ? (
                  <View style={styles.photosContainer}>
                    {photos.map((photoUri, index) => (
                      <View key={index} style={styles.photoWrapper}>
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.uploadedImage}
                        />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => {
                            const updatedPhotos = [...photos];
                            updatedPhotos.splice(index, 1);
                            setPhotos(updatedPhotos);
                            if (Platform.OS === "web") {
                              const updatedFiles = [...files];
                              updatedFiles.splice(index, 1);
                              setFiles(updatedFiles);
                            }
                          }}
                        >
                          <MaterialIcons name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {photos.length < 4 && (
                      <TouchableOpacity
                        style={styles.addPhotoButton}
                        onPress={selectImagesFromGallery}
                      >
                        <MaterialIcons name="add" size={24} color="#555" />
                        <Text style={styles.uploadPlaceholderText}>
                          Add Photo
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.uploadOptions}>
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={selectImagesFromGallery}
                    >
                      <MaterialIcons
                        name="photo-library"
                        size={24}
                        color="#555"
                      />
                      <Text style={styles.uploadPlaceholderText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={takePhotoWithCamera}
                    >
                      <MaterialIcons name="camera-alt" size={24} color="#555" />
                      <Text style={styles.uploadPlaceholderText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {errors.photo && (
                <Text style={styles.errorText}>{errors.photo}</Text>
              )}

              {/* Property Type Input */}
              <Text style={styles.label}>Property Type</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  onPress={handlePropertyTypePress}
                  activeOpacity={0.8}
                  style={{ width: "100%" }}
                >
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Search Property Type"
                      placeholderTextColor="rgba(25, 25, 25, 0.5)"
                      value={propertyType || propertyTypeSearch}
                      onChangeText={(text) => {
                        setPropertyTypeSearch(text);
                        setPropertyType("");
                      }}
                      editable={false}
                      pointerEvents="none"
                    />
                    {propertyType && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearPropertyTypeSelection}
                      >
                        <MaterialIcons name="clear" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              {errors.propertyType && (
                <Text style={styles.errorText}>{errors.propertyType}</Text>
              )}

              {/* Location Input */}
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  onPress={handleLocationPress}
                  activeOpacity={0.8}
                  style={{ width: "100%" }}
                >
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex. Vijayawada"
                      value={location || locationSearch}
                      onChangeText={(text) => {
                        setLocationSearch(text);
                        setLocation("");
                      }}
                      editable={false}
                      pointerEvents="none"
                    />
                    {location && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearLocationSelection}
                      >
                        <MaterialIcons name="clear" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}

              {/* Price Input */}
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {errors.price && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.postButton, loading && styles.disabledButton]}
                  onPress={handlePost}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.postButtonText}>Post Property</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContainer,
            { minHeight: Platform.OS === "web" ? "100vh" : height },
          ]}
          showsVerticalScrollIndicator={Platform.OS !== "web"}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            style={[
              styles.titleWrapper,
              isMobileView && styles.titleWrapperMobile,
            ]}
          >
            <Text style={styles.title}>Post a Property</Text>
          </View>

          <View
            style={[
              styles.formContainer,
              isMobileView && styles.formContainerMobile,
            ]}
          >
            {/* Photo Upload Section */}
            <Text style={styles.label}>Upload Photos (Max 4)</Text>
            <View style={styles.uploadSection}>
              {photos && photos.length > 0 ? (
                <View style={styles.photosContainer}>
                  {photos.map((photoUri, index) => (
                    <View key={index} style={styles.photoWrapper}>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.uploadedImage}
                      />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => {
                          const updatedPhotos = [...photos];
                          updatedPhotos.splice(index, 1);
                          setPhotos(updatedPhotos);
                          if (Platform.OS === "web") {
                            const updatedFiles = [...files];
                            updatedFiles.splice(index, 1);
                            setFiles(updatedFiles);
                          }
                        }}
                      >
                        <MaterialIcons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length < 4 && (
                    <TouchableOpacity
                      style={styles.addPhotoButton}
                      onPress={selectImagesFromGallery}
                    >
                      <MaterialIcons name="add" size={24} color="#555" />
                      <Text style={styles.uploadPlaceholderText}>
                        Add Photo
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    onPress={selectImagesFromGallery}
                  >
                    <MaterialIcons
                      name="photo-library"
                      size={24}
                      color="#555"
                    />
                    <Text style={styles.uploadPlaceholderText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    onPress={takePhotoWithCamera}
                  >
                    <MaterialIcons name="camera-alt" size={24} color="#555" />
                    <Text style={styles.uploadPlaceholderText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {errors.photo && (
              <Text style={styles.errorText}>{errors.photo}</Text>
            )}

            {/* Property Type Input */}
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={handlePropertyTypePress}
                activeOpacity={0.8}
                style={{ width: "100%" }}
              >
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Search Property Type"
                    placeholderTextColor="rgba(25, 25, 25, 0.5)"
                    value={propertyType || propertyTypeSearch}
                    onChangeText={(text) => {
                      setPropertyTypeSearch(text);
                      setPropertyType("");
                    }}
                    editable={false}
                    pointerEvents="none"
                  />
                  {propertyType && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearPropertyTypeSelection}
                    >
                      <MaterialIcons name="clear" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            {errors.propertyType && (
              <Text style={styles.errorText}>{errors.propertyType}</Text>
            )}

            {/* Location Input */}
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={handleLocationPress}
                activeOpacity={0.8}
                style={{ width: "100%" }}
              >
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex. Vijayawada"
                    value={location || locationSearch}
                    onChangeText={(text) => {
                      setLocationSearch(text);
                      setLocation("");
                    }}
                    editable={false}
                    pointerEvents="none"
                  />
                  {location && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearLocationSelection}
                    >
                      <MaterialIcons name="clear" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}

            {/* Price Input */}
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              returnKeyType="done"
            />
            {errors.price && (
              <Text style={styles.errorText}>{errors.price}</Text>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.postButton, loading && styles.disabledButton]}
                onPress={handlePost}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>Post Property</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDropdownClose}
      >
        {Platform.OS === "ios" ? (
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior="padding"
            keyboardVerticalOffset={60}
          >
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={handleDropdownClose}
            />
            <View
              style={[styles.dropdownModalContainer, { height: height * 0.6 }]}
            >
              {renderDropdownContent()}
              <TouchableOpacity
                style={styles.closeDropdownButton}
                onPress={handleDropdownClose}
              >
                <Text style={styles.closeDropdownButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={handleDropdownClose}
            />
            <View
              style={[styles.dropdownModalContainer, { height: height * 0.6 }]}
            >
              {renderDropdownContent()}
              <TouchableOpacity
                style={styles.closeDropdownButton}
                onPress={handleDropdownClose}
              >
                <Text style={styles.closeDropdownButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePropertyModal}
      >
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          {postedProperty && (
            <PropertyCard
              property={postedProperty}
              closeModal={handleClosePropertyModal}
            />
          )}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 40,
    paddingTop: 40,
    paddingBottom: 60,
    backgroundColor: "#D8E3E7",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E5C76",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 20,
    paddingHorizontal: 25,
    paddingVertical: 30,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    width: "80%",
    alignSelf: "center",
  },
  formContainerMobile: {
    width: "95%",
    paddingHorizontal: 15,
  },
  titleWrapper: {
    width: "100%",
    backgroundColor: "#D8E3E7",
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: "center",
  },
  titleWrapperMobile: {
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#2B2D42",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
   
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E0E6ED",
    borderRadius: 25,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  clearButton: {
    position: "absolute",
    right: 10,
    padding: 8,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  uploadSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  photoWrapper: {
    position: "relative",
    marginRight: 10,
    marginBottom: 10,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: "cover",
  },
  removePhotoButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(74,111,165,0.8)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  uploadPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: "#E0E6ED",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "#E0E6ED",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    marginRight: 10,
    marginBottom: 10,
  },
  uploadPlaceholderText: {
    fontSize: 14,
    color: "#6B7C93",
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  postButton: {
    flex: 1, 
    marginRight: 10,
    backgroundColor: "#3E5C76",
    borderRadius: 25,
    paddingVertical: 14,
    elevation: 2,
  },
  postButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#3E5C76",
    borderRadius: 25,
    paddingVertical: 14,
    elevation: 2,
  },
  cancelButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#B8C2CC",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  // Dropdown modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    marginBottom: Platform.OS === "ios" ? "-55%" : "",
  },
  dropdownContent: {
    flex: 1,
    width: "100%",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    marginTop: Platform.OS === "ios" ? "5%" : "",
    backgroundColor: "#fff",
  },
  dropdownScrollView: {
    flex: 1,
    width: "100%",
    // marginBottom: 15,
    marginBottom: Platform.OS === "ios" ? "4%" : "",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
  },
  closeDropdownButton: {
    backgroundColor: "#3E5C76",
    borderRadius: 25,
    padding: 12,
    alignItems: "center",
  },
  closeDropdownButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PostProperty;