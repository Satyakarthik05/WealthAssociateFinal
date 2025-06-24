import { useState, useEffect } from "react";
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
} from "react-native";
import { API_URL } from "../data/ApiUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomModal from "../Components/CustomModal";
import ViewApprovedProperties from "./Screens/Properties/ViewApprovedProperties";
import Viewallagents from "./Screens/Agent/ViewAllAgents";
import NewExperts from "./ExpertPanel/NewExperts";

// Importing components
import Dashboard from "./Screens/Callcentre";
import ViewAgents from "./Screens/Agent/ViewAgents";
import ViewCustomers from "./Screens/Customer/View_customers";
import ViewPostedProperties from "./Screens/Properties/ViewPostedProperties";
import RequestedProperties from "./Screens/Properties/ViewRequestedProperties";
import ViewAgentsCall from "./Screens/Agent/AgentsCall";
import ViewCustomersCalls from "./Screens/Customer/ViewCustCalls";
import ExpertPanelReq from "./ExpertPanel/ExpertReq";
import ViewAllInvesters from "./Screens/View/ViewAllInvestors";
import AllSkilledLabours from "./Screens/View/AllSkilledLabours";
import ViewNri from "./Screens/View/ViewNri";
import ExpertPanel from "./ExpertPanel/ExpertRoute";

