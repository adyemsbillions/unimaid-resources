"use client";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://uresources.cravii.ng/";
const UPLOADS_PATH = `${BASE_URL}api/uploads/`;

const ViewAllDonors = () => {
  const router = useRouter();
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const response = await fetch(`${BASE_URL}api/get_donors.php`);
        const text = await response.text();
        console.log("Donors API Response:", text);
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error("JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from donors API");
        }

        if (response.ok && data.success && Array.isArray(data.donors)) {
          const processedDonors = data.donors.map((donor) => ({
            ...donor,
            image: donor.image.startsWith("http") ? donor.image : `${UPLOADS_PATH}${donor.image}`,
          }));
          setDonors(processedDonors);
        } else {
          Alert.alert("Error", data.error || "Failed to fetch donors");
          setDonors([]);
        }
      } catch (error) {
        console.error("Error fetching donors:", error);
        Alert.alert("Error", `Network error occurred: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDonors();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>All Donors</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading donors...</Text>
          </View>
        ) : donors.length > 0 ? (
          donors.map((donor) => (
            <View key={donor.id} style={styles.donorCard}>
              <Image
                source={{ uri: donor.image }}
                style={styles.donorAvatar}
                onError={(error) => console.error(`Image load failed for ${donor.image}:`, error.nativeEvent.error)}
              />
              <View style={styles.donorContent}>
                <Text style={styles.donorName}>{donor.name}</Text>
                <Text style={styles.donorWriteUp}>
                  {donor.name} made a donation of ₦{donor.amount.toLocaleString()} to support this platform
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDonorsText}>No donors available</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  scrollView: {
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
  donorCard: {
    backgroundColor: "#f8f8f8",
    margin: 20,
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  donorContent: {
    flex: 1,
  },
  donorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  donorWriteUp: {
    fontSize: 14,
    color: "#6B46C1",
    lineHeight: 20,
  },
  noDonorsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
});

export default ViewAllDonors;