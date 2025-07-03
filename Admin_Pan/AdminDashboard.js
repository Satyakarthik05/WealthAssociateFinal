import { useState, useEffect, use } from "react";
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
  Dimensions,
} from "react-native";
// import { API_URL } from "../data/ApiUrl";
import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomModal from "../Components/CustomModal";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

//importing components
import ViewCustomers from "../Adminscreen/Customer";
import RegisterExecute from "../Adminscreen/Regicus";
import Register from "../Adminscreen/Rewa";
import RegisterExecue from "../Adminscreen/Rwa";
import RegisterEx from "../Adminscreen/Rrwa";
import ViewAgents from "../Adminscreen/View";
import PostProperty from "../Adminscreen/PostProperty";
import Dashboard from "../Adminscreen/Admin_Right";
import RequestedPropertyForm from "../Adminscreen/Request";
import ViewPostedProperties from "../Adminscreen/View_posted";
import RequestedProperties from "../Adminscreen/View_Req";
import ViewAllProperties from "../Adminscreen/AllProp";
import Rskill from "../Adminscreen/Skilled Labour/Rskill";
import ViewSkilledLabours from "../Adminscreen/Skilled Labour/ViewSkilledLabours";
import Core_Clients from "../Adminscreen/ViewCoreCli";
import Core_Projects from "../Adminscreen/ViewCorePro";
import AddExpertPan from "../Adminscreen/AddExpert";
import AddRoleModal from "../Adminscreen/AddRole";
import AddDistrictModal from "../Adminscreen/AddDistrict";
import AddNRIMember from "../Adminscreen/AddNri";
import ExpertList from "../Adminscreen/ExpertReq";
import AddConstiModal from "../Adminscreen/AddConst";
import AddOccuModal from "../Adminscreen/AddOccu";
import AddUserForm from "../Adminscreen/AddUser";
import AddExpertiseModal from "../Adminscreen/AddExpertise";
import AddProTypeModal from "../Adminscreen/AddPropType";
import AddExperTypeModal from "../Adminscreen/AddExpertType";
import AddCountryModal from "../Adminscreen/AddCountry";
import AddSkillModal from "../Adminscreen/AddSkill";
import AddCoreClientForm from "../Adminscreen/AddCoreClient";
import AddCoreProjectForm from "../Adminscreen/AddCoreProj";
import ViewNri from "../Adminscreen/ViewNri";
import ViewReferralAgents from "../Adminscreen/ViewReferralAgents";
import AddReferral from "../Adminscreen/AddReferralAgents";
import AllSkilledLabours from "../Adminscreen/Skilled Labour/AllSkilledLabours";
import AddInvestors from "../Adminscreen/Investors/AddInvestors";
import ViewInvesters from "../Adminscreen/Investors/ViewInvestors";
import ViewAllInvesters from "../Adminscreen/Investors/ViewAllInvestors";
import AddCoreMember from "../Adminscreen/Core Member/AddCoreMember";
import ViewCoreMembers from "../Adminscreen/Core Member/ViewCoreMembers";
import ExpertRoute from "../Adminscreen/Expert Panel/ExpertRoute";
import ExpertDetails from "../Adminscreen/Expert Panel/ExpertDetails";
import ViewApprovedProperties from "../Adminscreen/ViewApprovedProperties";
import AddCallExecutive from "../Adminscreen/Call Executive/AddCallExecutive";
import ViewCallExecutives from "../Adminscreen/Call Executive/ViewCallExecutive";
import SoldPropertys from "../Adminscreen/SoldPropertys";

