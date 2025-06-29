import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import agentImage from "../../assets/man.png";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isSmallWeb = isWeb && width < 450; // Check for small web screens

export default function ViewAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem("userType");
        const storedUserTypeValue = await AsyncStorage.getItem("userTypevalue");

        const currentUserType =
          storedUserTypeValue === "ValueAssociate"
            ? "ValueAssociate"
            : storedUserType || "";

        setUserType(currentUserType);

        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.error("Token not found in AsyncStorage");
          setLoading(false);
          return;
        }

        let endpoint = "";
        let body = null;
        let method = "GET";

        switch (currentUserType) {
          case "CoreMember":
            endpoint = `${API_URL}/core/myagents`;
            break;
          case "WealthAssociate":
          case "ReferralAssociate":
            endpoint = `${API_URL}/agent/myAgents`;
            break;
          case "ValueAssociate":
            const userDetails = await AsyncStorage.getItem("userDetails");
            if (userDetails) {
              const parsedDetails = JSON.parse(userDetails);
              if (parsedDetails.MyRefferalCode) {
                endpoint = `${API_URL}/agent/valueagents`;
                method = "POST";
                body = JSON.stringify({
                  referralCode: parsedDetails.MyRefferalCode,
                });
              }
            }
            break;
          default:
            setLoading(false);
            return;
        }

        const headers = {
          token: `${token}` || "",
        };

        if (method === "POST") {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(endpoint, {
          method,
          headers,
          body,
        });

        const data = await response.json();

        if (
          data &&
          Array.isArray(data.referredAgents || data.valueAgents || data)
        ) {
          const agentsData = data.referredAgents || data.valueAgents || data;
          setAgents(agentsData);
        } else {
          setAgents([]);
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteAgent = async (agentId) => {
    const confirmDelete = async () => {
      if (Platform.OS === "web") {
        return window.confirm("Are you sure you want to delete this agent?");
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this agent?",
            [
              {
                text: "Cancel",
                onPress: () => resolve(false),
                style: "cancel",
              },
              { text: "Delete", onPress: () => resolve(true) },
            ]
          );
        });
      }
    };

    try {
      const confirmed = await confirmDelete();
      if (!confirmed) return;

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        return;
      }

      const response = await fetch(`${API_URL}/agent/deleteagent/${agentId}`, {
        method: "DELETE",
        headers: {
          token: `${token}` || "",
        },
      });

      if (!response.ok) throw new Error("Failed to delete agent");

      setAgents((prevAgents) =>
        prevAgents.filter((agent) => agent._id !== agentId)
      );
      Alert.alert("Success", "Agent deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete agent");
    }
  };

  const handleAgentPress = (agent) => {
    if (userType !== "ValueAssociate") return;
    setSelectedAgent(agent);
    setModalVisible(true);
  };

  // Render agent cards in rows (3 per row on web, 1 for small screens)
  const renderAgentCards = () => {
    if (isWeb) {
      // For web: 3 cards per row (or 1 for small screens) with left alignment
      return (
        <View style={styles.webGrid}>
          {agents.map((agent) => (
            <AgentCard 
              key={agent._id} 
              agent={agent} 
              onPress={handleAgentPress}
              onDelete={handleDeleteAgent}
              userType={userType}
            />
          ))}
        </View>
      );
    } else {
      // For mobile: single column
      return agents.map((agent) => (
        <AgentCard 
          key={agent._id} 
          agent={agent} 
          onPress={handleAgentPress}
          onDelete={handleDeleteAgent}
          userType={userType}
        />
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>
          My Agents: {agents.length > 0 ? agents.length : "0"}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3E5C76"
            style={styles.loader}
          />
        ) : agents.length > 0 ? (
          <View style={styles.gridContainer}>
            {renderAgentCards()}
          </View>
        ) : (
          <Text style={styles.noAgentsText}>
            {userType === "CoreMember" ||
            userType === "WealthAssociate" ||
            userType === "ReferralAssociate" ||
            userType === "ValueAssociate"
              ? "No agents found."
              : "This feature is only available for Core Members and Associates."}
          </Text>
        )}
      </ScrollView>

      {/* Modal for Value Associate */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {selectedAgent?.FullName}'s Referral Stats
            </Text>

            {selectedAgent?.referralStats ? (
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Referred Agents:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.referredAgents || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Referred Customers:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.referredCustomers || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Added Investors:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.addedInvestors || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Added Skilled:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.addedSkilled || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Added NRIs:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.addedNRIs || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Posted Properties:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.postedProperties || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Approved Properties:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.approvedProperties || 0}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Last Updated:</Text>
                  <Text style={styles.statValue}>
                    {selectedAgent.referralStats.lastUpdated
                      ? new Date(
                          selectedAgent.referralStats.lastUpdated
                        ).toLocaleString()
                      : "N/A"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noStatsText}>
                No referral stats available
              </Text>
            )}

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Separate AgentCard component with improved design
const AgentCard = ({ agent, onPress, onDelete, userType }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(agent)}
      activeOpacity={userType === "ValueAssociate" ? 0.6 : 1}
    >
      <View style={styles.cardHeader}>
        <Image
          source={
            typeof agent.photo === "string" && agent.photo.trim() !== ""
              ? { uri: agent.photo }
              : agentImage
          }
          style={styles.avatar}
        />
        <Text style={styles.agentName} numberOfLines={1} ellipsizeMode="tail">
          {agent.FullName}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>District:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {agent.District}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Constituency:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {agent.Contituency}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Referral Code:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {agent.MyRefferalCode}
          </Text>
        </View>
        {agent.MobileNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>{agent.MobileNumber}</Text>
          </View>
        )}
        {agent.Locations && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
              {agent.Locations}
            </Text>
          </View>
        )}
      </View>
      
      {userType !== "ValueAssociate" && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(agent._id)}
        >
          <Text style={styles.deleteButtonText}>Delete Agent</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 90,
  },
  scrollContainer: {
    width: "100%",
    paddingHorizontal: isSmallWeb ? 5 : (isWeb ? 20 : 10),
  },
  loader: {
    marginTop: 40,
  },
  heading: {
    fontSize: isSmallWeb ? 20 : 24,
    fontWeight: "bold",
    color: "#3E5C76",
    marginVertical: 20,
    marginLeft: isWeb ? (isSmallWeb ? 5 : 10) : 0,
  },
  gridContainer: {
    width: "100%",
  },
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginLeft: isWeb ? (isSmallWeb ? -5 : -10) : 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: isWeb ? (isSmallWeb ? "90%" : "31%") : "88%",
    margin: isWeb ? (isSmallWeb ? 5 : 10) : 15,
    padding: isSmallWeb ? 12 : 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  avatar: {
    width: isSmallWeb ? 50 : 60,
    height: isSmallWeb ? 50 : 60,
    borderRadius: isSmallWeb ? 25 : 30,
    marginRight: isSmallWeb ? 10 : 15,
    backgroundColor: "#f0f0f0",
  },
  agentName: {
    fontSize: isSmallWeb ? 16 : 18,
    fontWeight: "600",
    color: "#3E5C76",
    flexShrink: 1,
    maxWidth: isSmallWeb ? width - 180 : width - 200,
  },
  infoContainer: {
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: isSmallWeb ? 12 : 14,
    color: "#6c757d",
    fontWeight: "500",
    flexShrink: 1,
  },
  infoValue: {
    fontSize: isSmallWeb ? 12 : 14,
    color: "#495057",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "50%",
  },
  noAgentsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: isSmallWeb ? 14 : 16,
    color: "#6c757d",
    width: "100%",
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: "#e63946",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    width: "100%"
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isSmallWeb ? 12 : 14,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: isSmallWeb ? 15 : 25,
    width: "90%",
    maxWidth: isSmallWeb ? 350 : 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: isSmallWeb ? 18 : 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#3E5C76",
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    marginTop: 20,
  },
  buttonClose: {
    backgroundColor: "#3E5C76",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: isSmallWeb ? 14 : 16,
  },
  statsContainer: {
    width: "100%",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statLabel: {
    fontWeight: "bold",
    fontSize: isSmallWeb ? 14 : 16,
    color: "#495057",
  },
  statValue: {
    fontSize: isSmallWeb ? 14 : 16,
    color: "#3E5C76",
  },
  noStatsText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: isSmallWeb ? 14 : 16,
    color: "#6c757d",
  },
});