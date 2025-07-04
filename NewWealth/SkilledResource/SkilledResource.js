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
import avatar from "../../assets/man.png";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isSmallWeb = isWeb && width < 450; // Check for small web screens

export default function SkilledLaboursScreen() {
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState("");
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchMySkilledLabours();
  }, []);

  const fetchMySkilledLabours = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const storedUserType = await AsyncStorage.getItem("userType");
      const storedUserTypeValue = await AsyncStorage.getItem("userTypevalue");

      const currentUserType =
        storedUserTypeValue === "ValueAssociate"
          ? "ValueAssociate"
          : storedUserType || "";

      if (!token) {
        console.error("No token found in AsyncStorage");
        setLoading(false);
        return;
      }

      setUserType(currentUserType);

      const response = await fetch(`${API_URL}/skillLabour/getmyskilllabour`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data.data)) {
          setLabours(data.data);
        } else if (Array.isArray(data)) {
          setLabours(data);
        } else {
          setLabours([]);
        }
      } else {
        setLabours([]);
      }
    } catch (error) {
      console.error("Error fetching skilled labours:", error);
      Alert.alert("Error", "Failed to fetch skilled labours");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = async () => {
      if (Platform.OS === "web") {
        return window.confirm(
          "Are you sure you want to delete this skilled labour?"
        );
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this skilled labour?",
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

      setDeletingId(id);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("No token found in AsyncStorage");
        return;
      }

      const response = await fetch(`${API_URL}/skillLabour/delete/${id}`, {
        method: "DELETE",
        headers: {
          token: `${token}` || "",
        },
      });

      if (response.ok) {
        setLabours(labours.filter((labour) => labour._id !== id));
        Alert.alert("Success", "Skilled labour deleted successfully");
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.message || "Failed to delete skilled labour"
        );
      }
    } catch (error) {
      console.error("Error deleting skilled labour:", error);
      Alert.alert("Error", "An error occurred while deleting skilled labour");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLabourPress = (labour) => {
    if (userType !== "ValueAssociate") return;
    setSelectedLabour(labour);
    setModalVisible(true);
  };

  const renderLabourCards = () => {
    if (isWeb) {
      return (
        <View style={styles.webGrid}>
          {labours.map((labour) => (
            <LabourCard
              key={labour._id}
              labour={labour}
              onPress={handleLabourPress}
              onDelete={handleDelete}
              userType={userType}
              deletingId={deletingId}
            />
          ))}
        </View>
      );
    } else {
      return labours.map((labour) => (
        <LabourCard
          key={labour._id}
          labour={labour}
          onPress={handleLabourPress}
          onDelete={handleDelete}
          userType={userType}
          deletingId={deletingId}
        />
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>
          My Skilled Resources: {labours.length > 0 ? labours.length : "0"}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3E5C76"
            style={styles.loader}
          />
        ) : labours.length > 0 ? (
          <View style={styles.gridContainer}>{renderLabourCards()}</View>
        ) : (
          <Text style={styles.noLaboursText}>
            {userType === "CoreMember" ||
            userType === "WealthAssociate" ||
            userType === "ReferralAssociate" ||
            userType === "ValueAssociate"
              ? "No skilled resources found."
              : "This feature is only available for Core Members and Associates."}
          </Text>
        )}
      </ScrollView>

      {/* Modal for Labour Details */}
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
              {selectedLabour?.FullName}'s Details
            </Text>

            {selectedLabour ? (
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Skill Type:</Text>
                  <Text style={styles.statValue}>
                    {selectedLabour.SelectSkill || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Mobile Number:</Text>
                  <Text style={styles.statValue}>
                    {selectedLabour.MobileNumber || "N/A"}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Location:</Text>
                  <Text style={styles.statValue}>
                    {selectedLabour.Location || "N/A"}
                  </Text>
                </View>
                {userType === "CoreMember" && (
                  <>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>District:</Text>
                      <Text style={styles.statValue}>
                        {selectedLabour.District || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Constituency:</Text>
                      <Text style={styles.statValue}>
                        {selectedLabour.Contituency || "N/A"}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <Text style={styles.noStatsText}>
                No skilled labour details available
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

const LabourCard = ({ labour, onPress, onDelete, userType, deletingId }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(labour)}
      activeOpacity={userType === "ValueAssociate" ? 0.6 : 1}
    >
      <View style={styles.cardHeader}>
        <Image source={avatar} style={styles.avatar} />
        <Text style={styles.labourName} numberOfLines={1} ellipsizeMode="tail">
          {labour.FullName}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Skill Type:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {labour.SelectSkill}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile:</Text>
          <Text style={styles.infoValue}>{labour.MobileNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {labour.Location}
          </Text>
        </View>
        {userType === "CoreMember" && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>District:</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {labour.District || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Constituency:</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {labour.Contituency || "N/A"}
              </Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(labour._id)}
        disabled={deletingId === labour._id}
      >
        {deletingId === labour._id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </>
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
  },
  scrollContainer: {
    width: "100%",
    paddingHorizontal: isSmallWeb ? 5 : isWeb ? 20 : 10,
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
  labourName: {
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
  noLaboursText: {
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
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isSmallWeb ? 12 : 14,
    marginLeft: 8,
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