const menuItems = [
  {
    title: "Agents",
    icon: "person-outline",
    subItems: [
      "Register Regional Wealth Associate",
      "Register Executive Wealth Associate",
      "Register Wealth Associate",
      "View Agents",
    ],
  },
  {
    title: "Customers",
    icon: "people-outline",
    subItems: ["Add Customer", "View Customers"],
  },
  {
    title: "Core Members",
    icon: "shield-outline",
    subItems: ["Add Core Member", "View Core Members"],
  },
  {
    title: "Properties",
    icon: "home-outline",
    subItems: [
     
      "View All Properties",
      "ViewApprovedProperties",
      "View SoldedPropertys",
    ],
  },
  {
    title: "Expert Panel",
    icon: "cog-outline",
    subItems: [
      "Add Expert Panel",
      "View Expert Panel",
      "Expert Panel Requests",
    ],
  },
  {
    title: "Referrals",
    icon: "person-add-outline",
    subItems: ["Add ReferralAgents", "View ReferralAgents"],
  },
  {
    title: "NRI Club",
    icon: "globe-outline",
    subItems: ["Add NRI Member", "View NRI Members"],
  },
  {
    title: "Core Clients",
    icon: "business-outline",
    subItems: [
      "Add Core Clients",
      "Add Core Projects",
      "View Core Clients",
      "View Core Projects",
    ],
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
    subItems: ["Add Investor", "View Investors", "View All Investors"],
  },
  {
    title: "Call Executive",
    icon: "business-outline",
    subItems: ["Add Call Executive", "View Call Executive"],
  },
  {
    title: "Master Data",
    icon: "settings-outline",
    subItems: [
      "Add Districts",
      "Add Constituencies",
      "Add Expertise",
      "Add Occupation",
      "Add Property Type",
      "Add Skill",
    ],
  },
];

