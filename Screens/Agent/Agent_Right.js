import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomModal from "../../Components/CustomModal";
import PostProperty from "../Properties/PostProperty";
import RequestProperty from "../Properties/RequestProperty";
import AddClubMember from "../Customer/Regicus";
import RequestExpert from "../../NewWealth/ExpertPanel/Requested_expert";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../../data/ApiUrl";
import RequestedProperties from "../../Screens/Properties/ViewRequestedProperties";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PropertyCard from "./PropertyCard";
import { Ionicons } from "@expo/vector-icons";
import logo from "../../assets/man.png";
import logo1 from "../../assets/Logo Final 1.png";
import logo2 from "../../assets/Main-Logo (1) 1.png";
import logo3 from "../../assets/Meenakshi-Icon-Blac (2) 1.png";
import logo4 from "../../assets/Surya Avenue Logo[1] 1.png";
import logo5 from "../../assets/Logo 1.png";
import logo6 from "../../assets/Land.jpg";
import logo7 from "../../assets/residntial.jpg";
import logo8 from "../../assets/commercial.jpg";
import logo9 from "../../assets/villa.jpg";
import logo10 from "../../assets/house.png";
import logo11 from "../../assets/logo.png";

// Import nested action components
import AddCustomer from "../Customer/Regicus";
import AddInvestor from "../Investors/AddInvestors";
import AddNRI from "../NRI/AddNri";
import AddSkilled from "../SkilledLabour/Rskill";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const actionButtons = [
  {
    title: "Post a Property",
    icon: "home",
    component: PostProperty,
  },
  {
    title: "Request a Property",
    icon: "home-search",
    component: RequestProperty,
  },
  // {
  //   title: "Add a member",
  //   icon: "account-plus",
  //   component: AddClubMember,
  // },
  { title: "Request Expert", icon: "account-check", component: RequestExpert },
];

const nestedActionButtons = [
  { title: "Add a Customer", icon: "account-plus", component: AddCustomer },
  { title: "Add an Investor", icon: "account-cash", component: AddInvestor },
  { title: "Add a NRI", icon: "account-clock", component: AddNRI },
  { title: "Add a Skilled", icon: "account-hard-hat", component: AddSkilled },
];

const coreClients = [
  {
    name: "Harischandra Townships",
    logo: logo1,
  },
];

const coreProjects = [
  { name: "Bay Town", logo: logo2 },
  { name: "Icon", logo: logo3 },
  {
    name: "Surya Avenue",
    logo: logo4,
  },
  { name: "The Park Vue", logo: logo5 },
];
const numColumns = width > 800 ? 4 : 1;

