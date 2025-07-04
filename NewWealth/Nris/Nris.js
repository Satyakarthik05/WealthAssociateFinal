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
import logo1 from "../../assets/man.png";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isSmallWeb = isWeb && width < 450; // Check for small web screens

export default function ViewNri() {
  const [nriMembers, setNriMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [userType, setUserType] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserTypeAndMembers = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem("userType");
        setUserType(storedUserType || "");
        await fetchNriMembers();
      } catch (error) {
        console.error("Error fetching user type:", error);
        setLoading(false);
      }
    };
    fetchUserTypeAndMembers();
  }, []);

  const fetchNriMembers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/nri/getmynris`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      const data = await response.json();
      setNriMembers(data?.referredMembers || []);
    } catch (error) {
      console.error("Error fetching NRI members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId, memberName) => {
    const confirmDelete = async () => {
      if (Platform.OS === "web") {
        return window.confirm(`Are you sure you want to delete ${memberName}?`);
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete ${memberName}?`,
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

      setDeletingId(memberId);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found in AsyncStorage");
        return;
      }

      const response = await fetch(
        `${API_URL}/nri/deletenri/${memberId}`,
        {
          method: "DELETE",
          headers: {
            token: `${token}` || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete member");
      }

      setNriMembers(prevMembers => 
        prevMembers.filter(member => member._id !== memberId)
      );
      Alert.alert("Success", "Member deleted successfully");
    } catch (error) {
      console.error("Error deleting member:", error);
      Alert.alert("Error", "Failed to delete member");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMemberPress = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const renderMemberCards = () => {
    if (isWeb) {
      return (
        <View style={styles.webGrid}>
          {nriMembers.map((member) => (
            <MemberCard 
              key={member._id} 
              member={member} 
              onPress={handleMemberPress}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </View>
      );
    } else {
      return nriMembers.map((member) => (
        <MemberCard 
          key={member._id} 
          member={member} 
          onPress={handleMemberPress}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>
          NRI Members: {nriMembers.length > 0 ? nriMembers.length : "0"}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3E5C76"
            style={styles.loader}
          />
        ) : nriMembers.length > 0 ? (
          <View style={styles.gridContainer}>
            {renderMemberCards()}
          </View>
        ) : (
          <Text style={styles.noMembersText}>
            No NRI members found.
          </Text>
        )}
      </ScrollView>

      {/* Modal for Member Details */}
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
              {selectedMember?.Name}'s Details
            </Text>

            {selectedMember ? (
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Mobile (India):</Text>
                  <Text style={styles.statValue}>
                    {selectedMember.MobileIN || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Mobile (Country):</Text>
                  <Text style={styles.statValue}>
                    {selectedMember.MobileCountryNo || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Occupation:</Text>
                  <Text style={styles.statValue}>
                    {selectedMember.Occupation || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Country:</Text>
                  <Text style={styles.statValue}>
                    {selectedMember.Country || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Location:</Text>
                  <Text style={styles.statValue}>
                    {selectedMember.Locality || "N/A"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noStatsText}>
                No member details available
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

const MemberCard = ({ member, onPress, onDelete, deletingId }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(member)}
      activeOpacity={0.6}
    >
      <View style={styles.cardHeader}>
        <Image source={logo1} style={styles.avatar} />
        <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
          {member.Name}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile (IN):</Text>
          <Text style={styles.infoValue}>{member.MobileIN || "N/A"}</Text>
        </View>
        {member.MobileCountryNo && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile (Country):</Text>
            <Text style={styles.infoValue}>{member.MobileCountryNo}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Occupation:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {member.Occupation || "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Country:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {member.Country || "N/A"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(member._id, member.Name)}
        disabled={deletingId === member._id}
      >
        {deletingId === member._id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Member</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 90,
    borderRadius: 30
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
  memberName: {
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
  noMembersText: {
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
    width: "80%",
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