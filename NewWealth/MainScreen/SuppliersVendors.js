import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  FlatList,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import paint1 from "../../assets/paint1.jpg";
import paint2 from "../../assets/paint2.jpg";
import paint3 from "../../assets/paint3.jpg";
import paint4 from "../../assets/paint4.jpg";
import Hvac1 from "../../assets/Hvac1.jpg";
import Hvac2 from "../../assets/Hvac2.jpg";
import Hvac3 from "../../assets/Hvac3.jpg";                                               
import Hvac4 from "../../assets/Hvac4.jpg";
import Land1 from "../../assets/Land1.jpg";
import Land2 from "../../assets/Land2.jpg";
import Land3 from "../../assets/Land3.jpg";
import Land4 from "../../assets/Land4.jpg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import Sand_Aggregates from "../../assets/Sand_Aggregates.jpg";
import cement from "../../assets/cement.jpg";
import steel from "../../assets/steel.jpeg";
import bricks from "../../assets/bricks.jpg";
import timber from "../../assets/timber.jpg";
import heavy from "../../assets/heavy.jpg";
import power from "../../assets/power.png";
import hand from "../../assets/hand.png";
import measure from "../../assets/measure.jpg";
import pipes from "../../assets/pipes.png";
import wire from "../../assets/wire.jpg";
import outlet from "../../assets/outlet.jpg";
import sanitary from "../../assets/sanitary.jpeg";
import marblebased from "../../assets/marblebased.jpg";
import decorative from "../../assets/decorative.jpg";
import door from "../../assets/door.jpg";
import delivery from "../../assets/delivery.jpg";
import interior from "../../assets/interior.jpg";
import crane from "../../assets/crane.jpg";
import hazaradous from "../../assets/hazaradous.jpg";
import heavyequipment from "../../assets/heavyequipment.jpg";
import recycle from "../../assets/recycle.jpg";
import siteclean from "../../assets/siteclean.jpg";
import storage from "../../assets/storage.jpg";
import waste from "../../assets/waste.jpg";
import precast from "../../assets/precast.jpg";
import prefab from "../../assets/prefab.jpg";
import modular from "../../assets/modular.jpg";

