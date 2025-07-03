import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API_URL } from "../data/ApiUrl";

const { width } = Dimensions.get("window");

export default function ViewAgents() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [editedAgent, setEditedAgent] = useState({
    FullName: "",
    District: "",
    Contituency: "",
    MobileNumber: "",
    MyRefferalCode: "",
    ReferredBy: "",
    CallExecutiveName: "",
    assignedExecutive: "",
  });
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const [agentsRes, districtsRes] = await Promise.all([
        fetch(`${API_URL}/agent/allagents`),
        fetch(`${API_URL}/alldiscons/alldiscons`),
      ]);

      if (!agentsRes.ok) throw new Error("Failed to fetch agents");
      if (!districtsRes.ok) throw new Error("Failed to fetch districts");

      const agentsData = await agentsRes.json();
      const districtsData = await districtsRes.json();

      const sortedAgents = agentsData.data.sort((a, b) => {
        if (a.CallExecutiveCall === "Done" && b.CallExecutiveCall !== "Done")
          return 1;
        if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall === "Done")
          return -1;
        return 0;
      });

      setAgents(sortedAgents);
      setFilteredAgents(sortedAgents);
      setDistricts(districtsData || []);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter agents based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(
        (agent) =>
          (agent.FullName &&
            agent.FullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (agent.AgentType &&
            agent.AgentType.toLowerCase().includes(
              searchQuery.toLowerCase()
            )) ||
          (agent.MobileNumber && agent.MobileNumber.includes(searchQuery)) ||
          (agent.MyRefferalCode &&
            agent.MyRefferalCode.toLowerCase().includes(
              searchQuery.toLowerCase()
            )) ||
          (agent.referrerDetails?.name &&
            agent.referrerDetails.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (agent.CallExecutiveName &&
            agent.CallExecutiveName.toLowerCase().includes(
              searchQuery.toLowerCase()
            ))
      );
      setFilteredAgents(filtered);
    }
  }, [searchQuery, agents]);

  const handleRefresh = async () => {
    await fetchAllData();
  };

  const handleMarkAsDone = async (agentId) => {
    const confirm = () => {
      if (Platform.OS === "web") {
        return window.confirm(
          "Are you sure you want to mark this agent as done?"
        );
      } else {
        return new Promise((resolve) => {
          Alert.alert("Confirm", "Mark this agent as done?", [
            { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
            { text: "Confirm", onPress: () => resolve(true) },
          ]);
        });
      }
    };

    if (!(await confirm())) return;

    try {
      const response = await fetch(`${API_URL}/agent/markasdone/${agentId}`, {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Failed to update status");

      setAgents((prevAgents) => {
        const updated = prevAgents.map((agent) =>
          agent._id === agentId
            ? { ...agent, CallExecutiveCall: "Done" }
            : agent
        );
        return updated.sort((a, b) => {
          if (a.CallExecutiveCall === "Done" && b.CallExecutiveCall !== "Done")
            return 1;
          if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall === "Done")
            return -1;
          return 0;
        });
      });

      setFilteredAgents((prevAgents) => {
        const updated = prevAgents.map((agent) =>
          agent._id === agentId
            ? { ...agent, CallExecutiveCall: "Done" }
            : agent
        );
        return updated.sort((a, b) => {
          if (a.CallExecutiveCall === "Done" && b.CallExecutiveCall !== "Done")
            return 1;
          if (a.CallExecutiveCall !== "Done" && b.CallExecutiveCall === "Done")
            return -1;
          return 0;
        });
      });

      Alert.alert("Success", "Agent marked as done");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update agent status");
    }
  };

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent);
    setEditedAgent({
      FullName: agent.FullName,
      District: agent.District,
      Contituency: agent.Contituency,
      MobileNumber: agent.MobileNumber,
      MyRefferalCode: agent.MyRefferalCode,
      ReferredBy: agent.ReferredBy,
      CallExecutiveName: agent.CallExecutiveName || "",
      assignedExecutive: agent.assignedExecutive || "",
    });

    if (agent.District) {
      const district = districts.find((d) => d.parliament === agent.District);
      setConstituencies(district?.assemblies || []);
    }
    setEditModalVisible(true);
  };

  const handleDistrictChange = (district) => {
    setEditedAgent({
      ...editedAgent,
      District: district,
      Contituency: "",
    });
    const districtData = districts.find((d) => d.parliament === district);
    setConstituencies(districtData?.assemblies || []);
  };

  const handleSaveEditedAgent = async () => {
    try {
      const response = await fetch(
        `${API_URL}/agent/updateagent/${selectedAgent._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedAgent),
        }
      );

      if (!response.ok) throw new Error("Failed to update agent");

      const updatedAgent = await response.json();
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent._id === selectedAgent._id ? updatedAgent.data : agent
        )
      );
      setFilteredAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent._id === selectedAgent._id ? updatedAgent.data : agent
        )
      );

      setEditModalVisible(false);
      Alert.alert("Success", "Agent updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update agent");
    }
  };

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

      const response = await fetch(`${API_URL}/agent/deleteagent/${agentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete agent");

      setAgents((prevAgents) =>
        prevAgents.filter((agent) => agent._id !== agentId)
      );
      setFilteredAgents((prevAgents) =>
        prevAgents.filter((agent) => agent._id !== agentId)
      );
      Alert.alert("Success", "Agent deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete agent");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#0000ff"]}
            />
          ) : undefined
        }
      >
        <Text style={styles.heading}>My Agents</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, mobile, referral code or executive"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading agents...</Text>
          </View>
        ) : filteredAgents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.noAgentsText}>
              {searchQuery ? "No matching agents found" : "No agents found"}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {filteredAgents.map((agent) => (
              <View
                key={agent._id}
                style={[
                  styles.card,
                  agent.CallExecutiveCall === "Done"
                    ? styles.doneCard
                    : styles.pendingCard,
                ]}
              >
                <Image
                  source={
                    agent.photo && agent.photo !== ""
                      ? { uri: agent.photo }
                      : require("../assets/man.png")
                  }
                  style={styles.avatar}
                />

                <View style={styles.infoContainer}>
                  {agent.FullName && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Name</Text>
                      <Text style={styles.value}>: {agent.FullName}</Text>
                    </View>
                  )}
                  {agent.District && (
                    <View style={styles.row}>
                      <Text style={styles.label}>District</Text>
                      <Text style={styles.value}>: {agent.District}</Text>
                    </View>
                  )}
                  {agent.Contituency && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Constituency</Text>
                      <Text style={styles.value}>: {agent.Contituency}</Text>
                    </View>
                  )}
                  {agent.MobileNumber && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Mobile</Text>
                      <Text style={styles.value}>: {agent.MobileNumber}</Text>
                    </View>
                  )}
                  {agent.MyRefferalCode && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Referral Code</Text>
                      <Text style={styles.value}>: {agent.MyRefferalCode}</Text>
                    </View>
                  )}
                  {agent.ReferredBy && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Referred By Code</Text>
                      <Text style={styles.value}>: {agent.ReferredBy}</Text>
                    </View>
                  )}
                  {agent.referrerDetails && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Referred By</Text>
                      <Text style={styles.value}>
                        : {agent.referrerDetails.name} (
                        {agent.referrerDetails.phone})
                      </Text>
                    </View>
                  )}
                  {agent.referralStats && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Referral Counts</Text>
                      <Text style={styles.value}>
                        : A: {agent.referralStats.referredAgents || 0}, C:{" "}
                        {agent.referralStats.referredCustomers || 0}, I:{" "}
                        {agent.referralStats.addedInvestors || 0}, S:{" "}
                        {agent.referralStats.addedSkilled || 0}, N:{" "}
                        {agent.referralStats.addedNRIs || 0}
                      </Text>
                    </View>
                  )}
                  {agent.CallExecutiveName && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Executive</Text>
                      <Text style={styles.value}>
                        : {agent.CallExecutiveName}
                      </Text>
                    </View>
                  )}
                  {agent.assignedExecutive && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Executive ID</Text>
                      <Text style={styles.value}>
                        : {agent.assignedExecutive}
                      </Text>
                    </View>
                  )}
                  {agent.AgentType && (
                    <View style={styles.row}>
                      <Text style={styles.label}>AgentType</Text>
                      <Text style={styles.value}>{agent.AgentType}</Text>
                    </View>
                  )}
                  <View style={styles.row}>
                    <Text style={styles.label}>Status</Text>
                    <Text
                      style={[
                        styles.value,
                        agent.CallExecutiveCall === "Done"
                          ? styles.doneStatus
                          : styles.pendingStatus,
                      ]}
                    >
                      :{" "}
                      {agent.CallExecutiveCall === "Done" ? "Done" : "Pending"}
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  {agent.CallExecutiveCall !== "Done" && (
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => handleMarkAsDone(agent._id)}
                    >
                      <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditAgent(agent)}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAgent(agent._id)}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Agent</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={editedAgent.FullName}
              onChangeText={(text) =>
                setEditedAgent({ ...editedAgent, FullName: text })
              }
            />

            <Text style={styles.inputLabel}>District</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editedAgent.District}
                onValueChange={handleDistrictChange}
                style={styles.picker}
                dropdownIconColor="#000"
              >
                <Picker.Item label="Select District" value="" />
                {districts.map((district) => (
                  <Picker.Item
                    key={district.parliament}
                    label={district.parliament}
                    value={district.parliament}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Constituency</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editedAgent.Contituency}
                onValueChange={(itemValue) => {
                  setEditedAgent({
                    ...editedAgent,
                    Contituency: itemValue,
                  });
                }}
                style={styles.picker}
                dropdownIconColor="#000"
                enabled={!!editedAgent.District}
              >
                <Picker.Item label="Select Constituency" value="" />
                {constituencies.map((constituency) => (
                  <Picker.Item
                    key={constituency.name}
                    label={constituency.name}
                    value={constituency.name}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={editedAgent.MobileNumber}
              onChangeText={(text) =>
                setEditedAgent({ ...editedAgent, MobileNumber: text })
              }
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Referral Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Referral Code"
              value={editedAgent.MyRefferalCode}
              onChangeText={(text) =>
                setEditedAgent({ ...editedAgent, MyRefferalCode: text })
              }
            />

            <Text style={styles.inputLabel}>Referred By Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Referred By Code"
              value={editedAgent.ReferredBy}
              onChangeText={(text) =>
                setEditedAgent({ ...editedAgent, ReferredBy: text })
              }
            />

            <Text style={styles.inputLabel}>Executive Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Executive Name"
              value={editedAgent.CallExecutiveName}
              onChangeText={(text) =>
                setEditedAgent({ ...editedAgent, CallExecutiveName: text })
              }
            />

            <Text style={styles.inputLabel}>Executive ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Executive ID"
              value={editedAgent.assignedExecutive}
              onChangeText={(text) =>
                setEditedAgent({ ...editedAgent, assignedExecutive: text })
              }
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEditedAgent}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    marginVertical: 15,
    paddingLeft: 10,
    color: "#333",
  },
  searchContainer: {
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noAgentsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  refreshButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width > 600 ? "30%" : "100%",
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 15,
  },
  doneCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  pendingCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: "#ddd",
  },
  infoContainer: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    width: "100%",
  },
  label: {
    fontWeight: "bold",
    fontSize: 14,
    width: 120,
    color: "#555",
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  doneStatus: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  pendingStatus: {
    color: "#F44336",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: width > 600 ? "50%" : "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    marginRight: 10,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});