const Agent_Right = ({ onViewAllPropertiesClick }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [propertiess, setPropertiess] = useState([]);
  const [coreClients, setCoreClients] = useState([]);
  const [coreProjects, setCoreProjectes] = useState([]);
  const [Details, setDetails] = useState({ Contituency: "" });
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPropertyModalVisible, setPropertyModalVisible] = useState(false);
  const [postedProperty, setPostedProperty] = useState(null);
  const [referredInfo, setReferredInfo] = useState(null);

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/agent/AgentDetails`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });
      const newDetails = await response.json();
      console.log("Agent Details API Response:", newDetails);
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchCoreClients = async () => {
    try {
      const response = await fetch(`${API_URL}/coreclient/getallcoreclients`);
      const data = await response.json();
      setCoreClients(data);
    } catch (error) {
      console.error("Error fetching core clients:", error);
    }
  };

  const fetchCoreProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/coreproject/getallcoreprojects`);
      const data = await response.json();
      setCoreProjectes(data);
    } catch (error) {
      console.error("Error fetching core projects:", error);
    }
  };
  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Couldn't load page", err)
      );
    } else {
      // Handle case where website is not available
      alert("Website link not available");
    }
  };

  const getImageByPropertyType = (propertyType) => {
    switch (propertyType.toLowerCase()) {
      case "land":
        return logo6;
      case "residential":
        return logo7;
      case "commercial":
        return logo8;
      case "villa":
        return logo9;
      default:
        return logo10;
    }
  };

  const fetchPropertiess = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${API_URL}/requestProperty/getallrequestProperty`,
        {
          method: "GET",
          headers: {
            token: `${token}` || "",
          },
        }
      );
      const data = await response.json();

      // Filter properties to only include those with status "Done"
      const doneProperties = data.filter((item) => item.Approved === "Done");

      const formattedProperties = doneProperties.map((item) => ({
        id: item._id,
        title: item.propertyTitle,
        type: item.propertyType,
        location: item.location,
        budget: `₹${item.Budget.toLocaleString()}`,
        image: getImageByPropertyType(item.propertyType),
        createdAt: item.createdAt,
      }));

      setPropertiess(formattedProperties);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/getApproveProperty`);
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        setProperties(data);
        fetchPropertiess();
      } else {
        console.warn("API returned empty data.");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTag = (createdAt) => {
    const currentDate = new Date();
    const propertyDate = new Date(createdAt);
    const timeDifference = currentDate - propertyDate;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (daysDifference <= 3) {
      return "Regular Property";
    } else if (daysDifference >= 4 && daysDifference <= 17) {
      return "Approved Property";
    } else if (daysDifference >= 18 && daysDifference <= 25) {
      return "Wealth Property";
    } else {
      return "Listed Property";
    }
  };

  // Function to sort properties with constituency first
  const sortPropertiesByConstituency = (properties) => {
    if (!Details.Contituency) return properties;

    return [...properties].sort((a, b) => {
      const aInConstituency = a.location?.includes(Details.Contituency);
      const bInConstituency = b.location?.includes(Details.Contituency);

      if (aInConstituency && !bInConstituency) return -1;
      if (!aInConstituency && bInConstituency) return 1;
      return 0;
    });
  };

  const handleActionButtonClick = (btn) => {
    if (btn.title === "Add a member") {
      setModalContent(
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.nestedModalContent}>
            {nestedActionButtons.map((nestedBtn, index) => (
              <TouchableOpacity
                key={index}
                style={styles.nestedActionButton}
                onPress={() => handleNestedActionButtonClick(nestedBtn)}
              >
                <View style={styles.iconCircle}>
                  <Icon
                    name={nestedBtn.icon}
                    size={Platform.OS === "web" ? 40 : 30}
                    color="#E91E63"
                  />
                </View>
                <Text style={styles.actionText}>{nestedBtn.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableWithoutFeedback>
      );
      setModalVisible(true);
    } else {
      const ModalComponent = btn.component;
      setModalContent(
        <ModalComponent title={btn.title} closeModal={closeModal} />
      );
      setModalVisible(true);
    }
  };

  const handleNestedActionButtonClick = (nestedBtn) => {
    const ModalComponent = nestedBtn.component;
    setModalContent(
      <ModalComponent title={nestedBtn.title} closeModal={closeModal} />
    );
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleViewAllProperties = () => {
    onViewAllPropertiesClick();
  };

  const handleEnquiryNow = (property) => {
    setPropertyModalVisible(true);
  };

  useEffect(() => {
    const fetchReferredDetails = async () => {
      if (!Details?.ReferredBy) return;

      try {
        const response = await fetch(
          `${API_URL}/properties/getPropertyreffered`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              token: (await AsyncStorage.getItem("authToken")) || "",
            },
            body: JSON.stringify({
              referredBy: Details.ReferredBy,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          setReferredInfo(data.referredByDetails);
        } else {
          console.error("API returned unsuccessful status:", data);
        }
      } catch (error) {
        console.error("Error fetching referredBy info:", error);
      }
    };

    fetchReferredDetails();
  }, [Details?.ReferredBy]);

  const handleShare = (property, closeModal) => {
    const fullImageUri = property.photo ? `${API_URL}${property.photo}` : null;
    setPostedProperty({
      propertyType: property.propertyType,
      photo: fullImageUri,
      location: property.location,
      price: property.price,
    });
    if (closeModal) closeModal();
  };

  const handleIHave = (property) => {
    // setSelectedProperty(property);
    setPropertyModalVisible(true);
  };
  const getLastFourChars = (id) => {
    return id ? id.slice(-4) : "N/A";
  };
  const getLastFourCharss = (id) => {
    if (!id) return "N/A";
    return id.length > 4 ? id.slice(-4) : id;
  };

  useEffect(() => {
    getDetails();
    fetchCoreClients();
    fetchCoreProjects();
    fetchProperties();
  }, []);

  const regularProperties = sortPropertiesByConstituency(
    properties.filter(
      (property) => getPropertyTag(property.createdAt) === "Regular Property"
    )
  );
  const approvedProperties = sortPropertiesByConstituency(
    properties.filter(
      (property) => getPropertyTag(property.createdAt) === "Approved Property"
    )
  );
  const wealthProperties = sortPropertiesByConstituency(
    properties.filter(
      (property) => getPropertyTag(property.createdAt) === "Wealth Property"
    )
  );
  const listedProperties = sortPropertiesByConstituency(
    properties.filter(
      (property) => getPropertyTag(property.createdAt) === "Listed Property"
    )
  );

  return (
    <View style={styles.container}>
      <View contentContainerStyle={styles.contentContainer}>
        <View style={styles.actionContainer}>
          {actionButtons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => handleActionButtonClick(btn)}
            >
              <View style={styles.iconCircle}>
                <Icon
                  name={btn.icon}
                  size={Platform.OS === "web" ? 40 : 30}
                  color={btn.icon === "home-search" ? "green" : "#E91E63"}
                />
              </View>
              <Text style={styles.actionText}>{btn.title}</Text>
              {btn.subtext && <Text style={styles.subtext}>{btn.subtext}</Text>}
            </TouchableOpacity>
          ))}
        </View>
        <CustomModal isVisible={isModalVisible} closeModal={closeModal}>
          {modalContent}
        </CustomModal>
        {regularProperties.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Regular Properties</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.requestedPropertiesContainer}
            >
              {regularProperties.map((property, index) => {
                const imageUri = property.photo
                  ? { uri: `${API_URL}${property.photo}` }
                  : logo11;
                const propertyTag = getPropertyTag(property.createdAt);
                const propertyId = getLastFourChars(property._id);

                return (
                  <View key={index} style={styles.propertyCard}>
                    <Image source={imageUri} style={styles.propertyImage} />
                    <View style={styles.approvedBadge}>
                      <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                    </View>
                    <View
                      style={{
                        alignItems: "flex-end",
                        paddingRight: 5,
                        top: 5,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "green",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                          }}
                        >
                          ID: {propertyId}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.propertyTitle}>
                      {property.propertyType}
                    </Text>
                    <Text style={styles.propertyTitle}>
                      {property.propertyDetails
                        ? property.propertyDetails
                        : "20 sqfeets"}
                    </Text>
                    <Text style={styles.propertyInfo}>
                      Location: {property.location}
                    </Text>
                    <Text style={styles.propertyBudget}>
                      ₹ {parseInt(property.price).toLocaleString()}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.enquiryButton}
                        onPress={() => handleEnquiryNow(property)}
                      >
                        <Text style={styles.buttonText}>Enquiry Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleShare(property)}
                      >
                        <Text style={styles.buttonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
        {approvedProperties.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Approved Properties</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.requestedPropertiesContainer}
            >
              {approvedProperties.map((property, index) => {
                const imageUri = property.photo
                  ? { uri: `${API_URL}${property.photo}` }
                  : logo12;
                const propertyTag = getPropertyTag(property.createdAt);
                const propertyId = getLastFourChars(property._id);

                return (
                  <View key={index} style={styles.propertyCard}>
                    <Image source={imageUri} style={styles.propertyImage} />
                    <View style={styles.approvedBadge}>
                      <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                    </View>
                    <View
                      style={{
                        alignItems: "flex-end",
                        paddingRight: 5,
                        top: 5,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "green",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                          }}
                        >
                          ID: {propertyId}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.propertyTitle}>
                      {property.propertyType}
                    </Text>
                    <Text style={styles.propertyTitle}>
                      {property.propertyDetails
                        ? property.propertyDetails
                        : "20 sqfeets"}
                    </Text>
                    <Text style={styles.propertyInfo}>
                      Location: {property.location}
                    </Text>
                    <Text style={styles.propertyBudget}>
                      ₹ {parseInt(property.price).toLocaleString()}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.enquiryButton}
                        onPress={() => handleEnquiryNow(property)}
                      >
                        <Text style={styles.buttonText}>Enquiry Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleShare(property)}
                      >
                        <Text style={styles.buttonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
        {wealthProperties.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Wealth Properties</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.requestedPropertiesContainer}
            >
              {wealthProperties.map((property, index) => {
                const imageUri = property.photo
                  ? { uri: `${API_URL}${property.photo}` }
                  : logo11;
                const propertyTag = getPropertyTag(property.createdAt);
                const propertyId = getLastFourChars(property._id);

                return (
                  <View key={index} style={styles.propertyCard}>
                    <Image source={imageUri} style={styles.propertyImage} />
                    <View style={styles.approvedBadge}>
                      <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                    </View>
                    <View
                      style={{
                        alignItems: "flex-end",
                        paddingRight: 5,
                        top: 5,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "green",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                          }}
                        >
                          ID: {propertyId}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.propertyTitle}>
                      {property.propertyType}
                    </Text>
                    <Text style={styles.propertyTitle}>
                      {property.propertyDetails
                        ? property.propertyDetails
                        : "20 sqfeets"}
                    </Text>
                    <Text style={styles.propertyInfo}>
                      Location: {property.location}
                    </Text>
                    <Text style={styles.propertyBudget}>
                      ₹ {parseInt(property.price).toLocaleString()}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.enquiryButton}
                        onPress={() => handleEnquiryNow(property)}
                      >
                        <Text style={styles.buttonText}>Enquiry Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleShare(property)}
                      >
                        <Text style={styles.buttonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
        {listedProperties.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Listed Properties</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.requestedPropertiesContainer}
            >
              {listedProperties.map((property, index) => {
                const imageUri = property.photo
                  ? { uri: `${API_URL}${property.photo}` }
                  : logo11;
                const propertyTag = getPropertyTag(property.createdAt);
                const propertyId = getLastFourChars(property._id);

                return (
                  <View key={index} style={styles.propertyCard}>
                    <Image source={imageUri} style={styles.propertyImage} />
                    <View style={styles.approvedBadge}>
                      <Text style={styles.badgeText}>(✓){propertyTag}</Text>
                    </View>
                    <View
                      style={{
                        alignItems: "flex-end",
                        paddingRight: 5,
                        top: 5,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "green",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                          }}
                        >
                          ID: {propertyId}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.propertyTitle}>
                      {property.propertyType}
                    </Text>
                    <Text style={styles.propertyInfo}>
                      Location: {property.location}
                    </Text>
                    <Text style={styles.propertyBudget}>
                      ₹ {parseInt(property.price).toLocaleString()}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.enquiryButton}
                        onPress={() => handleEnquiryNow(property)}
                      >
                        <Text style={styles.buttonText}>Enquiry Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleShare(property)}
                      >
                        <Text style={styles.buttonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
        <Text style={styles.sectionTitle}>Requested Properties</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.requestedPropertiesContainer}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e91e63" />
              <Text style={styles.loadingText}>Fetching properties...</Text>
            </View>
          ) : (
            <View style={styles.requestedPropertiesRow}>
              {sortPropertiesByConstituency([...propertiess].reverse()).map(
                (item) => {
                  const propertyTag = getPropertyTag(item.createdAt);
                  const propertyId = getLastFourCharss(item.id); // Changed from propertiess._id to item._id
                  return (
                    <View key={item.id} style={styles.requestcard}>
                      <Image source={item.image} style={styles.images} />
                      <View
                        style={{
                          alignItems: "flex-end",
                          paddingRight: 5,
                          top: 5,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "green",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                            }}
                          >
                            ID: {propertyId}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.details}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.text}>
                          Property Type: {item.type}
                        </Text>
                        <Text style={styles.text}>
                          Location: {item.location}
                        </Text>
                        <Text style={styles.text}>Budget: {item.budget}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.iHaveButton}
                        onPress={() => handleIHave(item)}
                      >
                        <Text style={styles.buttonText}>I Have</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
              )}
            </View>
          )}
        </ScrollView>
        <Text style={styles.sectionTitle}>Core Clients</Text>
        <View style={styles.cardContainer}>
          {coreClients.map((client, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleOpenLink(client.website)}
            >
              <Image
                source={{ uri: `${API_URL}${client.photo}` }}
                style={styles.logo}
                resizeMode="contain"
              />
              {client.website && (
                <View style={styles.linkIndicator}>
                  {/* <Icon name="open-in-new" size={16} color="#2196F3" /> */}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Core Projects</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.projectScroll}
        >
          {coreProjects.map((project, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleOpenLink(project.website)}
            >
              <Image
                source={{ uri: `${API_URL}${project.photo}` }}
                style={styles.logo}
                resizeMode="contain"
              />
              <View>
                <Text>{project.city}</Text>
              </View>
              {project.website && (
                <View style={styles.linkIndicator}>
                  {/* <Icon name="open-in-new" size={16} color="#2196F3" /> */}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAllProperties}
        >
          <Text style={styles.viewAllButtonText}>View All Properties</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Version : 1.0.0.2025</Text>
      </View>

      <Modal
        visible={isPropertyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPropertyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {!referredInfo ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : (
              <>
                <Image source={logo} style={styles.agentLogo} />
                <Text style={styles.modalTitle}>Referred By</Text>
                <Text style={styles.modalText}>Name: {referredInfo.name}</Text>
                <Text style={styles.modalText}>
                  Mobile: {referredInfo.Number}
                </Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => Linking.openURL(`tel:${referredInfo.Number}`)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.callButtonText}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPropertyModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!postedProperty}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPostedProperty(null)}
      >
        <View style={styles.modalContainer}>
          {postedProperty && (
            <PropertyCard
              property={postedProperty}
              closeModal={() => setPostedProperty(null)}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    ...(isWeb && { height: "auto" }),
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 10,
    paddingBottom: isWeb ? height * 0.1 : 10,
  },
  actionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  actionButton: {
    backgroundColor: "#fff",
    alignItems: "center",
    margin: 10,
    width: isWeb ? 100 : 80,
  },
  iconCircle: {
    width: isWeb ? 80 : 60,
    height: isWeb ? 80 : 60,
    borderRadius: isWeb ? 40 : 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  actionText: {
    fontSize: isWeb ? 14 : 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtext: { fontSize: 12, color: "red", textAlign: "center" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    marginTop: Platform.OS === "web" ? "auto" : 40,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: isWeb ? 200 : 150,
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  logo: { width: "80%", height: "80%" },
  projectScroll: { marginVertical: 10 },
  propertiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  propertyScroll: { marginVertical: 10 },
  propertyCard: {
    width: isWeb ? 250 : 220,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginRight: 10,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  propertyImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  approvedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "green",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: { color: "#fff", fontSize: 12 },
  propertyTitle: { fontSize: 14, fontWeight: "bold", margin: 5 },
  propertyInfo: { fontSize: 12, marginLeft: 5 },
  propertyBudget: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
    color: "green",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  enquiryButton: {
    backgroundColor: "#E91E63",
    padding: 10,
    borderRadius: 5,
  },
  shareButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  iHaveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
    width: 80,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  viewAllButton: {
    backgroundColor: "#E82E5F",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 20,
  },
  viewAllButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 10,
    color: "gray",
  },
  requestedPropertiesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  requestedPropertiesRow: {
    flexDirection: "row",
  },
  requestcard: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    margin: 8,
    width: Platform.OS === "android" ? 250 : 230,
  },
  images: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  details: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#e91e63",
  },
  loader: { marginTop: 50 },
  nestedModalContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 0,
  },
  nestedActionButton: {
    alignItems: "center",
    margin: 10,
    width: isWeb ? 100 : 100,
    borderRadius: 10,
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  agentLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 4,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  callButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#dc3545",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default Agent_Right;
