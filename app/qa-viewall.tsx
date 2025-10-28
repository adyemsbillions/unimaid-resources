"use client";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, StatusBar, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

const BASE_URL = "https://ilearn.lsfort.ng/";

const QAViewAll = () => {
  const router = useRouter();
  const [handouts, setHandouts] = useState([]);
  const [filteredHandouts, setFilteredHandouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandout, setSelectedHandout] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHandouts = async () => {
      try {
        const response = await fetch(`${BASE_URL}api/get_handouts.php`);
        const text = await response.text();
        console.log("Handouts API Response:", text);
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error("JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from handouts API");
        }

        if (response.ok && Array.isArray(data)) {
          setHandouts(data);
          setFilteredHandouts(data); // Initialize filteredHandouts with all handouts
        } else {
          Alert.alert("Error", "Failed to fetch handouts");
          setHandouts([]);
          setFilteredHandouts([]);
        }
      } catch (error) {
        console.error("Error fetching handouts:", error);
        Alert.alert("Error", `Network error occurred: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHandouts();
  }, []);

  useEffect(() => {
    // Filter handouts based on search query
    const filtered = handouts.filter((handout) =>
      handout.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHandouts(filtered);
  }, [searchQuery, handouts]);

  const openPDF = (handout) => {
    setSelectedHandout(handout);
    setModalVisible(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>All Possible Q/A</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#4B5563" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search handouts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#4B5563" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading handouts...</Text>
          </View>
        ) : filteredHandouts.length > 0 ? (
          filteredHandouts.map((handout) => (
            <TouchableOpacity key={handout.id} style={styles.handoutCard} onPress={() => openPDF(handout)}>
              <View style={styles.handoutCardHeader}>
                <Ionicons name="document-text" size={24} color="#4B40C3" />
                <Text style={styles.handoutTitle}>{handout.title}</Text>
              </View>
              <View style={styles.handoutCardContent}>
                <Text style={styles.handoutDate}>Uploaded on {new Date(handout.created_at).toLocaleDateString()}</Text>
                <Text style={styles.viewButtonText}>View PDF</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noHandoutsText}>
            {searchQuery ? "No handouts found for your search" : "No handouts available"}
          </Text>
        )}
      </ScrollView>

      {/* PDF Modal */}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  clearButton: {
    padding: 4,
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
  handoutCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#4B40C3",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  handoutCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  handoutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 8,
    flex: 1,
  },
  handoutCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  handoutDate: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  viewButtonText: {
    fontSize: 12,
    color: "#4B40C3",
    fontWeight: "600",
  },
  noHandoutsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
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
});

export default QAViewAll;