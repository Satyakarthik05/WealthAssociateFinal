import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

const CallExecutivesScreen = () => {
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExecutives = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/callexe/call-executives`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setExecutives(data);
    } catch (error) {
      console.error("Error fetching executives:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExecutives();
  };

  useEffect(() => {
    fetchExecutives();
  }, []);

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch (e) {
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#4CAF50";
      case "inactive":
        return "#F44336";
      case "on break":
        return "#FFC107";
      default:
        return "#9E9E9E";
    }
  };

  const renderEnabledNotifications = (notificationSettings) => {
    if (!notificationSettings) return null;

    const enabledNotifications = Object.entries(notificationSettings)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);

    if (enabledNotifications.length === 0) {
      return <Text style={styles.noNotificationsText}>No notifications enabled</Text>;
    }

    return enabledNotifications.map((notification, index) => (
      <View key={index} style={styles.notificationItem}>
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>
            {notification.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Text>
        </View>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LottieView
          source={require("../../assets/animations/home[1].json")}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>Call Executives</Text>
        
        {executives.length === 0 ? (
          <Text style={styles.noDataText}>No executives found</Text>
        ) : (
          executives.map((executive, index) => (
            <View key={executive._id || index} style={styles.executiveCard}>
              <View style={styles.executiveHeader}>
                <Text style={styles.executiveName}>{executive.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(executive.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {executive.status ? executive.status.toUpperCase() : "UNKNOWN"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{executive.phone || "N/A"}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{executive.location || "N/A"}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {executive.assignedType || "N/A"}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Login:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(executive.lastLoginTime)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Logout:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(executive.lastLogoutTime)}
                </Text>
              </View>
              
              <View style={styles.notificationSection}>
                <Text style={styles.sectionTitle}>Enabled Notifications:</Text>
                <View style={styles.notificationsContainer}>
                  {renderEnabledNotifications(executive.notificationSettings)}
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Users:</Text>
                <Text style={styles.detailValue}>
                  {executive.assignedUsers?.length || 0}
                </Text>
              </View>
              
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0495CA",
    marginVertical: 15,
    textAlign: "center",
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  executiveCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  executiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  executiveName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  detailLabel: {
    fontWeight: "bold",
    width: 120,
    color: "#555",
  },
  detailValue: {
    flex: 1,
    color: "#333",
  },
  notificationSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#555",
  },
  notificationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  notificationItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  notificationBadge: {
    backgroundColor: "#0495CA",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  notificationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  noNotificationsText: {
    color: "#666",
    fontStyle: "italic",
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: "#D81B60",
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CallExecutivesScreen;