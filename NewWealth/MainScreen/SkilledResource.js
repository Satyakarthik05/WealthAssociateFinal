import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  TextInput,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Import all your category images
import drill from "../../assets/drill.jpg";
import glaziers from "../../assets/glaziers.jpg";
import granite from "../../assets/granite.jpg";
import cablepullers from "../../assets/cablepullers.jpg";
import carpenter from "../../assets/carpenter.jpg";
import conceret from "../../assets/conceret.jpg";
import drainage from "../../assets/drainage.jpg";
import drywall from "../../assets/drywall.jpg";
import Electricianswork from "../../assets/Electricianswork.jpg";
import falseceiling from "../../assets/falseceiling.jpg";
import havctech from "../../assets/hvactech.jpg";
import insulatorsfini from "../../assets/insulatorsfini.jpg";
import mason from "../../assets/mason.jpg";
import painterwork from "../../assets/painterwork.jpg";
import pipielayers from "../../assets/pipelayers.jpg";
import Plasterers from "../../assets/plasterers.jpg";
import plumberwork from "../../assets/plumberwork.jpg";
import roadmark from "../../assets/roadmark.jpg";
import roofers from "../../assets/roofers.jpg";
import scaff from "../../assets/scaff.jpg";
import solarinsta from "../../assets/solarinsta.jpg";
import surveyor from "../../assets/surveyor.jpg";
import tilers from "../../assets/tilers.jpg";
import tunnle from "../../assets/tunnle.jpg";
import Waterproofing from "../../assets/Waterproofing.jpg";
import welder from "../../assets/welder.png";

const { width } = Dimensions.get("window");

const SkilledResources = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  const skilledCategories = [
    {
      id: 1,
      name: "Drilling & Boring",
      image: drill,
      category: "Heavy Equipment",
    },
    {
      id: 2,
      name: "Masons",
      image: mason,
      category: "Construction",
    },
    {
      id: 3,
      name: "Carpenter",
      image: carpenter,
      category: "Woodwork",
    },
    {
      id: 5,
      name: "Concrete Workers",
      image: conceret,
      category: "Construction",
    },
    {
      id: 6,
      name: "Scaffolders",
      image: scaff,
      category: "Safety",
    },
    {
      id: 7,
      name: "Plasterers",
      image: Plasterers,
      category: "Finishing",
    },
    {
      id: 8,
      name: "Tilers",
      image: tilers,
      category: "Flooring",
    },
    {
      id: 9,
      name: "Painters",
      image: painterwork,
      category: "Finishing",
    },
    {
      id: 10,
      name: "Roofers",
      image: roofers,
      category: "Construction",
    },
    {
      id: 11,
      name: "Welders",
      image: welder,
      category: "Metalwork",
    },
    {
      id: 12,
      name: "Electricians",
      image: Electricianswork,
      category: "Electrical",
    },
    {
      id: 13,
      name: "Plumbers",
      image: plumberwork,
      category: "Plumbing",
    },
    {
      id: 14,
      name: "HVAC Techs",
      image: havctech,
      category: "Mechanical",
    },
    {
      id: 16,
      name: "Waterproofing",
      image: Waterproofing,
      category: "Finishing",
    },
    {
      id: 17,
      name: "Insulators",
      image: insulatorsfini,
      category: "Finishing",
    },
    {
      id: 18,
      name: "Glaziers",
      image: glaziers,
      category: "Glasswork",
    },
    {
      id: 19,
      name: "Granite Workers",
      image: granite,
      category: "Stonework",
    },
    {
      id: 20,
      name: "False Ceiling",
      image: falseceiling,
      category: "Interior",
    },
    {
      id: 21,
      name: "Drywall Installers",
      image: drywall,
      category: "Interior",
    },
    {
      id: 22,
      name: "Surveyors",
      image: surveyor,
      category: "Planning",
    },
    {
      id: 24,
      name: "Road Marking",
      image: roadmark,
      category: "Civil",
    },
    {
      id: 25,
      name: "Pipe Layers",
      image: pipielayers,
      category: "Plumbing",
    },
    {
      id: 26,
      name: "Cable Pullers",
      image: cablepullers,
      category: "Electrical",
    },
    {
      id: 27,
      name: "Drainage Workers",
      image: drainage,
      category: "Civil",
    },
    
    {
      id: 29,
      name: "Tunnel Workers",
      image: tunnle,
      category: "Heavy Construction",
    },
    {
      id: 31,
      name: "Solar Installers",
      image: solarinsta,
      category: "Electrical",
    },
  ];

  const filteredCategories = skilledCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = (category) => {
    navigation.navigate("SkilledWorkersList", {
      categoryName: category.name,
      categoryType: category.category,
    });
  };

  const handleAddSkilledUser = () => {
    navigation.navigate("regiskill");
  };

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={item.image} 
          style={styles.categoryImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TouchableOpacity onPress={() => navigation.goBack() }style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#3E5C76" />
                </TouchableOpacity>
          <Text style={styles.title}>Skilled Resources</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSkilledUser}
          >
            <Text style={styles.addButtonText}>Add {"\n"}Skilled User</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Find specialized workers for your project
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#3E5C76"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search skilled workers..."
            placeholderTextColor="#3E5C76"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#3E5C76" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={Platform.OS === 'web' ? 3 : 2}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>
              No matching skilled workers found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8E3E7",
    padding: Platform.OS === 'web' ? 20 : 15,
    paddingBottom: Platform.OS === 'web' ? "4%" : "20%",
    width: Platform.OS === "web" ? "80%" : "100%",
    alignSelf: "center",
  },
  header: {
    marginBottom: 15,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    // 
  },
  addButton: {
    backgroundColor: "#3E5C76",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
     marginTop:"15",
     marginLeft:"5",

  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign:"center"
   
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#34495e",
    height: 40,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#FDFDFD",
    borderRadius: 12,
    overflow: "hidden",
    margin: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  textContainer: {
    padding: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  categoryType: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#95a5a6",
    marginTop: 10,
  },
});

export default SkilledResources;