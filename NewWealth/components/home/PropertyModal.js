import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LazyImage from "./LazyImage";

const PropertyModal = ({ visible, onClose, referredInfo }) => {
  if (!referredInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LazyImage
            source={require("../../../assets/man.png")}
            style={styles.agentLogo}
          />
          <Text style={styles.modalTitle}>Referred By</Text>
          <Text style={styles.modalText}>Name: {referredInfo.name}</Text>
          <Text style={styles.modalText}>
            Mobile: {referredInfo.mobileNumber}
          </Text>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${referredInfo.mobileNumber}`)}
          >
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.callButtonText}>Call Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width:
      Platform.OS === "web"
        ? windowWidth < 450
          ? "90%"
          : "30%"
        : "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  agentLogo: {
    width: Platform.OS === "web" && windowWidth < 450 ? 60 : 80,
    height: Platform.OS === "web" && windowWidth < 450 ? 60 : 80,
    borderRadius: Platform.OS === "web" && windowWidth < 450 ? 30 : 40,
    alignSelf: "center",
    marginBottom: Platform.OS === "web" && windowWidth < 450 ? 10 : 15,
  },
  modalTitle: {
    fontSize: Platform.OS === "web" && windowWidth < 450 ? 18 : 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Platform.OS === "web" && windowWidth < 450 ? 8 : 10,
  },
  modalText: {
    fontSize: Platform.OS === "web" && windowWidth < 450 ? 14 : 16,
    marginVertical: Platform.OS === "web" && windowWidth < 450 ? 3 : 4,
    textAlign: "center",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    padding: Platform.OS === "web" && windowWidth < 450 ? 8 : 10,
    borderRadius: 8,
    marginTop: Platform.OS === "web" && windowWidth < 450 ? 12 : 15,
  },
  callButtonText: {
    color: "white",
    fontSize: Platform.OS === "web" && windowWidth < 450 ? 14 : 16,
    marginLeft: 8,
  },
  closeButton: {
    marginTop: Platform.OS === "web" && windowWidth < 450 ? 8 : 10,
    padding: Platform.OS === "web" && windowWidth < 450 ? 8 : 10,
    borderRadius: 8,
    backgroundColor: "#dc3545",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: Platform.OS === "web" && windowWidth < 450 ? 14 : 16,
  },
});

export default PropertyModal;