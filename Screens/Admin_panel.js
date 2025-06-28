import { useState, useEffect, useRef } from "react";
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
  PanResponder,
} from "react-native";
import { API_URL } from "../data/ApiUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomModal from "../Components/CustomModal";
import { useNavigation } from "@react-navigation/native";
import logo1 from "../assets/logo.png";
import Agent_Right from "../Screens/Agent/Agent_Right";
import Add_Agent from "../Screens/Agent/Add_Agent";
import ViewAgents from "../Screens/Agent/ViewAgents";
import RegisterExecute from "./coreClients/Customer/Regicus";
import ViewCustomers from "./coreClients/Customer/View_customers";
import RequestProperty from "../Screens/Properties/RequestProperty";
import MyPostedProperties from "../Screens/Properties/ViewPostedProperties";
import RequestedProperties from "../Screens/Properties/ViewRequestedProperties";
import ViewAllProperties from "../Screens/Properties/ViewAllProperties";
import ExpertPanel from "../NewWealth/ExpertPanel/Expert_panel";
import ViewSkilledLabours from "../Screens/SkilledLabour/ViewSkilledLabours";
import RequestedExpert from "../NewWealth/ExpertPanel/Requested_expert";
import PostProperty from "./Properties/PostProperty";
import Core_Clients from "./coreClients/Core_Clients";
import Core_Projects from "./coreClients/Core_Projects";
import Rskill from "../Screens/SkilledLabour/Rskill";
import Agent_Profile from "./Agent/Agent_Profile";
import Modify_Deatils from "./Agent/Modify_Details";
import ExpertDetails from "../NewWealth/ExpertPanel/ExpertDetails";
import ExpertRoute from "../NewWealth/ExpertPanel/ExpertRoute";
import AllSkilledLabours from "./SkilledLabour/AllSkilledLabours";
import AddInvestor from "./Investors/AddInvestors";
import ViewAllInvesters from "./Investors/ViewAllInvestors";
import ViewInvesters from "./Investors/ViewInvestors";
import AddNRIMember from "./NRI/AddNri";
import ViewNri from "./NRI/ViewNri";
import RegisterExecutive from "./Agent/Rewa";
import AllRequestedProperties from "./Properties/AllrequestedProperties";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const Admin_panel = () => {
  const navigation = useNavigation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(
    Platform.OS !== "android" && Platform.OS !== "ios"
  );
  const [expandedItems, setExpandedItems] = useState({});
  const [isAddAgentVisible, setIsAddAgentVisible] = useState(false);
  const [isViewAgentVisible, setIsViewAgentVisible] = useState(false);
  const [isRequestPropertyVisible, setIsRequestPropertyVisible] =
    useState(false);
  const [isPostedPropertiesVisible, setIsPostedPropertiesVisible] =
    useState(false);
  const [isRequestedPropertiesVisible, setIsRequestedPropertiesVisible] =
    useState(false);
  const [addPost, setAddPost] = useState(false);
  const [isAllPropertiesVisible, setIsAllPropertiesVisible] = useState(false);
  const [isViewCustomersModalVisible, setIsViewCustomersModalVisible] =
    useState(false);
  const [isExpertPanelVisible, setIsExpertPanelVisible] = useState(false);
  const [isRegiCusVisible, setIsRegiCusVisible] = useState(false);
  const [isViewSkilledLabourVisible, setIsViewSkilledLabourVisible] =
    useState(false);
  const [isRequestExpertVisible, setIsRequestExpertVisible] = useState(false);
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [coreClients, setCoreClients] = useState(false);
  const [coreProjects, setCoreProjects] = useState(false);
  const [isRskill, setisRsSkill] = useState(false);
  const [Details, setDetails] = useState({});
  const [isRskillVisible, setIsRskillVisible] = useState(false);
  const [isAgentProfile, setIsAgentProfile] = useState(false);
  const [isExperDetails, setIsExpertDetails] = useState(false);
  const [expertType, setExpertType] = useState(null);
  const [AllSkilledLabour, setAllSkilledLabour] = useState(false);
  const [isAddInvestVisible, setIsAddInvestVisible] = useState(false);
  const [isViewInvestVisible, setIsViewInvestVisible] = useState(false);
  const [isViewInVisible, setIsViewInvisible] = useState(false);
  const [isNriVisible, setIsNriVisible] = useState(false);
  const [isNriViewVisible, setIsNriViewVisible] = useState(false);
  const [isExecuVisible, setIsExecuVisible] = useState(false);
  const [isAllRequestedProperties, setAllRequestedProperties] = useState(false);
  // const [isRegisterExecutive, setRegisterExecutive] = useState(false);

  const menuItems = [
    {
      title: "Agents",
      icon: "person-add-outline",
      subItems: [
        "Register Agent",
        "View Agents",
        ...(Details?.AgentType === "RegionalWealthAssociate"
          ? ["Register Executive WealthAssociate"]
          : []),
      ],
    },
    {
      title: "Customers",
      icon: "people-outline",
      subItems: ["Add Customer", "View Customers"],
    },
    {
      title: "Properties",
      icon: "home-outline",
      subItems: [
        "Post Property",
        "Request Property",
        "View Posted Properties",
        "View Requested Properties",
        "View All Properties",
        "View All Requested Properties",
      ],
    },
    {
      title: "Expert Panel",
      icon: "cog-outline",
      subItems: ["View Expert Panel", "Request Expert Panel"],
    },
    {
      title: "Core Clients",
      icon: "business-outline",
      subItems: ["View Core Clients", "View Core Projects"],
    },
    {
      title: "Skilled Club",
      icon: "trophy-outline",
      subItems: [
        "Register Skilled Resource",
        "View Skilled Resource",
        "All Skilled Resources",
      ],
    },
    {
      title: "Investors",
      icon: "business-outline",
      subItems: ["Add Investor", "View Investors"],
    },
    {
      title: "NRI Club",
      icon: "globe-outline",
      subItems: ["Add NRI Member", "View NRI Members"],
    },
  ];

  const toggleSidebar = () => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      setIsSidebarExpanded((prev) => !prev);
    }
  };

  const [refreshKey, setRefreshKey] = useState(0); // State to force refresh

  const handleDetailsUpdated = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Increment key to force re-render
    getDetails(); // Re-fetch details from the API
  };

  useEffect(() => {
    getDetails();
  }, [refreshKey]);

  const toggleMenuItem = (title) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));

    if (
      (Platform.OS === "android" || Platform.OS === "ios") &&
      !isSidebarExpanded
    ) {
      setIsSidebarExpanded(true);
    }
  };

  const handleViewAllPropertiesClick = () => {
    setIsAllPropertiesVisible(true);
    setSelectedSubItem("View All Properties");
  };

  const handleExpertDetails = (expertType) => {
    setIsExpertDetails(true);
    setSelectedSubItem("expert details");
    setExpertType(expertType); // Store the expertType
  };

  const handleSubItemClick = (subItem) => {
    setIsAddAgentVisible(false);
    setIsViewAgentVisible(false);
    setIsRequestPropertyVisible(false);
    setIsPostedPropertiesVisible(false);
    setIsRequestedPropertiesVisible(false);
    setIsAllPropertiesVisible(false);
    setIsViewCustomersModalVisible(false);
    setIsExpertPanelVisible(false);
    setIsRegiCusVisible(false);
    setIsViewSkilledLabourVisible(false);
    setIsRequestExpertVisible(false);
    setAddPost(false);
    setCoreClients(false);
    setCoreProjects(false);
    setisRsSkill(false);
    setIsViewInvestVisible(false);
    setIsExpertDetails(false);
    setIsAddInvestVisible(false);
    setIsViewInvisible(false);
    setIsNriVisible(false);
    setIsNriViewVisible(false);
    setIsExecuVisible(false);
    setAllSkilledLabour(false);
    setAllRequestedProperties(false);

    // setRegisterExecutive(false)

    if (Platform.OS === "android" || Platform.OS === "ios") {
      setIsSidebarExpanded(false);
    }

    if (subItem === "Register Agent") {
      setIsAddAgentVisible(true);
    } else if (subItem === "View Agents") {
      setIsViewAgentVisible(true);
    } else if (subItem === "Request Property") {
      setIsRequestPropertyVisible(true);
    } else if (subItem === "View Posted Properties") {
      setIsPostedPropertiesVisible(true);
    } else if (subItem === "View Requested Properties") {
      setIsRequestedPropertiesVisible(true);
    } else if (subItem === "View All Properties") {
      setIsAllPropertiesVisible(true);
    } else if (subItem === "View Customers") {
      setIsViewCustomersModalVisible(true);
    } else if (subItem === "View Expert Panel") {
      setIsExpertPanelVisible(true);
    } else if (subItem === "Add Customer") {
      setIsRegiCusVisible(true);
    } else if (subItem === "View Skilled Resource") {
      setIsViewSkilledLabourVisible(true);
    } else if (subItem === "Request Expert Panel") {
      setIsRequestExpertVisible(true);
    } else if (subItem === "Post Property") {
      setAddPost(true);
    } else if (subItem === "View Core Clients") {
      setCoreClients(true);
    } else if (subItem === "View Core Projects") {
      setCoreProjects(true);
    } else if (subItem === "Register Skilled Resource") {
      setisRsSkill(true);
    } else if (subItem === "expert details") {
      setIsExpertDetails(true);
    } else if (subItem === "All Skilled Resources") {
      setAllSkilledLabour(true);
    } else if (subItem === "Add Investor") {
      setIsAddInvestVisible(true);
    } else if (subItem === "View All Investors") {
      setIsViewInvestVisible(true);
    } else if (subItem === "View Investors") {
      setIsViewInvisible(true);
    } else if (subItem === "Add NRI Member") {
      setIsNriVisible(true);
    } else if (subItem === "View NRI Members") {
      setIsNriViewVisible(true);
    } else if (subItem === "Register Executive WealthAssociate") {
      setIsExecuVisible(true);
    } else if (subItem === "View All Requested Properties") {
      setAllRequestedProperties(true);
    }
  };

  const closeModal = () => {
    setIsAddAgentVisible(false);
    setIsRequestPropertyVisible(false);
    setIsPostedPropertiesVisible(false);
    setIsRequestedPropertiesVisible(false);
    setIsAllPropertiesVisible(false);
    setIsViewCustomersModalVisible(false);
    setIsExpertPanelVisible(false);
    setIsViewAgentVisible(false);
    setIsRegiCusVisible(false);
    setIsViewSkilledLabourVisible(false);
    setIsRequestExpertVisible(false);
    setIsAddInvestVisible(false);
    setAddPost(false);
    setisRsSkill(false);
    setIsViewInvisible(false);
    setIsNriVisible(false);
    setIsNriViewVisible(false);
    setIsExecuVisible(false);
    setAllRequestedProperties(false);
  };

  const renderContent = () => {
    if (isPostedPropertiesVisible) return <MyPostedProperties />;
    if (isRequestedPropertiesVisible) return <RequestedProperties />;
    if (isAllPropertiesVisible) return <ViewAllProperties />;
    if (isViewCustomersModalVisible) return <ViewCustomers />;
    if (isExpertPanelVisible) return <ExpertRoute />;
    if (isViewAgentVisible) return <ViewAgents />;
    if (isViewInvestVisible) return <ViewAllInvesters />;
    if (isViewInVisible) return <ViewInvesters />;
    if (isViewSkilledLabourVisible) return <ViewSkilledLabours />;
    if (coreClients) return <Core_Clients />;
    if (coreProjects) return <Core_Projects />;
    if (isAgentProfile) return <Agent_Profile />;
    if (isExperDetails) return <ExpertDetails expertType={expertType} />;
    if (AllSkilledLabour) return <AllSkilledLabours />;
    if (isNriViewVisible) return <ViewNri />;
    if (isAllRequestedProperties) return <AllRequestedProperties />;

    return (
      <View style={[styles.container]} keyboardShouldPersistTaps="handled">
        <Agent_Right onViewAllPropertiesClick={handleViewAllPropertiesClick} />
      </View>
    );
  };

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
      setDetails(newDetails);
      console.log(Details);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  // PanResponder for swipe-to-close functionality
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          setIsSidebarExpanded(false);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {(Platform.OS === "android" || Platform.OS === "ios") && (
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      )}

      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => {
            setIsAddAgentVisible(false);
            setIsViewAgentVisible(false);
            setIsRequestPropertyVisible(false);
            setIsPostedPropertiesVisible(false);
            setIsRequestedPropertiesVisible(false);
            setIsAllPropertiesVisible(false);
            setIsViewCustomersModalVisible(false);
            setIsExpertPanelVisible(false);
            setIsRegiCusVisible(false);
            setIsViewSkilledLabourVisible(false);
            setIsRequestExpertVisible(false);
            setAddPost(false);
            setCoreClients(false);
            setCoreProjects(false);
            setisRsSkill(false);
            setIsAddInvestVisible(false);
            setIsViewInvestVisible(false);
            setIsAgentProfile(false);
            setSelectedSubItem(null);
            setIsViewInvisible(false);
            setIsNriVisible(false);
            setIsNriViewVisible(false);
            setAllSkilledLabour(false);
            setIsExecuVisible(false);
          }}
        >
          <Image source={logo1} style={styles.logo} />
        </TouchableOpacity>
        <View style={styles.sear_icons}>
          <View style={styles.rightIcons}>
            <Ionicons name="moon-outline" size={20} color="#000" />
            <Ionicons name="notifications-outline" size={20} color="#000" />
            <Ionicons
              name="person-circle-outline"
              size={20}
              color="#000"
              onPress={() => {
                setIsAgentProfile(true);
                setIsAddAgentVisible(false);
                setIsViewAgentVisible(false);
                setIsRequestPropertyVisible(false);
                setIsPostedPropertiesVisible(false);
                setIsRequestedPropertiesVisible(false);
                setIsAllPropertiesVisible(false);
                setIsViewCustomersModalVisible(false);
                setIsExpertPanelVisible(false);
                setIsRegiCusVisible(false);
                setIsViewSkilledLabourVisible(false);
                setIsRequestExpertVisible(false);
                setIsAddInvestVisible(false);
                setIsViewInvestVisible(false);
                setAddPost(false);
                setCoreClients(false);
                setCoreProjects(false);
                setisRsSkill(false);
                setIsViewInvisible(false);
                setIsNriVisible(false);
                setIsNriViewVisible(false);
                setAllSkilledLabour(false);
                setIsExecuVisible(false);
              }}
            />
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View
          style={[
            styles.sidebar,
            (Platform.OS === "android" || Platform.OS === "ios") &&
              (isSidebarExpanded
                ? styles.expandedSidebar
                : styles.collapsedSidebar),
          ]}
          {...panResponder.panHandlers} // Attach PanResponder to the sidebar
        >
          <FlatList
            data={menuItems}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <View>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => toggleMenuItem(item.title)}
                >
                  <Ionicons name={item.icon} size={18} color="#555" />
                  {isSidebarExpanded && (
                    <Text style={styles.menuText}>{item.title}</Text>
                  )}
                  {isSidebarExpanded && (
                    <Ionicons
                      name={
                        expandedItems[item.title]
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={16}
                      color="#555"
                    />
                  )}
                </TouchableOpacity>
                {isSidebarExpanded &&
                  expandedItems[item.title] &&
                  item.subItems &&
                  item.subItems.map((sub, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSubItemClick(sub)}
                    >
                      <Text style={styles.subMenuText}>{sub}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          />
        </View>

        <View style={styles.contentArea} key={refreshKey}>
          <View style={styles.container}>
            <ScrollView>
              <View style={styles.userContent}>
                <Text style={styles.usersContentText}>
                  Welcome Back:
                  <Text style={{ color: "#E82E5F" }}>
                    {" "}
                    {Details.FullName ? Details.FullName : "yourname"}
                  </Text>
                </Text>
                <Text style={styles.usersContentText}>
                  YourReferralcode:
                  <Text style={{ color: "#E82E5F" }}>
                    {Details.MyRefferalCode ? Details.MyRefferalCode : "mycode"}
                  </Text>
                </Text>
                {renderContent()}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {(Platform.OS === "android" || Platform.OS === "ios") && (
        <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
          <Ionicons
            name={isSidebarExpanded ? "close-circle-outline" : "menu-outline"}
            size={30}
            color="#000"
          />
        </TouchableOpacity>
      )}

      <CustomModal
        isVisible={isAddAgentVisible}
        closeModal={closeModal}
        style={styles.modalOverlay}
      >
        <Add_Agent closeModal={closeModal} style={styles.modalContent} />
      </CustomModal>

      <CustomModal isVisible={isRequestPropertyVisible} closeModal={closeModal}>
        <RequestProperty closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isRegiCusVisible} closeModal={closeModal}>
        <RegisterExecute closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isRequestExpertVisible} closeModal={closeModal}>
        <RequestedExpert closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={addPost} closeModal={closeModal}>
        <PostProperty closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isRskill} closeModal={closeModal}>
        <Rskill closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddInvestVisible} closeModal={closeModal}>
        <AddInvestor closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isNriVisible} closeModal={closeModal}>
        <AddNRIMember closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isExecuVisible} closeModal={closeModal}>
        <RegisterExecutive closeModal={closeModal} />
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    width: "100%",
    paddingTop:
      Platform.OS === "android" || Platform.OS === "ios"
        ? 0
        : StatusBar.currentHeight,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    justifyContent: "space-between",
    marginTop: Platform.OS === "ios" ? 25 : -10,
  },
  logo: {
    width: 100,
    height: 60,
    resizeMode: "contain",
    marginLeft: Platform.OS === "web" ? "0px" : "28%",
  },
  sear_icons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    // marginTop: Platform.OS === "web" ? 0 : "10%",
    gap: Platform.OS === "web" ? "10px" : 10,
    marginLeft: Platform.OS === "android" || Platform.OS === "ios" ? -15 : "0",
  },
  icon: {
    width: 20,
    height: 15,
  },
  language: {
    marginRight: 10,
    color: "#555",
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
  },
  sidebar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRightWidth: 1,
    borderColor: "#ddd",
    width: Platform.OS === "android" || Platform.OS === "ios" ? 300 : 250,
    ...(Platform.OS === "web" && { minHeight: "100vh" }),
  },
  expandedSidebar: {
    width: 250,
  },
  collapsedSidebar: {
    width: 50,
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    justifyContent: "space-between",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  subMenuText: {
    fontSize: 14,
    color: "#FF4081",
    paddingLeft: 35,
    paddingVertical: 5,
  },
  lastUpdated: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#F0F5F5",
    ...(Platform.OS === "web" && { padding: 5 }),
    height: "100vh",
  },
  toggleButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 49 : 14,
    left: 10,
    zIndex: 1000,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // shadowOffset: { width: 0, height: 2 },
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: Platform.OS === "web" ? "65%" : "100%",
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 20,
    maxHeight: Platform.OS === "web" ? "80%" : "90%",
    height: 900,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  userContent: {
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: Platform === "web" ? "row" : "column",
    height: "auto",
  },
  usersContentText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Admin_panel;
