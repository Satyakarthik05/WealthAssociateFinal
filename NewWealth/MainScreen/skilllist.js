import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../data/ApiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import avatar from "../../assets/man.png";

const SkilledWorkersList = ({ route }) => {
  const { categoryName, categoryType } = route.params;
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSkilledWorkers = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.error("No token found in AsyncStorage");
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/skillLabour/list`, {
          method: "GET",
          headers: {
            token: `${token}` || "",
          },
        });

        const data = await response.json();
        if (response.ok && Array.isArray(data.skilledLabours)) {
          // Filter workers by the selected category
          const filteredWorkers = data.skilledLabours.filter(
            (worker) => worker.SelectSkill === categoryName
          );
          setWorkers(filteredWorkers);
          setFilteredWorkers(filteredWorkers);
        } else {
          setError(data.message || "Failed to fetch workers");
          setWorkers([]);
          setFilteredWorkers([]);
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
        setError("An error occurred while fetching workers");
        setWorkers([]);
        setFilteredWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSkilledWorkers();
  }, [categoryName]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter((worker) =>
        worker.Location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWorkers(filtered);
    }
  }, [searchQuery, workers]);

  const renderWorkerItem = ({ item }) => (
    <TouchableOpacity style={styles.workerCard}>
      <Image source={avatar} style={styles.workerImage} />
      <View style={styles.workerDetails}>
        <Text style={styles.workerName}>{item.FullName}</Text>
        <View style={styles.contactContainer}>
          <Ionicons name="call" size={14} color="#3498db" />
          <Text style={styles.contactText}> {item.MobileNumber}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>4.5</Text>
          <Text style={styles.experienceText}>
            {" "}
            • {item.Experience || "Experienced"}
          </Text>
        </View>
        <View style={styles.skillsContainer}>
          <View style={styles.skillTag}>
            <Text style={styles.skillText}>{item.SelectSkill}</Text>
          </View>
          <View style={styles.skillTag}>
            <Text style={styles.skillText}>{item.Location}</Text>
          </View>
        </View>
        {item.AdditionalSkills && (
          <View style={styles.additionalSkillsContainer}>
            <Text style={styles.additionalSkillsText}>
              Skills: {item.AdditionalSkills}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName}</Text>
      <Text style={styles.subHeader}>{categoryType} specialists</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#95a5a6"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3e50" />
          <Text style={styles.loadingText}>Finding skilled workers...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : filteredWorkers.length > 0 ? (
        <FlatList
          data={filteredWorkers}
          renderItem={renderWorkerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() === ""
              ? "No workers available in this category"
              : "No workers found in this location"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    marginTop:20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
  },
  workerCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    alignSelf: "center",
  },
  workerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  workerDetails: {
    width: "100%",
    alignItems: "center",
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#34495e",
    textAlign: "center",
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    color: "#3498db",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 5,
    color: "#2c3e50",
    fontWeight: "500",
  },
  experienceText: {
    color: "#7f8c8d",
    fontSize: 14,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 5,
  },
  skillTag: {
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 3,
  },
  skillText: {
    fontSize: 12,
    color: "#2c3e50",
  },
  additionalSkillsContainer: {
    width: "100%",
    padding: 5,
  },
  additionalSkillsText: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#7f8c8d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#95a5a6",
    fontSize: 16,
  },
});

export default SkilledWorkersList;
