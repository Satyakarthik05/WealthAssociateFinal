import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";
import logo1 from "../../assets/man.png";

const ExpertDetails = ({ expertType, onSwitch }) => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [Details, setDetails] = useState({});
  const [PostedBy, setPostedBy] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [expertToEdit, setExpertToEdit] = useState(null);
  const [editedExpert, setEditedExpert] = useState({});

  useEffect(() => {
    if (!expertType) return;

    fetch(`${API_URL}/expert/getexpert/${expertType}`)
      .then((response) => response.json())
      .then((data) => {
        setExperts(data.experts || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch experts. Please try again later.");
        setLoading(false);
      });
  }, [expertType]);

  const getDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/agent/AgentDetails`, {
        method: "GET",
        headers: {
          token: `${token}` || "",
        },
      });

      const newDetails = await response.json();
      setPostedBy(newDetails.MobileNumber);
      setDetails(newDetails);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };

  const editExpert = (expert) => {
    setExpertToEdit(expert);
    setEditedExpert({ ...expert });
    setEditModalVisible(true);
  };

  const handleEditChange = (field, value) => {
    setEditedExpert((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitEdit = async () => {
    try {
      const response = await fetch(
        `${API_URL}/expert/update/${expertToEdit._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedExpert),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setExperts((prev) =>
          prev.map((exp) => (exp._id === expertToEdit._id ? editedExpert : exp))
        );
        setEditModalVisible(false);
        Alert.alert("Success", "Expert details updated successfully");
      } else {
        Alert.alert("Update failed", result.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update expert details");
    }
  };

  const renderField = (label, value) => {
    if (!value) return null;
    return (
      <Text style={styles.expertDetails}>
        <Text style={styles.label}>{label}: </Text>
        {value}
      </Text>
    );
  };

  const renderExpertSpecificFields = (expert) => {
    switch (expertType) {
      case "LEGAL":
        return (
          <>
            {renderField("Specialization", expert.specialization)}
            {renderField("Bar Council ID", expert.barCouncilId)}
            {renderField("Court Affiliation", expert.courtAffiliation)}
            {renderField("Law Firm/Organisation", expert.lawFirmOrganisation)}
          </>
        );
      case "REVENUE":
        return (
          <>
            {renderField("Land Type Expertise", expert.landTypeExpertise)}
            {renderField(
              "Revenue Specialisation",
              expert.revenueSpecialisation
            )}
            {renderField("Government Approval", expert.govtApproval)}
            {renderField(
              "Certification License Number",
              expert.certificationLicenseNumber
            )}
            {renderField("Revenue Organisation", expert.revenueOrganisation)}
            {renderField("Key Services Provided", expert.keyServicesProvided)}
          </>
        );
      case "ENGINEERS":
        return (
          <>
            {renderField("Engineering Field", expert.engineeringField)}
            {renderField("Certifications", expert.certifications)}
            {renderField("Projects Handled", expert.projectsHandled)}
            {renderField("Engineer Organisation", expert.engineerOrganisation)}
            {renderField(
              "Specialized Skills/Technologies",
              expert.specializedSkillsTechnologies
            )}
            {renderField(
              "Major Projects Worked On",
              expert.majorProjectsWorkedOn
            )}
            {renderField("Government Licensed", expert.govtLicensed)}
          </>
        );
      case "ARCHITECTS":
        return (
          <>
            {renderField("Architecture Type", expert.architectureType)}
            {renderField("Software Used", expert.softwareUsed)}
            {renderField(
              "Architect License Number",
              expert.architectLicenseNumber
            )}
            {renderField("Architect Firm", expert.architectFirm)}
            {renderField("Major Projects", expert.architectMajorProjects)}
          </>
        );
      case "PLANS & APPROVALS":
        return (
          <>
            {renderField("Approval Type", expert.approvalType)}
            {renderField("Government Department", expert.govtDepartment)}
            {renderField("Processing Time", expert.processingTime)}
            {renderField("Approval Organisation", expert.approvalOrganisation)}
            {renderField("Services Provided", expert.servicesProvided)}
          </>
        );
      case "VAASTU PANDITS":
        return (
          <>
            {renderField("Vaastu Specialization", expert.vaastuSpecialization)}
            {renderField("Vaastu Organisation", expert.vaastuOrganisation)}
            {renderField("Vaastu Certifications", expert.vaastuCertifications)}
            {renderField("Remedies Provided", expert.remediesProvided)}
            {renderField("Consultation Mode", expert.consultationMode)}
          </>
        );
      case "LAND SURVEY & VALUERS":
        return (
          <>
            {renderField("Survey Type", expert.surveyType)}
            {renderField("Valuation Type", expert.valuationType)}
            {renderField("Government Approved", expert.govtApproved)}
            {renderField("Survey License Number", expert.surveyLicenseNumber)}
            {renderField("Valuer License Number", expert.valuerLicenseNumber)}
            {renderField("Survey Organisation", expert.surveyOrganisation)}
            {renderField("Valuer Organisation", expert.valuerOrganisation)}
          </>
        );
      case "BANKING":
        return (
          <>
            {renderField(
              "Banking Specialisation",
              expert.bankingSpecialisation
            )}
            {renderField("Banking Service", expert.bankingService)}
            {renderField("Registered With", expert.registeredWith)}
            {renderField("Bank Name", expert.bankName)}
            {renderField("Government Approved", expert.bankingGovtApproved)}
          </>
        );
      case "AGRICULTURE":
        return (
          <>
            {renderField("Agriculture Type", expert.agricultureType)}
            {renderField(
              "Agriculture Certifications",
              expert.agricultureCertifications
            )}
            {renderField(
              "Agriculture Organisation",
              expert.agricultureOrganisation
            )}
            {renderField("Services Provided", expert.servicesProvided)}
            {renderField("Types of Crops", expert.typesOfCrops)}
          </>
        );
      case "REGISTRATION & DOCUMENTATION":
        return (
          <>
            {renderField(
              "Registration Specialisation",
              expert.registrationSpecialisation
            )}
            {renderField("Document Type", expert.documentType)}
            {renderField("Processing Time", expert.processingTime)}
            {renderField(
              "Government Certified",
              expert.registrationGovtCertified
            )}
            {renderField("Additional Services", expert.additionalServices)}
          </>
        );
      case "AUDITING":
        return (
          <>
            {renderField(
              "Auditing Specialisation",
              expert.auditingSpecialisation
            )}
            {renderField("Audit Type", expert.auditType)}
            {renderField(
              "Audit Certification Number",
              expert.auditCertificationNumber
            )}
            {renderField("Audit Organisation", expert.auditOrganisation)}
            {renderField("Audit Services", expert.auditServices)}
            {renderField("Government Certified", expert.auditGovtCertified)}
          </>
        );
      case "LIAISONING":
        return (
          <>
            {renderField(
              "Liaisoning Specialisations",
              expert.liaisoningSpecialisations
            )}
            {renderField("Government Departments", expert.govtDepartments)}
            {renderField(
              "Liaisoning Organisation",
              expert.liaisoningOrganisation
            )}
            {renderField("Services Provided", expert.servicesProvided)}
            {renderField("Processing Time", expert.processingTime)}
          </>
        );
      default:
        return null;
    }
  };

  const renderEditExpertSpecificFields = () => {
    switch (expertType) {
      case "LEGAL":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Specialization"
              value={editedExpert.specialization || ""}
              onChangeText={(value) =>
                handleEditChange("specialization", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Bar Council ID"
              value={editedExpert.barCouncilId || ""}
              onChangeText={(value) => handleEditChange("barCouncilId", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Court Affiliation"
              value={editedExpert.courtAffiliation || ""}
              onChangeText={(value) =>
                handleEditChange("courtAffiliation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Law Firm/Organisation"
              value={editedExpert.lawFirmOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("lawFirmOrganisation", value)
              }
            />
          </>
        );
      case "REVENUE":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Land Type Expertise"
              value={editedExpert.landTypeExpertise || ""}
              onChangeText={(value) =>
                handleEditChange("landTypeExpertise", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Revenue Specialisation"
              value={editedExpert.revenueSpecialisation || ""}
              onChangeText={(value) =>
                handleEditChange("revenueSpecialisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Government Approval"
              value={editedExpert.govtApproval || ""}
              onChangeText={(value) => handleEditChange("govtApproval", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Certification License Number"
              value={editedExpert.certificationLicenseNumber || ""}
              onChangeText={(value) =>
                handleEditChange("certificationLicenseNumber", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Revenue Organisation"
              value={editedExpert.revenueOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("revenueOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Key Services Provided"
              value={editedExpert.keyServicesProvided || ""}
              onChangeText={(value) =>
                handleEditChange("keyServicesProvided", value)
              }
            />
          </>
        );
      case "ENGINEERS":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Engineering Field"
              value={editedExpert.engineeringField || ""}
              onChangeText={(value) =>
                handleEditChange("engineeringField", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Certifications"
              value={editedExpert.certifications || ""}
              onChangeText={(value) =>
                handleEditChange("certifications", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Projects Handled"
              value={editedExpert.projectsHandled || ""}
              onChangeText={(value) =>
                handleEditChange("projectsHandled", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Engineer Organisation"
              value={editedExpert.engineerOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("engineerOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Specialized Skills/Technologies"
              value={editedExpert.specializedSkillsTechnologies || ""}
              onChangeText={(value) =>
                handleEditChange("specializedSkillsTechnologies", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Major Projects Worked On"
              value={editedExpert.majorProjectsWorkedOn || ""}
              onChangeText={(value) =>
                handleEditChange("majorProjectsWorkedOn", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Government Licensed"
              value={editedExpert.govtLicensed || ""}
              onChangeText={(value) => handleEditChange("govtLicensed", value)}
            />
          </>
        );
      case "ARCHITECTS":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Architecture Type"
              value={editedExpert.architectureType || ""}
              onChangeText={(value) =>
                handleEditChange("architectureType", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Software Used"
              value={editedExpert.softwareUsed || ""}
              onChangeText={(value) => handleEditChange("softwareUsed", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Architect License Number"
              value={editedExpert.architectLicenseNumber || ""}
              onChangeText={(value) =>
                handleEditChange("architectLicenseNumber", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Architect Firm"
              value={editedExpert.architectFirm || ""}
              onChangeText={(value) => handleEditChange("architectFirm", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Major Projects"
              value={editedExpert.architectMajorProjects || ""}
              onChangeText={(value) =>
                handleEditChange("architectMajorProjects", value)
              }
            />
          </>
        );
      case "PLANS & APPROVALS":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Approval Type"
              value={editedExpert.approvalType || ""}
              onChangeText={(value) => handleEditChange("approvalType", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Government Department"
              value={editedExpert.govtDepartment || ""}
              onChangeText={(value) =>
                handleEditChange("govtDepartment", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Processing Time"
              value={editedExpert.processingTime || ""}
              onChangeText={(value) =>
                handleEditChange("processingTime", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Approval Organisation"
              value={editedExpert.approvalOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("approvalOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Services Provided"
              value={editedExpert.servicesProvided || ""}
              onChangeText={(value) =>
                handleEditChange("servicesProvided", value)
              }
            />
          </>
        );
      case "VAASTU PANDITS":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Vaastu Specialization"
              value={editedExpert.vaastuSpecialization || ""}
              onChangeText={(value) =>
                handleEditChange("vaastuSpecialization", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Vaastu Organisation"
              value={editedExpert.vaastuOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("vaastuOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Vaastu Certifications"
              value={editedExpert.vaastuCertifications || ""}
              onChangeText={(value) =>
                handleEditChange("vaastuCertifications", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Remedies Provided"
              value={editedExpert.remediesProvided || ""}
              onChangeText={(value) =>
                handleEditChange("remediesProvided", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Consultation Mode"
              value={editedExpert.consultationMode || ""}
              onChangeText={(value) =>
                handleEditChange("consultationMode", value)
              }
            />
          </>
        );
      case "LAND SURVEY & VALUERS":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Survey Type"
              value={editedExpert.surveyType || ""}
              onChangeText={(value) => handleEditChange("surveyType", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Valuation Type"
              value={editedExpert.valuationType || ""}
              onChangeText={(value) => handleEditChange("valuationType", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Government Approved"
              value={editedExpert.govtApproved || ""}
              onChangeText={(value) => handleEditChange("govtApproved", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Survey License Number"
              value={editedExpert.surveyLicenseNumber || ""}
              onChangeText={(value) =>
                handleEditChange("surveyLicenseNumber", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Valuer License Number"
              value={editedExpert.valuerLicenseNumber || ""}
              onChangeText={(value) =>
                handleEditChange("valuerLicenseNumber", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Survey Organisation"
              value={editedExpert.surveyOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("surveyOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Valuer Organisation"
              value={editedExpert.valuerOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("valuerOrganisation", value)
              }
            />
          </>
        );
      case "BANKING":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Banking Specialisation"
              value={editedExpert.bankingSpecialisation || ""}
              onChangeText={(value) =>
                handleEditChange("bankingSpecialisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Banking Service"
              value={editedExpert.bankingService || ""}
              onChangeText={(value) =>
                handleEditChange("bankingService", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Registered With"
              value={editedExpert.registeredWith || ""}
              onChangeText={(value) =>
                handleEditChange("registeredWith", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Bank Name"
              value={editedExpert.bankName || ""}
              onChangeText={(value) => handleEditChange("bankName", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Government Approved"
              value={editedExpert.bankingGovtApproved || ""}
              onChangeText={(value) =>
                handleEditChange("bankingGovtApproved", value)
              }
            />
          </>
        );
      case "AGRICULTURE":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Agriculture Type"
              value={editedExpert.agricultureType || ""}
              onChangeText={(value) =>
                handleEditChange("agricultureType", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Agriculture Certifications"
              value={editedExpert.agricultureCertifications || ""}
              onChangeText={(value) =>
                handleEditChange("agricultureCertifications", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Agriculture Organisation"
              value={editedExpert.agricultureOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("agricultureOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Services Provided"
              value={editedExpert.servicesProvided || ""}
              onChangeText={(value) =>
                handleEditChange("servicesProvided", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Types of Crops"
              value={editedExpert.typesOfCrops || ""}
              onChangeText={(value) => handleEditChange("typesOfCrops", value)}
            />
          </>
        );
      case "REGISTRATION & DOCUMENTATION":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Registration Specialisation"
              value={editedExpert.registrationSpecialisation || ""}
              onChangeText={(value) =>
                handleEditChange("registrationSpecialisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Document Type"
              value={editedExpert.documentType || ""}
              onChangeText={(value) => handleEditChange("documentType", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Processing Time"
              value={editedExpert.processingTime || ""}
              onChangeText={(value) =>
                handleEditChange("processingTime", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Government Certified"
              value={editedExpert.registrationGovtCertified || ""}
              onChangeText={(value) =>
                handleEditChange("registrationGovtCertified", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Additional Services"
              value={editedExpert.additionalServices || ""}
              onChangeText={(value) =>
                handleEditChange("additionalServices", value)
              }
            />
          </>
        );
      case "AUDITING":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Auditing Specialisation"
              value={editedExpert.auditingSpecialisation || ""}
              onChangeText={(value) =>
                handleEditChange("auditingSpecialisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Audit Type"
              value={editedExpert.auditType || ""}
              onChangeText={(value) => handleEditChange("auditType", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Audit Certification Number"
              value={editedExpert.auditCertificationNumber || ""}
              onChangeText={(value) =>
                handleEditChange("auditCertificationNumber", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Audit Organisation"
              value={editedExpert.auditOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("auditOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Audit Services"
              value={editedExpert.auditServices || ""}
              onChangeText={(value) => handleEditChange("auditServices", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Government Certified"
              value={editedExpert.auditGovtCertified || ""}
              onChangeText={(value) =>
                handleEditChange("auditGovtCertified", value)
              }
            />
          </>
        );
      case "LIAISONING":
        return (
          <>
            <TextInput
              style={styles.input}
              placeholder="Liaisoning Specialisations"
              value={editedExpert.liaisoningSpecialisations || ""}
              onChangeText={(value) =>
                handleEditChange("liaisoningSpecialisations", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Government Departments"
              value={editedExpert.govtDepartments || ""}
              onChangeText={(value) =>
                handleEditChange("govtDepartments", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Liaisoning Organisation"
              value={editedExpert.liaisoningOrganisation || ""}
              onChangeText={(value) =>
                handleEditChange("liaisoningOrganisation", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Services Provided"
              value={editedExpert.servicesProvided || ""}
              onChangeText={(value) =>
                handleEditChange("servicesProvided", value)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Processing Time"
              value={editedExpert.processingTime || ""}
              onChangeText={(value) =>
                handleEditChange("processingTime", value)
              }
            />
          </>
        );
      default:
        return null;
    }
  };

  const deleteExpert = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this expert?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/expert/delete/${id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
              });

              if (response.ok) {
                setExperts((prevExperts) =>
                  prevExperts.filter((exp) => exp._id !== id)
                );
                Alert.alert("Success", "Expert deleted successfully");
              } else {
                const errorData = await response.json();
                Alert.alert("Delete Failed", errorData.message);
              }
            } catch (error) {
              Alert.alert("Error", "Could not delete expert");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onSwitch(null)}>
        <Text style={styles.backButton}>{"< Back"}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>{expertType} Experts</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : experts.length > 0 ? (
        <ScrollView contentContainerStyle={styles.cardContainer}>
          {experts.map((expert) => (
            <View key={expert._id} style={styles.expertCard}>
              <Image
                source={
                  expert.photo ? { uri: `${API_URL}${expert.photo}` } : logo1
                }
                style={styles.profileImage}
              />

              <Text style={styles.expertName}>{expert.name}</Text>

              <View style={styles.detailsContainer}>
                {renderField("Type", expert.expertType)}
                {renderField("Qualification", expert.qualification)}
                {renderField("Experience", expert.experience)}
                {renderField("Location", expert.location)}
                {renderField("Mobile", expert.mobile)}
                {renderField("Office Address", expert.officeAddress)}
                {renderField("Call Executive Call", expert.CallExecutiveCall)}
              </View>

              <View style={styles.specializationContainer}>
                {renderExpertSpecificFields(expert)}
              </View>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editExpert(expert)}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteExpert(expert._id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noExperts}>
          No experts found for this category.
        </Text>
      )}

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Edit Expert Details</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editedExpert.name || ""}
                onChangeText={(value) => handleEditChange("name", value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Qualification"
                value={editedExpert.qualification || ""}
                onChangeText={(value) =>
                  handleEditChange("qualification", value)
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Experience"
                value={editedExpert.experience || ""}
                onChangeText={(value) => handleEditChange("experience", value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Location"
                value={editedExpert.location || ""}
                onChangeText={(value) => handleEditChange("location", value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Mobile"
                value={editedExpert.mobile || ""}
                onChangeText={(value) => handleEditChange("mobile", value)}
                keyboardType="phone-pad"
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Office Address"
                value={editedExpert.officeAddress || ""}
                onChangeText={(value) =>
                  handleEditChange("officeAddress", value)
                }
                multiline
                numberOfLines={3}
              />

              {/* Render expert-specific fields for editing */}
              {renderEditExpertSpecificFields()}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={submitEdit}
                >
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 10,
    fontWeight: "500",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  cardContainer: {
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap", // allows wrapping to next line if needed
    justifyContent: "space-between", // spacing between cards
    paddingHorizontal: 8,
  },
  expertCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8, // spacing between cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "48%", // slightly less than 50% to accommodate margin
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 12,
  },
  expertName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  detailsContainer: {
    marginBottom: 12,
  },
  expertDetails: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    lineHeight: 20,
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  specializationContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 12,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  editButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  noExperts: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 40,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    padding: 14,
    borderRadius: 6,
    width: "48%",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
});

export default ExpertDetails;