const AdminDashboard = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(
    Platform.OS !== "android" || Platform.OS !== "ios"
  );
  const [expandedItems, setExpandedItems] = useState({});
  const [isViewCustVisible, setIsViewCustVisible] = useState(false);
  const [isAddCustVisible, setIsAddCustVisible] = useState(false);
  const [isExecuteVisible, setIsExecuteVisible] = useState(false);
  const [isWealVisible, setIsWealVisible] = useState(false);
  const [isRegionalVisible, setIsRegionalVisible] = useState(false);
  const [isViewAgentVisible, setIsViewAgentVisible] = useState(false);
  const [isPostedPropertiesVisible, setIsPostedPropertiesVisible] =
    useState(false);
  const [isRequestVisible, setIsRequestVisible] = useState(false);
  const [isViewpostVisible, setIsViewpostVisible] = useState(false);
  const [isViewReqVisible, setIsViewReqVisible] = useState(false);
  const [isAllPropVisible, setIsAllPropVisible] = useState(false);
  const [isAddExpertVisible, setIsAddExpertVisible] = useState(false);
  const [isRegSkillVisible, setIsRegSkillVisible] = useState(false);
  const [isViewSkillVisible, setIsViewSkillVisible] = useState(false);
  const [isViewClientVisible, setIsViewClientVisible] = useState(false);
  const [isViewCoreProVisible, setIsViewCoreProVisible] = useState(false);
  const [isAddExpertPanelVisible, setIsAddExpertPanelVisible] = useState(false);
  const [isAddRoleVisible, setIsAddRoleVisible] = useState(false);
  const [isAddDisVisible, setIsAddDisVisible] = useState(false);
  const [isAddNriVisible, setIsAddNriVisible] = useState(false);
  const [isExpertReqVisible, setIsExpertReqVisible] = useState(false);
  const [isAddConsVisible, setIsAddConsVisible] = useState(false);
  const [isAddOccuVisible, setIsAddOccuVisible] = useState(false);
  const [isAddUseVisible, setIsAddUseVisible] = useState(false);
  const [isAddExpertiseVisible, setIsAddExpertiseVisible] = useState(false);
  const [isAddProTypeVisible, setIsAddProTypeVisible] = useState(false);
  const [isAddExperTypeVisible, setIsAddExperTypeVisible] = useState(false);
  const [isAddCountryVisible, setIsAddCountryVisible] = useState(false);
  const [isAddSkillVisible, setIsAddSkillVisible] = useState(false);
  const [isAddCoreVisible, setIsAddCoreVisible] = useState(false);
  const [isAddCoreProVisible, setIsAddCoreProVisible] = useState(false);
  const [isViewNriVisible, setIsViewNriVisible] = useState(false);
  const [isViewReferral, setIsViewReferral] = useState(false);
  const [isAddReferral, setIsAddReferral] = useState(false);
  const [AllSkilledLabour, setAllSkilledLabour] = useState(false);
  const [AddInvestor, setAddInvestor] = useState(false);
  const [ViewInvester, setViewInvester] = useState(false);
  const [ViewAllInvester, setAllViewInvester] = useState(false);
  const [isAddCoreMember, setIsCoreMember] = useState(false);
  const [isViewCoreMember, setIsViewCoreMember] = useState(false);
  const [isExpertPanelVisible, setIsExpertPanelVisible] = useState(false);
  const [isExperDetails, setIsExpertDetails] = useState(false);
  const [isViewApprovedProperties, setViewApprovedProperties] = useState(false);
  const [expertType, setExpertType] = useState(null);
  const [isViewCallVisible, setIsViewCallVisible] = useState(false);
  const [isAddCallVisible, setIsAddCallVisible] = useState(false);
  const [isSoldPropertys, setSoldPropertys] = useState(false);
  const navigation = useNavigation();

  const toggleSidebar = () => {
    if (Platform.OS === "android") {
      setIsSidebarExpanded((prev) => !prev);
    }
  };

  const toggleMenuItem = (title) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));

    if (Platform.OS === "android" && !isSidebarExpanded) {
      setIsSidebarExpanded(true);
    }
  };

  const handleExpertDetails = (expertType) => {
    setIsExpertDetails(true);
    setSelectedSubItem("expert details");
    setExpertType(expertType); // Store the expertType
  };

  const handleSubItemClick = (subItem) => {
    setIsViewCustVisible(false);
    setIsAddCustVisible(false);
    setIsExecuteVisible(false);
    setIsWealVisible(false);
    setIsRegionalVisible(false);
    setIsViewReqVisible(false);
    setIsViewAgentVisible(false);
    setIsAllPropVisible(false);
    setIsPostedPropertiesVisible(false);
    setIsRequestVisible(false);
    setIsViewpostVisible(false);
    setIsAddExpertVisible(false);
    setIsRegSkillVisible(false);
    setIsViewSkillVisible(false);
    setAllSkilledLabour(false);
    setIsViewClientVisible(false);
    setIsViewCoreProVisible(false);
    setIsAddExpertPanelVisible(false);
    setIsAddRoleVisible(false);
    setIsAddDisVisible(false);
    setIsAddNriVisible(false);
    setIsExpertReqVisible(false);
    setIsAddConsVisible(false);
    setIsAddOccuVisible(false);
    setIsAddUseVisible(false);
    setIsAddExpertiseVisible(false);
    setIsAddProTypeVisible(false);
    setIsAddExperTypeVisible(false);
    setIsAddCountryVisible(false);
    setIsAddSkillVisible(false);
    setIsAddCoreVisible(false);
    setIsAddCoreProVisible(false);
    setIsViewNriVisible(false);
    setAddInvestor(false);
    setViewInvester(false);
    setAllViewInvester(false);
    setIsViewReferral(false);
    setIsAddReferral(false);
    setIsCoreMember(false);
    setIsViewCoreMember(false);
    setIsExpertPanelVisible(false);
    setViewApprovedProperties(false);
    setIsAddCallVisible(false);
    setIsViewCallVisible(false);
    setSoldPropertys(false);

    if (Platform.OS === "android") {
      setIsSidebarExpanded(false);
    }
    if (subItem === "View Customers") {
      setIsViewCustVisible(true);
    } else if (subItem === "Add Customer") {
      setIsAddCustVisible(true);
    } else if (subItem === "Register Executive Wealth Associate") {
      setIsExecuteVisible(true);
    } else if (subItem === "Register Wealth Associate") {
      setIsWealVisible(true);
    } else if (subItem === "Register Regional Wealth Associate") {
      setIsRegionalVisible(true);
    } else if (subItem === "View Agents") {
      setIsViewAgentVisible(true);
    } else if (subItem === "Post Property") {
      setIsPostedPropertiesVisible(true);
    } else if (subItem === "Request Property") {
      setIsRequestVisible(true);
    } else if (subItem === "View Posted Properties") {
      setIsViewpostVisible(true);
    } else if (subItem === "View Requested Properties") {
      setIsViewReqVisible(true);
    } else if (subItem === "View All Properties") {
      setIsAllPropVisible(true);
    } else if (subItem === "Register Skilled Resource") {
      setIsRegSkillVisible(true);
    } else if (subItem === "View Skilled Resource") {
      setIsViewSkillVisible(true);
    } else if (subItem === "View Core Clients") {
      setIsViewClientVisible(true);
    } else if (subItem === "View Core Projects") {
      setIsViewCoreProVisible(true);
    } else if (subItem === "Add Expert Panel") {
      setIsAddExpertPanelVisible(true);
    } else if (subItem === "Add Roles") {
      setIsAddRoleVisible(true);
    } else if (subItem === "Add Districts") {
      setIsAddDisVisible(true);
    } else if (subItem === "Add NRI Member") {
      setIsAddNriVisible(true);
    } else if (subItem === "Expert Panel Requests") {
      setIsExpertReqVisible(true);
    } else if (subItem === "Add Constituencies") {
      setIsAddConsVisible(true);
    } else if (subItem === "Add Occupation") {
      setIsAddOccuVisible(true);
    } else if (subItem === "Add User") {
      setIsAddUseVisible(true);
    } else if (subItem === "Add Expertise") {
      setIsAddExpertiseVisible(true);
    } else if (subItem === "Add Property Type") {
      setIsAddProTypeVisible(true);
    } else if (subItem === "Add Expert Type") {
      setIsAddExperTypeVisible(true);
    } else if (subItem === "Add Countries") {
      setIsAddCountryVisible(true);
    } else if (subItem === "Add Skill") {
      setIsAddSkillVisible(true);
    } else if (subItem === "Add Core Clients") {
      setIsAddCoreVisible(true);
    } else if (subItem === "Add Core Projects") {
      setIsAddCoreProVisible(true);
    } else if (subItem === "View NRI Members") {
      setIsViewNriVisible(true);
    } else if (subItem === "All Skilled Resources") {
      setAllSkilledLabour(true);
    } else if (subItem === "Add Investor") {
      setAddInvestor(true);
    } else if (subItem === "View Investors") {
      setViewInvester(true);
    } else if (subItem === "View All Investors") {
      setAllViewInvester(true);
    } else if (subItem === "View ReferralAgents") {
      setIsViewReferral(true);
    } else if (subItem === "Add ReferralAgents") {
      setIsAddReferral(true);
    } else if (subItem === "Add Core Member") {
      setIsCoreMember(true);
    } else if (subItem === "View Core Members") {
      setIsViewCoreMember(true);
    } else if (subItem === "expert details") {
      setIsExpertDetails(true);
    } else if (subItem === "View Expert Panel") {
      setIsExpertPanelVisible(true);
    } else if (subItem === "ViewApprovedProperties") {
      setViewApprovedProperties(true);
    } else if (subItem === "Add Call Executive") {
      setIsAddCallVisible(true);
    } else if (subItem === "View Call Executive") {
      setIsViewCallVisible(true);
    } else if (subItem === "View SoldedPropertys") {
      setSoldPropertys(true);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const closeModal = () => {
    setIsViewCustVisible(false);
    setIsAddCustVisible(false);
    setIsExecuteVisible(false);
    setIsWealVisible(false);
    setIsRegionalVisible(false);
    setIsViewAgentVisible(false);
    setIsViewReqVisible(false);
    setIsAllPropVisible(false);
    setIsPostedPropertiesVisible(false);
    setIsRequestVisible(false);
    setIsViewpostVisible(false);
    setIsAddExpertVisible(false);
    setIsRegSkillVisible(false);
    setIsViewSkillVisible(false);
    setIsViewClientVisible(false);
    setIsViewCoreProVisible(false);
    setIsAddExpertPanelVisible(false);
    setIsAddRoleVisible(false);
    setIsAddDisVisible(false);
    setIsAddNriVisible(false);
    setIsExpertReqVisible(false);
    setIsAddConsVisible(false);
    setIsAddOccuVisible(false);
    setIsAddUseVisible(false);
    setIsAddExpertiseVisible(false);
    setIsAddProTypeVisible(false);
    setIsAddExperTypeVisible(false);
    setIsAddCountryVisible(false);
    setIsAddSkillVisible(false);
    setIsAddCoreVisible(false);
    setIsAddCoreProVisible(false);
    setIsViewNriVisible(false);
    setAddInvestor(false);
    setIsViewReferral(false);
    setIsAddReferral(false);
    setIsCoreMember(false);
    setIsAddCallVisible(false);
    setIsViewCallVisible(false);
  };

  const renderContent = () => {
    if (isViewCustVisible) return <ViewCustomers />;
    if (isExpertPanelVisible) return <ExpertRoute />;
    if (isViewAgentVisible) return <ViewAgents />;
    if (isViewpostVisible) return <ViewPostedProperties />;
    if (isViewReqVisible) return <RequestedProperties />;
    if (isAllPropVisible) return <ViewAllProperties />;
    if (isViewSkillVisible) return <ViewSkilledLabours />;
    if (isViewClientVisible) return <Core_Clients />;
    if (isViewCoreProVisible) return <Core_Projects />;
    if (isExpertReqVisible) return <ExpertList />;
    if (isViewNriVisible) return <ViewNri />;
    if (AllSkilledLabour) return <AllSkilledLabours />;
    if (ViewInvester) return <ViewInvesters />;
    if (ViewAllInvester) return <ViewAllInvesters />;
    if (isViewReferral) return <ViewReferralAgents />;
    if (isViewCoreMember) return <ViewCoreMembers />;
    if (isExperDetails) return <ExpertDetails expertType={expertType} />;
    if (isViewApprovedProperties) return <ViewApprovedProperties />;
    if (isViewCallVisible) return <ViewCallExecutives />;
    if (isSoldPropertys) return <SoldPropertys />;

    return <Dashboard />;
  };

  //   const getDetails = async () => {
  //     try {
  //       // Await the token retrieval from AsyncStorage
  //       const token = await AsyncStorage.getItem("authToken");

  //       // Make the fetch request
  //       const response = await fetch(${API_URL}/agent/AgentDetails, {
  //         method: "GET",
  //         headers: {
  //           token: ${token} || "", // Fallback to an empty string if token is null
  //         },
  //       });

  //       // Parse the response
  //       const newDetails = await response.json();

  //       // Update state with the details
  //       setDetails(newDetails);
  //       console.log(Details);
  //     } catch (error) {
  //       console.error("Error fetching agent details:", error);
  //     }
  //   };

  //   useEffect(() => {
  //     getDetails();
  //   }, []);
  useEffect(() => {
    AsyncStorage.setItem("userType", "Admin");
    AsyncStorage.setItem("authToken", "Admin");
  });

  return (
    <View style={styles.container}>
      {/* Status Bar Adjustment for Android */}
      {Platform.OS === "android" && (
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      )}

      {/* Top Navbar */}
      <View style={styles.navbar}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <View style={styles.sear_icons}>
          <View style={styles.rightIcons}>
            <Image
              source={require("../assets/usflag.png")}
              style={styles.icon}
            />
            <Text style={styles.language}>English</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Main Screen"),
                AsyncStorage.removeItem("userType");
            }}
            style={{
              backgroundColor: "pink",
              width: 60,
              height: 20,
              borderRadius: 10,
              display: "flex",
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Layout */}
      <View style={styles.mainContent}>
        {/* Sidebar */}
        <View
          style={[
            styles.sidebar,
            Platform.OS === "android" &&
              (isSidebarExpanded
                ? styles.expandedSidebar
                : styles.collapsedSidebar),
          ]}
        >
          <ScrollView style={{ maxHeight: 600, minHeight: 200 }}>
            <FlatList
              data={menuItems}
              keyExtractor={(item) => item.title}
              scrollEnabled={false} // Disable scrolling for FlatList
              renderItem={({ item }) => (
                <View>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => toggleMenuItem(item.title)}
                  >
                    <Ionicons name={item.icon} size={24} color="#555" />
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
            <Text style={styles.lastUpdated}>Last Updated: 30.01.2025</Text>
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <View style={styles.container}>
            <ScrollView>
              <View style={styles.userContent}>
                {/* <Text style={styles.usersContentText}>
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
                </Text> */}
                <ScrollView style={{ height: "auto" }}>
                  {renderContent()}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Toggle Button for Sidebar (Android Only) */}
      {Platform.OS === "android" && (
        <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
          <Ionicons
            name={isSidebarExpanded ? "close-circle-outline" : "menu-outline"}
            size={30}
            color="#000"
          />
        </TouchableOpacity>
      )}
      <CustomModal isVisible={isAddCustVisible} closeModal={closeModal}>
        <RegisterExecute closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isExecuteVisible} closeModal={closeModal}>
        <Register closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isWealVisible} closeModal={closeModal}>
        <RegisterExecue closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isRegionalVisible} closeModal={closeModal}>
        <RegisterEx closeModal={closeModal} />
      </CustomModal>
      <CustomModal
        isVisible={isPostedPropertiesVisible}
        closeModal={closeModal}
      >
        <PostProperty closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isRequestVisible} closeModal={closeModal}>
        <RequestedPropertyForm closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isRegSkillVisible} closeModal={closeModal}>
        <Rskill closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddExpertPanelVisible} closeModal={closeModal}>
        <AddExpertPan closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddRoleVisible} closeModal={closeModal}>
        <AddRoleModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddDisVisible} closeModal={closeModal}>
        <AddDistrictModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddNriVisible} closeModal={closeModal}>
        <AddNRIMember closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddConsVisible} closeModal={closeModal}>
        <AddConstiModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddOccuVisible} closeModal={closeModal}>
        <AddOccuModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddUseVisible} closeModal={closeModal}>
        <AddUserForm closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddExpertiseVisible} closeModal={closeModal}>
        <AddExpertiseModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddProTypeVisible} closeModal={closeModal}>
        <AddProTypeModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddExperTypeVisible} closeModal={closeModal}>
        <AddExperTypeModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddCountryVisible} closeModal={closeModal}>
        <AddCountryModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddSkillVisible} closeModal={closeModal}>
        <AddSkillModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddCoreVisible} closeModal={closeModal}>
        <AddCoreClientForm closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddCoreProVisible} closeModal={closeModal}>
        <AddCoreProjectForm closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={AddInvestor} closeModal={closeModal}>
        <AddInvestors closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddReferral} closeModal={closeModal}>
        <AddReferral closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddCoreMember} closeModal={closeModal}>
        <AddCoreMember closeModal={closeModal} />
      </CustomModal>
      <CustomModal isVisible={isAddCallVisible} closeModal={closeModal}>
        <AddCallExecutive closeModal={closeModal} />
      </CustomModal>
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
    marginLeft: Platform.OS === "web" ? "0px" : "17%",
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
    gap: Platform.OS === "web" ? "10px" : 0,
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
  mainContent: {
    flexDirection: "row",
    flex: 1,
  },
  sidebar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRightWidth: 1,
    borderColor: "#ddd",
    width: Platform.OS === "android" ? 300 : 250,
    ...(Platform.OS === "web" && { minHeight: "100vh" }),
  },
  expandedSidebar: {
    width: 250,
  },
  collapsedSidebar: {
    width: 70,
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
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
    top: 25,
    left: 20,
    zIndex: 1000,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: Platform.OS === "web" ? "65%" : "100%",
    // backgroundColor: "#fff",
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
    // color: "#E82E5F",
  },
});

export default AdminDashboard;
