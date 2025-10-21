
"use client";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar, Alert, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";

const BASE_URL = "https://uresources.cravii.ng/";
const UPLOADS_PATH = `${BASE_URL}api/`;

const Dashboard = () => {
  const router = useRouter();
  const [username, setUsername] = useState("Guest");
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          console.log("No user logged in, navigating to /login");
          router.replace("/login");
          return;
        }

        // Check warning modal display status
        const lastWarningTime = await AsyncStorage.getItem("lastWarningTime");
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000;
        if (!lastWarningTime || now - parseInt(lastWarningTime) > oneDayInMs) {
          setWarningModalVisible(true);
          await AsyncStorage.setItem("lastWarningTime", now.toString());
        }

        // Fetch user data
        const userResponse = await fetch(`${BASE_URL}api/get_user.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const userText = await userResponse.text();
        console.log("User API Response:", userText);
        let userData;
        try {
          userData = JSON.parse(userText);
        } catch (jsonError) {
          console.error("User JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from user API");
        }

        if (userResponse.ok && userData.success) {
          setUsername(userData.username || "Guest");
        } else {
          Alert.alert("Error", userData.error || "Failed to fetch user data");
          router.replace("/login");
          return;
        }

        // Fetch quizzes
        const quizResponse = await fetch(`${BASE_URL}api/get_quizzes.php`);
        const quizText = await quizResponse.text();
        console.log("Quiz API Response:", quizText);
        let quizData;
        try {
          quizData = JSON.parse(quizText);
        } catch (jsonError) {
          console.error("Quiz JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from quiz API");
        }

        if (quizResponse.ok && Array.isArray(quizData)) {
          setQuizzes(quizData.slice(0, 5));
        } else {
          Alert.alert("Error", "Failed to fetch quizzes");
          setQuizzes([]);
        }

        // Fetch videos
        const videosResponse = await fetch(`${BASE_URL}api/get_videos.php`);
        const videosText = await videosResponse.text();
        console.log("Videos API Response:", videosText, "Status:", videosResponse.status);
        let videosData;
        try {
          videosData = JSON.parse(videosText);
        } catch (jsonError) {
          console.error("Videos JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from videos API");
        }

        if (videosResponse.ok && Array.isArray(videosData)) {
          setVideos(videosData);
        } else {
          Alert.alert("Error", "Failed to fetch videos");
          setVideos([]);
        }

        // Fetch donors
        const donorsResponse = await fetch(`${BASE_URL}api/get_donors.php`);
        const donorsText = await donorsResponse.text();
        console.log("Donors API Response:", donorsText);
        let donorsData;
        try {
          donorsData = JSON.parse(donorsText);
        } catch (jsonError) {
          console.error("Donors JSON Parse error:", jsonError);
          throw new Error("Invalid JSON response from donors API");
        }

        if (donorsResponse.ok && donorsData.success && Array.isArray(donorsData.donors)) {
          const processedDonors = donorsData.donors.map((donor) => ({
            ...donor,
            image: donor.image.startsWith("http") ? donor.image : `${UPLOADS_PATH}${donor.image}`,
          }));
          setDonors(processedDonors.slice(0, 4));
        } else {
          Alert.alert("Error", donorsData.error || "Failed to fetch donors");
          setDonors([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", `Network error occurred: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleProfile = () => {
    router.push("/profile");
    console.log("Profile pressed, navigating to /profile");
  };

  const handleSearch = () => {
    router.push("/search");
    console.log("Search pressed, navigating to /search");
  };

  const handleLibrary = () => {
    router.push("/library");
    console.log("Library pressed, navigating to /library");
  };

  const handleViewAllQuizzes = () => {
    router.push("/allquiz");
    console.log("View all quizzes pressed, navigating to /allquiz");
  };

  const handleViewAllVideos = () => {
    router.push("/qa-viewall");
    console.log("View all videos pressed, navigating to /qa-viewall");
  };

  const handleViewAllDonors = () => {
    router.push("/view-alldonors");
    console.log("View all donors pressed, navigating to /view-alldonors");
  };

  const openVideo = (video) => {
    setSelectedVideo(video);
    setVideoLoading(true);
    setModalVisible(true);
  };

  const dismissWarningModal = async () => {
    setWarningModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="search-outline" size={28} color="#4B40C3" />
          <Text style={styles.logo}>Unimaid Resources</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={28} color="#4B40C3" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            <View style={styles.playQuizSection}>
              <View style={styles.playQuizContent}>
                <Text style={styles.playQuizTitle}>Your account will be Banned if logged on another device</Text>
                <Text style={styles.educationalTip}>
                  Study Tip: Use spaced repetition to improve long-term memory retention.
                </Text>
                <TouchableOpacity style={styles.findFriendsButton}>
                  <Text style={styles.findFriendsText}>Hello, {username}!</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.playButton}>
                <Image
                  source={{
                    uri: videos.length > 0 && videos[0].thumbnail_path
                      ? videos[0].thumbnail_path
                      : 'https://i.pravatar.cc/100'
                  }}
                  style={styles.logoImage}
                  defaultSource={require('../assets/fallback-thumbnail.png')}
                  onError={(error) => console.error("Thumbnail load failed:", error.nativeEvent.error)}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Video Lessons</Text>
                <TouchableOpacity onPress={handleViewAllVideos}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosScroll}>
                {videos.length > 0 ? (
                  videos.map((video) => (
                    <TouchableOpacity key={video.id} style={styles.discoverCard} onPress={() => openVideo(video)}>
                      {video.thumbnail_path ? (
                        <Image
                          source={{ uri: video.thumbnail_path }}
                          style={styles.cardThumbnail}
                          onError={(error) => console.error(`Thumbnail load failed for ${video.thumbnail_path}:`, error.nativeEvent.error)}
                        />
                      ) : (
                        <View style={styles.cardIcon}>
                          <Ionicons name="videocam" size={24} color="#fff" />
                        </View>
                      )}
                      <Text style={styles.cardTitle}>{video.title}</Text>
                      <Text style={styles.cardAuthor}>
                        {video.subject_name} - {video.topic_name}
                      </Text>
                      <Text style={styles.cardAuthor}>
                        Uploaded on {new Date(video.created_at).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noVideosText}>No videos available</Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Our Donors</Text>
                <TouchableOpacity onPress={handleViewAllDonors}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.donorsContainer}>
                {donors.length > 0 ? (
                  donors.map((donor) => (
                    <TouchableOpacity key={donor.id} style={styles.donorItem}>
                      <Image
                        source={{ uri: donor.image }}
                        style={styles.donorAvatar}
                        onError={(error) => console.error(`Image load failed for ${donor.image}:`, error.nativeEvent.error)}
                      />
                      <Text style={styles.donorName}>{donor.name}</Text>
                      <Text style={styles.donorWriteUp}>
                        {donor.name} donated ₦{donor.amount.toLocaleString()} to support learning
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noDonorsText}>No donors available</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quizzes</Text>
                <TouchableOpacity onPress={handleViewAllQuizzes}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quizCards}>
                {quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <TouchableOpacity key={quiz.id} style={styles.quizCard}>
                      <View style={styles.quizCardHeader}>
                        <Ionicons name="book" size={24} color="#4B40C3" />
                        <Text style={styles.quizCardTitle}>{quiz.title}</Text>
                      </View>
                      <View style={styles.quizCardContent}>
                        <Text style={styles.quizCardQuestions}>{quiz.num_questions} Questions</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noQuizzesText}>No quizzes available</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboard")}>
          <Ionicons name="home" size={28} color="#4B40C3" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleSearch}>
          <Ionicons name="search-outline" size={28} color="#6B7280" />
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleLibrary}>
          <Ionicons name="bookmark-outline" size={28} color="#6B7280" />
          <Text style={styles.navText}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <Ionicons name="person-outline" size={28} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setVideoLoading(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setVideoLoading(false);
              }}
            >
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedVideo?.title}</Text>
          </View>
          {videoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#4B40C3" />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}
          <Video
            source={{ uri: selectedVideo?.file_path }}
            style={[styles.videoView, videoLoading && { display: 'none' }]}
            useNativeControls
            resizeMode="contain"
            posterSource={{ uri: selectedVideo?.thumbnail_path || 'https://i.pravatar.cc/100' }}
            onError={(error) => {
              setVideoLoading(false);
              Alert.alert("Error", `Failed to load video: ${error}`);
            }}
            onLoadStart={() => setVideoLoading(true)}
            onLoad={() => setVideoLoading(false)}
            shouldPlay={false}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={warningModalVisible}
        onRequestClose={dismissWarningModal}
      >
        <View style={styles.warningModalContainer}>
          <View style={styles.warningModalContent}>
            <Ionicons name="warning-outline" size={48} color="#DC2626" style={styles.warningIcon} />
            <Text style={styles.warningModalTitle}>Important Warning, {username}!</Text>
            <Text style={styles.warningModalText}>
              Your account will be <Text style={styles.warningModalBold}>permanently banned</Text> if you share your login
              credentials and your account is accessed from another device. Keep your account secure by not sharing your
              username or password.
            </Text>
            <TouchableOpacity style={styles.warningModalButton} onPress={dismissWarningModal}>
              <Text style={styles.warningModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 12,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
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
    fontSize: 18,
    color: "#4B5563",
    fontWeight: "500",
  },
  playQuizSection: {
    backgroundColor: "#4B40C3",
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  playQuizContent: {
    flex: 1,
    marginRight: 16,
  },
  playQuizTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  educationalTip: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 16,
    lineHeight: 22,
  },
  findFriendsButton: {
    backgroundColor: "#6D5FFD",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  findFriendsText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  playButton: {
    backgroundColor: "#FFFFFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  viewAllText: {
    fontSize: 15,
    color: "#4B40C3",
    fontWeight: "600",
  },
  videosScroll: {
    flexDirection: "row",
  },
  discoverCard: {
    borderRadius: 12,
    padding: 16,
    minHeight: 180,
    minWidth: 160,
    marginRight: 12,
    backgroundColor: "#6D5FFD",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardThumbnail: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  quizCard: {
    width: "47%",
    marginBottom: 16,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4B40C3",
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  quizCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quizCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 8,
    flex: 1,
  },
  quizCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quizCardQuestions: {
    fontSize: 12,
    color: "#4B40C3",
    fontWeight: "600",
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    flex: 1,
  },
  cardAuthor: {
    fontSize: 12,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  donorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  donorItem: {
    alignItems: "center",
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  donorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  donorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  donorWriteUp: {
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 18,
  },
  quizCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  noQuizzesText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 20,
  },
  noVideosText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 20,
  },
  noDonorsText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 20,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 12,
    flex: 1,
  },
  videoView: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  warningModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  warningModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  warningIcon: {
    marginBottom: 16,
  },
  warningModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  warningModalText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  warningModalBold: {
    fontWeight: "700",
    color: "#DC2626",
  },
  warningModalButton: {
    backgroundColor: "#4B40C3",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  warningModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Dashboard;