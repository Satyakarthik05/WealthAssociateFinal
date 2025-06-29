import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const data = [
  {
    id: "1",
    title: "LEGAL",
    icon: "https://img.icons8.com/ios/100/scales.png",
  },
  {
    id: "2",
    title: "REVENUE",
    icon: "https://img.icons8.com/ios/100/rupee.png",
  },
  {
    id: "3",
    title: "ENGINEERS",
    icon: "https://img.icons8.com/ios/100/engineer.png",
  },
  {
    id: "4",
    title: "INTERIOR & ARCHITECTS",
    icon: "https://img.icons8.com/ios/100/blueprint.png",
  },
  {
    id: "5",
    title: "SURVEY & PLANNING",
    icon: "https://img.icons8.com/ios/100/survey.png",
  },
  {
    id: "6",
    title: "VAASTU PANDITS",
    icon: "https://img.icons8.com/ios/100/guru.png",
  },
  {
    id: "7",
    title: "LAND VALUERS",
    icon: "https://img.icons8.com/ios/100/marker.png",
  },
  {
    id: "8",
    title: "BANKING",
    icon: "https://img.icons8.com/ios/100/bank.png",
  },
  {
    id: "9",
    title: "AGRICULTURE",
    icon: "https://img.icons8.com/ios/100/farm.png",
  },
  {
    id: "10",
    title: "REGISTRATION &\nDOCUMENTATION",
    icon: "https://img.icons8.com/ios/100/contract.png",
  },
  {
    id: "11",
    title: "AUDITING",
    icon: "https://img.icons8.com/ios/100/paint-brush.png",
  },
  {
    id: "12",
    title: "LIAISONING",
    icon: "https://img.icons8.com/ios/100/handshake.png",
  },
];

const ExpertPanel = ({ onSwitch, userType }) => {
  const [isCoreMember, setIsCoreMember] = useState(false);
  const { width, height } = useWindowDimensions();
  const isMobileView = Platform.OS !== "web" || width < 450;
  const navigation = useNavigation();

  const numColumns = Platform.OS === "web" ? 3 : 2;
  const spacing = 16;
  const itemSize = (width - spacing * (numColumns + 1)) / numColumns;

  const containerStyle = useMemo(
    () => ({
      ...styles.mainContainer,
      paddingHorizontal: spacing,
      width: isMobileView ? "100%" : "80%",
      alignSelf: "center",
      minHeight: height,
    }),
    [width, height]
  );

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem("userType");
        setIsCoreMember(storedUserType === "CoreMember");
      } catch (error) {
        console.error("Error reading userType from AsyncStorage:", error);
      }
    };
    checkUserType();
  }, []);

  const handleRequestExpert = () => {
    try {
      navigation.navigate("requestexpert");
    } catch (error) {
      Alert.alert(
        "Navigation Error",
        `Failed to open request screen: ${error.message}`
      );
    }
  };

  const handleAddExpert = () => {
    try {
      navigation.navigate("addexpert");
    } catch (error) {
      Alert.alert(
        "Navigation Error",
        `Failed to open add expert screen: ${error.message}`
      );
    }
  };
  return (
    <View style={styles.rootContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={containerStyle}>
          <Text style={styles.header}>Expert Panel</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.requestButton]}
              onPress={handleRequestExpert}
            >
              <Text style={styles.buttonText}>Request Expert</Text>
            </TouchableOpacity>

            {isCoreMember && (
              <TouchableOpacity
                style={[styles.button, styles.addExpertButton]}
                onPress={handleAddExpert}
              >
                <Text style={styles.buttonText}>Add Expert</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.gridContainer}>
            {data.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.item,
                  {
                    flexBasis: isMobileView ? "50%" : "33.33%",
                  },
                ]}
                onPress={() => onSwitch(item.title)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Image source={{ uri: item.icon }} style={styles.icon} />
                </View>
                <Text style={styles.text}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#D8E3E7",
  },
  mainContainer: {
    flexGrow: 1,
    paddingTop: 30,
    paddingBottom: 90,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 15,
    fontFamily: "OpenSanssemibold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  requestButton: {
    backgroundColor: "#FDFDFD",
  },
  addExpertButton: {
    backgroundColor: "#FDFDFD",
  },
  buttonText: {
    color: "#3E5C76",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "OpenSanssemibold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3E5C76",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    marginBottom: 5,
  },
  icon: {
    width: 35,
    height: 35,
    resizeMode: "contain",
    tintColor: "#FDFDFD",
  },
  text: {
    fontSize: 16,
    fontWeight: "normal",
    textAlign: "center",
    fontFamily: "OpenSanssemibold",
    color: "#333",
  },
});

export default ExpertPanel;