const vendorSubcategories = {
  "Building Materials Suppliers / బిల్డింగ్ మెటీరియల్స్ సరఫరాదారులు": [
    {
      id: 1,
      name: "Sand and Aggregates / ఇసుక మరియు కంకర",
      image: Sand_Aggregates,
      description: "Construction-grade sand, gravel, crushed stone / నిర్మాణ-శ్రేణి ఇసుక, కంకర, చూర్ణం చేసిన రాయి",
    },
    {
      id: 2,
      name: "Cement and Concrete / సిమెంట్ మరియు కాంక్రీటు",
      image: cement,
      description: "Various types of cement, ready-mix concrete / వివిధ రకాల సిమెంట్, రెడీ-మిక్స్ కాంక్రీటు",
    },
    {
      id: 3,
      name: "Structural Steel / నిర్మాణ ఉక్కు",
      image: steel,
      description: "Beams, columns, rebars / బీమ్లు, కాలమ్లు, రీబార్లు",
    },
    {
      id: 4,
      name: "Bricks and Blocks / ఇటుకలు మరియు బ్లాక్స్",
      image: bricks,
      description: "Clay bricks, concrete blocks / ఇటుకలు, కాంక్రీట్ బ్లాక్స్",
    },
    {
      id: 5,
      name: "Timber and Wood Products / కలప మరియు చెక్క ఉత్పత్తులు",
      image: timber,
      description: "Lumber, plywood, veneers / కలప, ప్లైవుడ్, వెనీర్స్",
    },
  ],
  "Equipment and Tool Suppliers / పరికరాలు మరియు సాధనాలు సరఫరాదారులు": [
    {
      id: 1,
      name: "Heavy Machinery / హెవీ మెషినరీ",
      image: heavy,
      description: "Excavators, bulldozers, cranes / ఎక్స్కవేటర్లు, బుల్డోజర్లు, క్రేన్లు",
    },
    {
      id: 2,
      name: "Power Tools / పవర్ టూల్స్",
      image: power,
      description: "Drills, saws, grinders / డ్రిల్స్, సాస్, గ్రైండర్లు",
    },
    {
      id: 3,
      name: "Hand Tools / హ్యాండ్ టూల్స్",
      image: hand,
      description: "Hammers, wrenches, screwdrivers / సుత్తులు, రెంచ్, స్క్రూడ్రైవర్లు",
    },
    {
      id: 4,
      name: "Measuring Tools / కొలిచే సాధనాలు",
      image: measure,
      description: "Levels, tape measures / స్థాయిలు, టేప్ కొలతలు",
    },
  ],
  "Plumbing and Electrical Suppliers / ప్లంబింగ్ మరియు ఎలక్ట్రికల్ సరఫరాదారులు": [
    {
      id: 1,
      name: "Pipes and Fittings / పైపులు మరియు ఫిట్టింగ్స్",
      image: pipes,
      description: "PVC, CPVC, copper pipes / పివిసి, సిపివిసి, రాగి పైపులు",
    },
    {
      id: 2,
      name: "Electrical Wiring / ఎలక్ట్రికల్ వైరింగ్",
      image: wire,
      description: "Cables, wires, conductors / కేబుల్స్, వైర్లు, కండక్టర్లు",
    },
    {
      id: 3,
      name: "Switches and Outlets / స్విచ్లు మరియు అవుట్లెట్లు",
      image: outlet,
      description: "Electrical switches, outlets / ఎలక్ట్రికల్ స్విచ్లు, అవుట్లెట్లు",
    },
    {
      id: 4,
      name: "Sanitary Fixtures / సానిటరీ ఫిక్స్చర్స్",
      image: sanitary,
      description: "Toilets, sinks, faucets / టాయిలెట్లు, సింక్లు, నాళాలు",
    },
  ],
  "Paint and Finishing Suppliers / పెయింట్ మరియు ఫినిషింగ్ సరఫరాదారులు": [
    {
      id: 1,
      name: "Interior Paint / ఇంటీరియర్ పెయింట్",
      image: paint1,
      description: "Wall paints, primers / గోడ పెయింట్లు, ప్రైమర్లు",
    },
    {
      id: 2,
      name: "Exterior Paint / ఎక్స్టీరియర్ పెయింట్",
      image: paint2,
      description: "Weather-resistant paints / వాతావరణ-నిరోధక పెయింట్లు",
    },
    {
      id: 3,
      name: "Varnishes and Wood Finishes / వార్నిష్లు మరియు వుడ్ ఫినిషెస్",
      image: paint3,
      description: "Stains, varnishes / దాగలు, వార్నిష్లు",
    },
    {
      id: 4,
      name: "Painting Tools / పెయింటింగ్ టూల్స్",
      image: paint4,
      description: "Brushes, rollers, sprayers / బ్రష్లు, రోలర్లు, స్ప్రేయర్లు",
    },
  ],
  "HVAC Suppliers / HVAC సరఫరాదారులు": [
    {
      id: 1,
      name: "Air Conditioners / ఎయిర్ కండీషనర్లు",
      image: Hvac1,
      description: "Split ACs, window ACs / స్ప్లిట్ ఎసి, విండో ఎసి",
    },
    {
      id: 2,
      name: "Heating Systems / హీటింగ్ సిస్టమ్స్",
      image: Hvac2,
      description: "Furnaces, boilers / ఫర్నేస్లు, బాయిలర్లు",
    },
    {
      id: 3,
      name: "Ventilation Equipment / వెంటిలేషన్ ఉపకరణాలు",
      image: Hvac3,
      description: "Fans, blowers / ఫ్యాన్లు, బ్లోయర్లు",
    },
    {
      id: 4,
      name: "Ductwork and Vents / డక్ట్వర్క్ మరియు వెంట్స్",
      image: Hvac4,
      description: "Ducts, vents, grilles / డక్ట్స్, వెంట్స్, గ్రిల్లెస్",
    },
  ],
  "Landscaping Suppliers / ల్యాండ్స్కేపింగ్ సరఫరాదారులు": [
    {
      id: 1,
      name: "Plants and Trees / మొక్కలు మరియు చెట్లు",
      image: Land1,
      description: "Ornamental plants, trees / అలంకార మొక్కలు, చెట్లు",
    },
    {
      id: 2,
      name: "Soil and Mulch / నేల మరియు మల్చ్",
      image: Land2,
      description: "Topsoil, potting soil / టాప్సాయిల్, పాటింగ్ మట్టి",
    },
    {
      id: 3,
      name: "Irrigation Systems / నీటిపారుదల వ్యవస్థలు",
      image: Land3,
      description: "Sprinklers, drip irrigation / స్ప్రింక్లర్లు, డ్రిప్ నీటిపారుదల",
    },
    {
      id: 4,
      name: "Outdoor Hardscaping / బయటి హార్డ్స్కేపింగ్",
      image: Land4,
      description: "Pavers, retaining walls / పేవర్స్, రిటైనింగ్ వాల్లు",
    },
  ],
  "Prefabricated Construction Materials / ప్రీఫాబ్రికేటెడ్ కన్స్ట్రక్షన్ మెటీరియల్స్": [
    {
      id: 1,
      name: "Prefab Wall Panels / ప్రీఫాబ్ వాల్ ప్యానెల్స్",
      image: prefab,
      description: "Factory-made wall panels / ఫ్యాక్టరీ-తయారీ గోడ ప్యానెల్స్",
    },
    {
      id: 2,
      name: "Modular Units / మాడ్యులర్ యూనిట్లు",
      image: modular,
      description: "Prefabricated modular units / ప్రీఫాబ్రికేటెడ్ మాడ్యులర్ యూనిట్లు",
    },
    {
      id: 3,
      name: "Precast Concrete / ప్రీకాస్ట్ కాంక్రీటు",
      image: precast,
      description: "Precast concrete elements / ప్రీకాస్ట్ కాంక్రీట్ ఎలిమెంట్స్",
    },
    {
      id: 4,
      name: "Steel Structures / స్టీల్ స్ట్రక్చర్స్",
      image: steel,
      description: "Pre-engineered steel buildings / ప్రీ-ఇంజనీర్డ్ స్టీల్ భవనాలు",
    },
  ],
  "Waste Management and Disposal / వేస్ట్ మేనేజ్మెంట్ మరియు డిస్పోజల్": [
    {
      id: 1,
      name: "Waste Containers / వేస్ట్ కంటైనర్లు",
      image: waste,
      description: "Dumpsters, bins / డంప్స్టర్లు, బిన్లు",
    },
    {
      id: 2,
      name: "Recycling Services / రీసైక్లింగ్ సేవలు",
      image: recycle,
      description: "Material recycling services / మెటీరియల్ రీసైక్లింగ్ సేవలు",
    },
    {
      id: 3,
      name: "Hazardous Waste Handling / హజార్డస్ వేస్ట్ హ్యాండ్లింగ్",
      image: hazaradous,
      description: "Safe disposal services / సురక్షిత డిస్పోజల్ సేవలు",
    },
    {
      id: 4,
      name: "Site Cleanup / సైట్ శుభ్రం",
      image: siteclean,
      description: "Post-construction cleanup / నిర్మాణం తర్వాత శుభ్రపరచడం",
    },
  ],
  "Logistics and Transport / లాజిస్టిక్స్ మరియు ట్రాన్స్పోర్ట్": [
    {
      id: 1,
      name: "Material Delivery / మెటీరియల్ డెలివరీ",
      image: delivery,
      description: "Transportation services / రవాణా సేవలు",
    },
    {
      id: 2,
      name: "Heavy Equipment Transport / హెవీ ఎక్విప్మెంట్ ట్రాన్స్పోర్ట్",
      image: heavyequipment,
      description: "Equipment moving services / పరికరాలు తరలించే సేవలు",
    },
    {
      id: 3,
      name: "On-Site Storage / సైట్ స్టోరేజ్",
      image: storage,
      description: "Temporary storage solutions / తాత్కాలిక నిల్వ పరిష్కారాలు",
    },
    {
      id: 4,
      name: "Crane Services / క్రేన్ సేవలు",
      image: crane,
      description: "Crane rental services / క్రేన్ అద్దె సేవలు",
    },
  ],
  "Architectural and Design Suppliers / ఆర్కిటెక్చరల్ మరియు డిజైన్ సరఫరాదారులు": [
    {
      id: 1,
      name: "Flooring Materials / ఫ్లోరింగ్ మెటీరియల్స్",
      image: marblebased,
      description: "Tiles, hardwood / టైల్స్, హార్డ్వుడ్",
    },
    {
      id: 2,
      name: "Windows and Doors / విండోస్ మరియు తలుపులు",
      image: door,
      description: "Custom windows, doors / కస్టమ్ విండోస్, తలుపులు",
    },
    {
      id: 3,
      name: "Interior Fixtures / ఇంటీరియర్ ఫిక్స్చర్స్",
      image: interior,
      description: "Light fixtures, ceiling details / లైట్ ఫిక్స్చర్స్, సీలింగ్ వివరాలు",
    },
    {
      id: 4,
      name: "Decorative Materials / డెకరేటివ్ మెటీరియల్స్",
      image: decorative,
      description: "Wallpapers, decorative panels / వాల్పేపర్లు, అలంకార ప్యానెల్స్",
    },
  ],
};

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === 'web';
const fontSizeMultiplier = Platform.OS === 'web' ? 1.2 : 1;

