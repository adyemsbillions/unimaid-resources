"use client";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

const BASE_URL = "https://uresources.cravii.ng/";
const UPLOADS_PATH = `${BASE_URL}api/uploads/`;

const Library = () => {
  const router = useRouter();
  const [donors, setDonors] = useState([]);
  const [handouts, setHandouts] = useState([]);
  const [selectedHandout, setSelectedHandout] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Generate random amounts for loans
  const generateRandomAmount = () => Math.floor(Math.random() * (70000 - 3500 + 1)) + 3500;

  const loans = [
    { id: 1, title: "Student Loan", amount: generateRandomAmount(), term: "12 months" },
    { id: 2, title: "Education Support Loan", amount: generateRandomAmount(), term: "24 months" },
  ];

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          console.log("No user logged in, navigating to /login");
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        Alert.alert("Error", "Failed to check login status");
      }
    };
    checkLoginStatus();

    const fetchData = async () => {
      try {
        // Fetch donors
        const donorsResponse = await fetch(`${BASE_URL}api/get_donors.php`);
        const donorsText = await donorsResponse.text();
        console.log("Donors API Response:", donorsText);
        let donorsData;
        try {
          donorsData = JSON.parse(donorsText);
        } catch (e) {
          console.error("Donors JSON Parse Error:", e);
          throw new Error("Invalid donors response from server");
        }
        if (donorsData.success) {
          const processedDonors = donorsData.donors.map((donor) => ({
            ...donor,
            image: donor.image.startsWith("http") ? donor.image : `${UPLOADS_PATH}${donor.image}`,
          }));
          setDonors(processedDonors);
        } else {
          Alert.alert("Error", donorsData.error || "Failed to fetch donors");
        }

        // Fetch handouts
        const handoutsResponse = await fetch(`${BASE_URL}api/get_handouts.php`);
        const handoutsText = await handoutsResponse.text();
        console.log("Handouts API Response:", handoutsText);
        let handoutsData;
        try {
          handoutsData = JSON.parse(handoutsText);
        } catch (jsonError) {
          console.error("Handouts JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from handouts API");
        }
        if (handoutsResponse.ok && Array.isArray(handoutsData)) {
          setHandouts(handoutsData);
        } else {
          Alert.alert("Error", "Failed to fetch handouts");
          setHandouts([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", `Network error occurred: ${error.message}`);
      }
    };
    fetchData();
  }, [router]);

  const handleBack = () => {
    router.push("/dashboard");
    console.log("Back pressed, navigating to /dashboard");
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userId");
      console.log("User logged out, navigating to /");
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out");
    }
  };

  const handleDonate = () => {
    router.push("/donate");
    console.log("Donate pressed, navigating to /donate");
  };

  const openPDF = (handout) => {
    setSelectedHandout(handout);
    setModalVisible(true);
  };

  const handleLoanPress = (loan) => {
    const currentDate = new Date("2025-09-22T14:34:00Z"); // Hardcoded per context
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + 5);
    const formattedDate = futureDate.toLocaleDateString();
    if (loan.title === "Student Loan") {
      Alert.alert("Student Loan", `Loan coming soon on ${formattedDate}`);
    } else if (loan.title === "Education Support Loan") {
      Alert.alert("Education Support Loan", "Can only be applied for in first semester");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support Us</Text>
            <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
              <Text style={styles.donateButtonText}>Donate Now</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.donorScroll}
            snapToInterval={150 + 20}
            decelerationRate="fast"
          >
            {donors.length > 0 ? (
              donors.map((donor) => (
                <View key={donor.id} style={styles.donorCard}>
                  <Image
                    source={{ uri: donor.image }}
                    style={styles.donorAvatar}
                    onError={(error) => {
                      console.error(`Image load failed for ${donor.image}:`, error.nativeEvent.error);
                    }}
                  />
                  <Text style={styles.donorName}>{donor.name}</Text>
                  <Text style={styles.donorAmount}>₦{donor.amount.toLocaleString()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No donors yet.</Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handouts</Text>
          <View style={styles.itemContainer}>
            {handouts.length > 0 ? (
              handouts.map((handout) => (
                <TouchableOpacity key={handout.id} style={styles.itemCard} onPress={() => openPDF(handout)}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{handout.title}</Text>
                    <Text style={styles.cardSubtitle}>Uploaded on {new Date(handout.created_at).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No handouts available.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Take a Loan</Text>
          <View style={styles.itemContainer}>
            {loans.length > 0 ? (
              loans.map((loan) => (
                <TouchableOpacity key={loan.id} style={styles.itemCard} onPress={() => handleLoanPress(loan)}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="cash" size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{loan.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      ₦{loan.amount.toLocaleString()} - {loan.term}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No loan options available.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedHandout?.title}</Text>
          </View>
          <WebView
            source={{ uri: `${BASE_URL}api/${selectedHandout?.file_path}` }}
            style={styles.pdfView}
            onError={() => Alert.alert("Error", "Failed to load PDF")}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  iconButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  donateButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  donateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  donorScroll: {
    marginTop: 10,
  },
  donorCard: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    alignItems: "center",
    marginRight: 10,
  },
  donorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  donorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  donorAmount: {
    fontSize: 12,
    color: "#6B46C1",
  },
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 15,
  },
  pdfView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
  },
});

export default Library;