const CallCenterDashboard = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const [isViewCustVisible, setIsViewCustVisible] = useState(false);
  const [isViewAgentVisible, setIsViewAgentVisible] = useState(false);
  const [isViewPostPropVisible, setIsViewPostPropVisible] = useState(false);
  const [isViewRequestedPropVisible, setIsViewRequestedPropVisible] =
    useState(false);
  const [isViewAgentContVsible, setIsViewAgentContVisible] = useState(false);
  const [isCustCallVisible, setIsCustCallVisible] = useState(false);
  const [isViewApprovedProperties, setViewApprovedProperties] = useState(false);
  const [isExpertPanelReq, setExpertPanelReq] = useState(false);
  const [isViewInvestVisible, setIsViewInvestVisible] = useState(false);
  const [isViewSkillVisible, setIsViewSkillVisible] = useState(false);
  const [isViewNriVisible, setIsViewNriVisible] = useState(false);
  const [details, setDetails] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isViewallagents, setViewallagents] = useState(false);
  const [isExpertPanel, setExpertPanel] = useState(false);
  const [isNewExperts, setNewExperts] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Toggle status function
  const toggleStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const callexecutiveId = await AsyncStorage.getItem("callexecutiveId");

      const response = await fetch(
        `${API_URL}/callexe/${callexecutiveId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            token: ` ${token}` || "",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setIsActive(result.status === "active");
        await AsyncStorage.setItem("userStatus", result.status);
      } else {
        console.error("Failed to toggle status:", result.message);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  // Check initial status on component mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const status = await AsyncStorage.getItem("userStatus");
        if (status) {
          setIsActive(status === "active");
        }
      } catch (error) {
        console.error("Error checking initial status:", error);
      }
    };

    checkInitialStatus();
  }, []);

  const handleSubItemClick = (subItem) => {
    // Reset all views
    setIsViewCustVisible(false);
    setIsViewAgentVisible(false);
    setIsViewPostPropVisible(false);
    setIsViewRequestedPropVisible(false);
    setIsViewAgentContVisible(false);
    setIsCustCallVisible(false);
    setViewApprovedProperties(false);
    setExpertPanelReq(false);
    setIsViewInvestVisible(false);
    setIsViewSkillVisible(false);
    setIsViewNriVisible(false);
    setViewallagents(false);
    setExpertPanel(false);
    setNewExperts(false);

    switch (subItem) {
      case "Dashboard":
        break;
      case "View Customers":
        setIsViewCustVisible(true);
        break;
      case "View Agents":
        setIsViewAgentVisible(true);
        break;
      case "View Posted Properties":
        setIsViewPostPropVisible(true);
        break;
      case "View Requested Properties":
        setIsViewRequestedPropVisible(true);
        break;
      case "View Agents Contacts":
        setIsViewAgentContVisible(true);
        break;
      case "View Customer Contacts":
        setIsCustCallVisible(true);
        break;
      case "ViewApprovedProperties":
        setViewApprovedProperties(true);
        break;
      case "Expert Panel Requests":
        setExpertPanelReq(true);
        break;
      case "View Investors":
        setIsViewInvestVisible(true);
        break;
      case "View Skilled Resource":
        setIsViewSkillVisible(true);
        break;
      case "View All Agents":
        setViewallagents(true);
        break;
      case "ExpertPanel":
        setExpertPanel(true);
        break;
      case "NewExperts":
        setNewExperts(true);
        break;
      case "View NRI Members":
        setIsViewNriVisible(true);
        break;
      default:
        break;
    }
  };

  const closeModal = () => {
    setIsViewCustVisible(false);
    setIsViewAgentVisible(false);
    setIsViewPostPropVisible(false);
    setIsViewRequestedPropVisible(false);
    setIsViewAgentContVisible(false);
    setIsCustCallVisible(false);
    setIsViewInvestVisible(false);
    setIsViewSkillVisible(false);
    setIsViewNriVisible(false);
    setViewallagents(false);
    setExpertPanel(false);
    setNewExperts(false);
  };

  const renderContent = () => {
    if (isViewAgentVisible) return <ViewAgents />;
    if (isViewCustVisible) return <ViewCustomers />;
    if (isViewPostPropVisible) return <ViewPostedProperties />;
    if (isViewRequestedPropVisible) return <RequestedProperties />;
    if (isViewAgentContVsible) return <ViewAgentsCall />;
    if (isCustCallVisible) return <ViewCustomersCalls />;
    if (isExpertPanelReq) return <ExpertPanelReq />;
    if (isViewInvestVisible) return <ViewAllInvesters />;
    if (isViewSkillVisible) return <AllSkilledLabours />;
    if (isViewNriVisible) return <ViewNri />;
    if (isViewApprovedProperties) return <ViewApprovedProperties />;
    if (isViewallagents) return <Viewallagents />;
    if (isExpertPanel) return <ExpertPanel />;
    if (isNewExperts) return <NewExperts />;
    return <Dashboard />;
  };

  const resetToDashboard = () => {
    setIsViewCustVisible(false);
    setIsViewAgentVisible(false);
    setIsViewPostPropVisible(false);
    setIsViewRequestedPropVisible(false);
    setIsViewAgentContVisible(false);
    setIsCustCallVisible(false);
    setViewApprovedProperties(false);
    setExpertPanelReq(false);
    setIsViewInvestVisible(false);
    setIsViewSkillVisible(false);
    setIsViewNriVisible(false);
    setViewallagents(false);
    setExpertPanel(false);
    setNewExperts(false);
  };

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/callexe/getcallexe`, {
        method: "GET",
        headers: {
          token: ` ${token}` || "",
        },
      });
      const userDetails = await response.json();
      setDetails(userDetails);
      AsyncStorage.setItem("callexecutiveId", userDetails._id);

      // Base menu items that everyone can see
      const baseMenuItems = [
        {
          title: "View Approved Properties",
          icon: "home-outline",
          subItems: ["ViewApprovedProperties"],
        },
      ];

      // Add role-specific menu items
      switch (userDetails.assignedType) {
        case "Agent_Wealth_Associate":
          baseMenuItems.push({
            title: "Agents",
            icon: "person-outline",
            subItems: ["View Agents", "View Customers"],
          });
          break;
        case "Customers":
          baseMenuItems.push({
            title: "Customers",
            icon: "people-outline",
            subItems: ["View Customers", "View Agents"],
          });
          break;
        case "Property":
          baseMenuItems.push({
            title: "Properties",
            icon: "home-outline",
            subItems: ["View Posted Properties", "View Requested Properties"],
          });
          break;
        case "ExpertPanel":
          baseMenuItems.push({
            title: "Expert Panel",
            icon: "cog-outline",
            subItems: ["Expert Panel Requests", "ExpertPanel", "NewExperts"],
          });
          break;
        default:
          // Admin or full access
          baseMenuItems.push(
            {
              title: "Agents",
              icon: "person-outline",
              subItems: ["View Agents"],
            },
            {
              title: "Customers",
              icon: "people-outline",
              subItems: ["View Customers"],
            },
            {
              title: "Properties",
              icon: "home-outline",
              subItems: ["View Posted Properties", "View Requested Properties"],
            },
            {
              title: "Expert Panel",
              icon: "cog-outline",
              subItems: ["Expert Panel Requests", "ExpertPanel", "NewExperts"],
            }
          );
      }

      // Add View section that everyone can see
      baseMenuItems.push({
        title: "View",
        icon: "eye-outline",
        subItems: [
          "View Skilled Resource",
          "View NRI Members",
          "View Investors",
          "View All Agents",
        ],
      });

      setMenuItems(baseMenuItems);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  // Flatten all subItems for the bottom navigation
  const allSubItems = menuItems.flatMap(item => item.subItems);

  return (
    <View style={styles.container}>
      {/* Status Bar Adjustment for Android */}
      {Platform.OS === "android" && (
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      )}

      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={resetToDashboard}>
          <Image
            source={require("../CallCenterDash/assets/logo.png")}
            style={styles.logo}
          />
        </TouchableOpacity>
        <View style={styles.sear_icons}>
          <View style={styles.rightIcons}>
            <Image
              source={require("../CallCenterDash/assets/usflag.png")}
              style={styles.icon}
            />
            <Text style={styles.language}>English</Text>
            <Ionicons name="moon-outline" size={24} color="#000" />
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <Ionicons name="person-circle-outline" size={30} color="#000" />

            {/* Status Toggle Button */}
            <TouchableOpacity
              onPress={toggleStatus}
              style={styles.toggleContainer}
            >
              <View
                style={[
                  styles.toggleTrack,
                  isActive ? styles.toggleActive : styles.toggleInactive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    isActive ? styles.thumbActive : styles.thumbInactive,
                  ]}
                />
              </View>
              <Text style={styles.toggleText}>
                {isActive ? "Active" : "Inactive"}
              </Text>
            </TouchableOpacity>

            {details && (
              <Text style={styles.userName}>{details.name || "User"}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        <View style={styles.container}>
          <ScrollView>
            <View style={styles.userContent}>
              {details && (
                <>
                  <Text style={styles.usersContentText}>
                    Welcome Back:{" "}
                    <Text style={{ color: "#E82E5F" }}>
                      {details.name || "User"}
                    </Text>
                  </Text>
                  <Text style={styles.usersContentText}>
                    Phone number:{" "}
                    <Text style={{ color: "#E82E5F" }}>
                      {details.phone || "N/A"}
                    </Text>
                  </Text>
                  <Text style={styles.usersContentText}>
                    Role:{" "}
                    <Text style={{ color: "#E82E5F" }}>
                      {details.assignedType || "N/A"}
                    </Text>
                  </Text>
                  <Text style={styles.usersContentText}>
                    Status:{" "}
                    <Text style={{ color: isActive ? "#4CAF50" : "#9E9E9E" }}>
                      {isActive ? "Active" : "Inactive"}
                    </Text>
                  </Text>
                </>
              )}
              {(Platform.OS === "android" || Platform.OS === "ios") && (
                <TouchableOpacity
                  onPress={toggleStatus}
                  style={styles.toggleContainer}
                >
                  <View
                    style={[
                      styles.toggleTrack,
                      isActive ? styles.toggleActive : styles.toggleInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        isActive ? styles.thumbActive : styles.thumbInactive,
                      ]}
                    />
                  </View>
                  <Text style={styles.toggleText}>
                    {isActive ? "Active" : "Inactive"}
                  </Text>
                </TouchableOpacity>
              )}

              <ScrollView style={{ height: "auto" }}>
                {renderContent()}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavContent}
        >
          {allSubItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bottomNavItem}
              onPress={() => handleSubItemClick(item)}
            >
              <Text style={styles.bottomNavText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    width: "100%",
    paddingTop: Platform.OS === "android" ? 0 : StatusBar.currentHeight,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    justifyContent: "space-between",
  },
  logo: {
    width: 100,
    height: 60,
    resizeMode: "contain",
    marginLeft: Platform.OS === "web" ? "0px" : "25%",
  },
  sear_icons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "web" ? 0 : "10%",
    gap: Platform.OS === "web" ? 10 : 0,
  },
  icon: {
    width: 20,
    height: 15,
    marginRight: 5,
  },
  language: {
    marginRight: 10,
    color: "#555",
  },
  userName: {
    marginLeft: 10,
    fontWeight: "bold",
    color: "#555",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#F0F5F5",
    ...(Platform.OS === "web" && { padding: 5 }),
    marginBottom: 60, // Add margin to accommodate bottom nav
  },
  userContent: {
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: Platform === "web" ? "row" : "column",
    height: "auto",
    padding: 15,
  },
  usersContentText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  // Toggle button styles
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  toggleTrack: {
    width: 50,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
  },
  toggleInactive: {
    backgroundColor: "#9E9E9E",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  thumbActive: {
    alignSelf: "flex-end",
  },
  thumbInactive: {
    alignSelf: "flex-start",
  },
  toggleText: {
    marginLeft: 5,
    color: "#555",
    fontWeight: "bold",
  },
  // Bottom navigation styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
    height: 60,
    paddingVertical: 5,
  },
  bottomNavContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  bottomNavItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  bottomNavText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
});

export default CallCenterDashboard;