const SuppliersVendors = () => {
  const navigation = useNavigation();
  const [userType, setUserType] = useState("");
  const [agentType, setAgentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("english");

  const toggleLanguage = () => {
    setLanguage(prev => prev === "english" ? "telugu" : "english");
  };

  // Translations
  const translations = {
    title: {
      english: "Suppliers & Vendors",
      telugu: "సరఫరాదారులు మరియు విక్రేతలు"
    },
    subtitle: {
      english: "Find all the services you need for your property",
      telugu: "మీ ఆస్తి కోసం మీకు అవసరమైన అన్ని సేవలను కనుగొనండి"
    },
    addSupplier: {
      english: "Add Supplier",
      telugu: "సరఫరాదారుని జోడించండి"
    },
    loading: {
      english: "Loading...",
      telugu: "లోడ్ అవుతోంది..."
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const type = await AsyncStorage.getItem("userType");
        setUserType(type || "");

        if (type === "WealthAssociate" || type === "ReferralAssociate") {
          const token = await AsyncStorage.getItem("authToken");
          const response = await fetch(`${API_URL}/agent/AgentDetails`, {
            headers: { token: token || "" },
          });
          const data = await response.json();
          setAgentType(data?.AgentType || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const vendorTypes = [
    {
      id: 1,
      name: "Building Materials Suppliers / బిల్డింగ్ మెటీరియల్స్ సరఫరాదారులు",
      icon: "home",
      iconType: "ionicons",
      color: "white",
    },
    {
      id: 2,
      name: "Equipment and Tool Suppliers / పరికరాలు మరియు సాధనాలు సరఫరాదారులు",
      icon: "tools",
      iconType: "material-community",
      color: "white",
    },
    {
      id: 3,
      name: "Plumbing and Electrical Suppliers / ప్లంబింగ్ మరియు ఎలక్ట్రికల్ సరఫరాదారులు",
      icon: "pipe",
      iconType: "material-community",
      color: "white",
    },
    {
      id: 4,
      name: "Paint and Finishing Suppliers / పెయింట్ మరియు ఫినిషింగ్ సరఫరాదారులు",
      icon: "format-paint",
      iconType: "material",
      color: "white",
    },
    {
      id: 5,
      name: "HVAC Suppliers / HVAC సరఫరాదారులు",
      icon: "air-conditioner",
      iconType: "material-community",
      color: "white",
    },
    {
      id: 6,
      name: "Landscaping Suppliers / ల్యాండ్స్కేపింగ్ సరఫరాదారులు",
      icon: "tree",
      iconType: "font-awesome",
      color: "white",
    },
    {
      id: 7,
      name: "Prefabricated Construction Materials / ప్రీఫాబ్రికేటెడ్ కన్స్ట్రక్షన్ మెటీరియల్స్",
      icon: "cube",
      iconType: "font-awesome",
      color: "white",
    },
    {
      id: 8,
      name: "Waste Management and Disposal / వేస్ట్ మేనేజ్మెంట్ మరియు డిస్పోజల్",
      icon: "delete",
      iconType: "material",
      color: "white",
    },
    {
      id: 9,
      name: "Logistics and Transport / లాజిస్టిక్స్ మరియు ట్రాన్స్పోర్ట్",
      icon: "truck",
      iconType: "material-community",
      color: "white",
    },
    {
      id: 10,
      name: "Architectural and Design Suppliers / ఆర్కిటెక్చరల్ మరియు డిజైన్ సరఫరాదారులు",
      icon: "architecture",
      iconType: "material",
      color: "white",
    },
  ];

  const handleSubcategoryPress = (category, subcategory) => {
    navigation.navigate("VendorList", {
      vendorType: category,
      subcategory: subcategory.name,
    });
  };

  const handleAddSupplier = () => {
    navigation.navigate("AddSupplier");
  };

  // const handleBackPress = () => {
  //   navigation.navigate.;
  // };

  const shouldShowAddButton = () => {
    return userType === "CoreMember" || agentType === "RegionalWealthAssociate";
  };

  const renderIcon = (iconType, iconName, size, color) => {
    switch (iconType) {
      case "ionicons":
        return <Ionicons name={iconName} size={size} color={color} />;
      case "material":
        return <MaterialIcons name={iconName} size={size} color={color} />;
      case "material-community":
        return (
          <MaterialCommunityIcons name={iconName} size={size} color={color} />
        );
      case "font-awesome":
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      default:
        return <MaterialIcons name={iconName} size={size} color={color} />;
    }
  };

  const renderSubcategories = (subcategories, categoryName) => {
    const CardComponent = ({ item }) => (
      <TouchableOpacity
        style={styles.subcategoryCard}
        onPress={() => handleSubcategoryPress(categoryName, item)}
        activeOpacity={0.7}
      >
        <Image
          source={typeof item.image === "string" ? { uri: item.image } : item.image}
          style={styles.subcategoryImage}
          resizeMode="cover"
        />
        <View style={styles.subcategoryTextContainer}>
          <Text style={styles.subcategoryName}>
            {language === "telugu" ? 
              item.name.split("/")[1]?.trim() || item.name : 
              item.name.split("/")[0]}
          </Text>
          <Text style={styles.subcategoryDescription} numberOfLines={2}>
            {language === "telugu" ?
              item.description.split("/")[1]?.trim() || item.description :
              item.description.split("/")[0]}
          </Text>
        </View>
      </TouchableOpacity>
    );

    if (isWeb) {
      return (
        <View style={styles.webGridContainer}>
          {subcategories.map((item) => (
            <CardComponent key={item.id} item={item} />
          ))}
        </View>
      );
    } else {
      return (
        <FlatList
          data={subcategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoryList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CardComponent item={item} />}
        />
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D81B60" />
        <Text style={styles.loadingText}>{translations.loading[language]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with language toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{translations.title[language]}</Text>
          
        </View>
        
        {shouldShowAddButton() && (
          <TouchableOpacity onPress={handleAddSupplier}>
            <View style={styles.addButtonBox}>
              <MaterialIcons name="add" size={18} color="#D81B60" />
              <Text style={styles.addButtonText}>
                {translations.addSupplier[language]}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtitle}>{translations.subtitle[language]}</Text>
      <TouchableOpacity onPress={toggleLanguage} style={styles.languageToggle}>
            <Text style={styles.languageText}>
              {language === "english" ? "తెలుగు" : "English"}
            </Text>
          </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {vendorTypes.map((vendor) => (
          <View key={vendor.id} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              {renderIcon(vendor.iconType, vendor.icon, 24 * fontSizeMultiplier, "#3E5C76")}
              <Text style={styles.categoryTitle}>
                {language === "telugu" ? 
                  vendor.name.split("/")[1]?.trim() || vendor.name : 
                  vendor.name.split("/")[0]}
              </Text>
            </View>

            {renderSubcategories(vendorSubcategories[vendor.name] || [], vendor.name)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
    width: Platform.OS === "web" ? "80%" : "100%",
    alignSelf: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16 * fontSizeMultiplier,
    color: "#555",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageToggle: {
    // marginLeft: 15,
    padding: 5,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    width:80,
    bottom:10
  },
  languageText: {
    color: '#D81B60',
    fontSize: 16 * fontSizeMultiplier,
    textAlign:"center"
  },
  title: {
    fontSize: 22 * fontSizeMultiplier,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: 'center',
  },
  addButtonBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D81B60",
    gap: 6,
  },
  addButtonText: {
    color: "#D81B60",
    fontSize: 14 * fontSizeMultiplier,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16 * fontSizeMultiplier,
    color: "#666",
    marginBottom: 20,
    lineHeight: 24,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  categoryContainer: {
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 18 * fontSizeMultiplier,
    fontWeight: "bold",
    color: "#2C3E50",
    marginLeft: 10,
  },
  subcategoryList: {
    paddingLeft: 5,
    paddingTop: 10,
    paddingBottom: 10,
  },
  webGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -8,
  },
  subcategoryCard: {
    width: isWeb ? '30%' : 180,
    minWidth: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    margin: isWeb ? 8 : 0,
    marginRight: isWeb ? 0 : 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subcategoryImage: {
    width: "100%",
    height: 120,
  },
  subcategoryTextContainer: {
    padding: 12,
  },
  subcategoryName: {
    fontSize: 15 * fontSizeMultiplier,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    lineHeight: 22,
  },
  subcategoryDescription: {
    fontSize: 13 * fontSizeMultiplier,
    color: "#666",
    lineHeight: 20,
  },
});

export default SuppliersVendors;