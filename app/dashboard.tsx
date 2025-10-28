"use client"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Video, VideoFullscreenUpdate } from "expo-av"
import * as ScreenOrientation from "expo-screen-orientation"

const BASE_URL = "https://ilearn.lsfort.ng/"
const UPLOADS_PATH = `${BASE_URL}api/`

const Dashboard = () => {
  const router = useRouter()
  const [username, setUsername] = useState("Guest")
  const [quizzes, setQuizzes] = useState([])
  const [videos, setVideos] = useState([])
  const [donors, setDonors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [warningModalVisible, setWarningModalVisible] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<Video>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId")
        if (!userId) {
          router.replace("/login")
          return
        }

        const lastWarningTime = await AsyncStorage.getItem("lastWarningTime")
        const now = Date.now()
        const oneDayInMs = 24 * 60 * 60 * 1000
        if (!lastWarningTime || now - Number.parseInt(lastWarningTime) > oneDayInMs) {
          setWarningModalVisible(true)
          await AsyncStorage.setItem("lastWarningTime", now.toString())
        }

        const userResponse = await fetch(`${BASE_URL}api/get_user.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
        const userText = await userResponse.text()
        let userData
        try { userData = JSON.parse(userText) } catch { throw new Error("Invalid JSON response from user API") }

        if (userResponse.ok && userData.success) {
          setUsername(userData.username || "Guest")
        } else {
          Alert.alert("Error", userData.error || "Failed to fetch user data")
          router.replace("/login")
          return
        }

        const quizResponse = await fetch(`${BASE_URL}api/get_quizzes.php`)
        const quizText = await quizResponse.text()
        let quizData
        try { quizData = JSON.parse(quizText) } catch { throw new Error("Invalid JSON response from quiz API") }

        if (quizResponse.ok && Array.isArray(quizData)) {
          setQuizzes(quizData.slice(0, 5))
        } else {
          Alert.alert("Error", "Failed to fetch quizzes")
          setQuizzes([])
        }

        const videosResponse = await fetch(`${BASE_URL}api/get_videos.php`)
        const videosText = await videosResponse.text()
        let videosData
        try { videosData = JSON.parse(videosText) } catch { throw new Error("Invalid JSON response from videos API") }

        if (videosResponse.ok && Array.isArray(videosData)) {
          setVideos(videosData)
        } else {
          Alert.alert("Error", "Failed to fetch videos")
          setVideos([])
        }

        const donorsResponse = await fetch(`${BASE_URL}api/get_donors.php`)
        const donorsText = await donorsResponse.text()
        let donorsData
        try { donorsData = JSON.parse(donorsText) } catch { throw new Error("Invalid JSON response from donors API") }

        if (donorsResponse.ok && donorsData.success && Array.isArray(donorsData.donors)) {
          const processedDonors = donorsData.donors.map((donor: any) => ({
            ...donor,
            image: donor.image && donor.image.startsWith("http") ? donor.image : `${UPLOADS_PATH}${donor.image || 'default-donor.png'}`,
          }))
          setDonors(processedDonors.slice(0, 4))
        } else {
          Alert.alert("Error", donorsData.error || "Failed to fetch donors")
          setDonors([])
        }
      } catch (error: any) {
        Alert.alert("Error", `Network error: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleProfile = () => router.push("/profile")
  const handleSearch = () => router.push("/search")
  const handleLibrary = () => router.push("/library")
  const handleViewAllQuizzes = () => router.push("/allquiz")
  const handleViewAllVideos = () => router.push("/all_videos")
  const handleViewAllDonors = () => router.push("/view-alldonors")
  const handleQuizSelect = (id: any) => router.push(`/takequiz/${id}`)

  const openVideo = (video: any) => {
    setSelectedVideo(video)
    setVideoLoading(true)
    setModalVisible(true)
  }

  const closeVideo = () => {
    setModalVisible(false)
    setVideoLoading(false)
    setIsFullscreen(false)
    ScreenOrientation.unlockAsync()
  }

  const toggleFullscreen = async () => {
    if (!videoRef.current) return
    if (isFullscreen) {
      await videoRef.current.dismissFullscreenPlayer()
    } else {
      await videoRef.current.presentFullscreenPlayer()
    }
  }

  const onFullscreenUpdate = async ({ fullscreenUpdate }: { fullscreenUpdate: VideoFullscreenUpdate }) => {
    if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT) {
      setIsFullscreen(true)
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    } else if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
      setIsFullscreen(false)
      await ScreenOrientation.unlockAsync()
    }
  }

  const dismissWarningModal = () => setWarningModalVisible(false)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="search-outline" size={28} color="#4B40C3" />
          <Text style={styles.logo}>ilearn Dashboard</Text>
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
            <Ionicons name="hourglass-outline" size={48} color="#4B40C3" style={styles.loadingIcon} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            <View style={styles.playQuizSection}>
              <View style={styles.playQuizContent}>
                <View style={styles.warningBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                  <Text style={styles.warningBadgeText}>Security Alert</Text>
                </View>
                <Text style={styles.playQuizTitle}>Your account will be Banned if logged on another device</Text>
                <Text style={styles.educationalTip}>
                  Study Tip: Use spaced repetition to improve long-term memory retention.
                </Text>
                <TouchableOpacity style={styles.findFriendsButton}>
                  <Text style={styles.findFriendsText}>Hello, {username}!</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="play-circle" size={24} color="#4B40C3" />
                  <Text style={styles.sectionTitle}>Video Lessons</Text>
                </View>
                <TouchableOpacity onPress={handleViewAllVideos}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosScroll}>
                {videos.length > 0 ? (
                  videos.map((video: any) => (
                    <TouchableOpacity key={video.id} style={styles.discoverCard} onPress={() => openVideo(video)}>
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{
                            uri:
                              video.thumbnail_path ||
                              "https://images.unsplash.com/photo-1642726197512-617ce0e62262?ixlib=rb-4.1.0&auto=format&fit=crop&w=600",
                          }}
                          style={styles.cardThumbnail}
                        />
                        <View style={styles.playIconOverlay}>
                          <Ionicons name="play" size={28} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {video.title || "Untitled Video"}
                        </Text>
                        <Text style={styles.cardAuthor} numberOfLines={1}>
                          {video.subject_name || "Unknown Subject"}
                        </Text>
                        <Text style={styles.cardDate}>
                          {new Date(video.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="videocam-off" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyStateText}>No videos available</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="book" size={24} color="#4B40C3" />
                  <Text style={styles.sectionTitle}>Quizzes</Text>
                </View>
                <TouchableOpacity onPress={handleViewAllQuizzes}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quizCards}>
                {quizzes.length > 0 ? (
                  quizzes.map((quiz: any) => (
                    <TouchableOpacity
                      key={quiz.id}
                      style={styles.quizCard}
                      onPress={() => handleQuizSelect(quiz.id)}
                    >
                      <View style={styles.quizCardHeader}>
                        <View style={styles.quizIconContainer}>
                          <Ionicons name="book" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.quizCardTitle} numberOfLines={2}>
                          {quiz.title || "Untitled Quiz"}
                        </Text>
                      </View>
                      <View style={styles.quizCardDivider} />
                      <View style={styles.quizCardContent}>
                        <View style={styles.quizMetric}>
                          <Ionicons name="help-circle" size={16} color="#4B40C3" />
                          <Text style={styles.quizCardQuestions}>{quiz.num_questions || 0} Questions</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#4B40C3" />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="help-circle-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyStateText}>No quizzes available</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.bottomPadding} />
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
          <Text style={styles.navText}>Videos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <Ionicons name="person-outline" size={28} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={closeVideo}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalHeader, isFullscreen && styles.modalHeaderFullscreen]}>
            <TouchableOpacity onPress={closeVideo}>
              <Ionicons name="close" size={28} color={isFullscreen ? "#FFFFFF" : "#1F2937"} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isFullscreen && styles.modalTitleFullscreen]}>
              {selectedVideo?.title || "Untitled Video"}
            </Text>
            <TouchableOpacity onPress={toggleFullscreen}>
              <Ionicons
                name={isFullscreen ? "contract" : "expand"}
                size={24}
                color={isFullscreen ? "#FFFFFF" : "#4B40C3"}
              />
            </TouchableOpacity>
          </View>

          {videoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#4B40C3" />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}

          <Video
            ref={videoRef}
            source={{ uri: selectedVideo?.file_path }}
            style={styles.videoView}
            useNativeControls
            resizeMode="contain"
            posterSource={{
              uri:
                selectedVideo?.thumbnail_path ||
                "https://images.unsplash.com/photo-1642726197512-617ce0e62262?ixlib=rb-4.1.0&auto=format&fit=crop&w=600",
            }}
            onLoadStart={() => setVideoLoading(true)}
            onReadyForDisplay={() => setVideoLoading(false)}
            onError={(e) => {
              setVideoLoading(false)
              Alert.alert("Error", `Failed to load video: ${e.error?.localizedDescription ?? "Unknown error"}`)
            }}
            onFullscreenUpdate={onFullscreenUpdate}
            shouldPlay={false}
          />
        </SafeAreaView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={warningModalVisible} onRequestClose={dismissWarningModal}>
        <View style={styles.warningModalContainer}>
          <View style={styles.warningModalContent}>
            <Ionicons name="warning-outline" size={48} color="#DC2626" style={styles.warningIcon} />
            <Text style={styles.warningModalTitle}>Important Warning, {username}!</Text>
            <Text style={styles.warningModalText}>
              Your account will be <Text style={styles.warningModalBold}>permanently banned</Text> if you share your
              login credentials and your account is accessed from another device. Keep your account secure by not
              sharing your username or password.
            </Text>
            <TouchableOpacity style={styles.warningModalButton} onPress={dismissWarningModal}>
              <Text style={styles.warningModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: StatusBar.currentHeight + 10 || 34,
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
    marginRight: 8,
    flexWrap: "wrap",
  },
  logo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    marginLeft: 10,
    letterSpacing: 0.3,
    maxWidth: 180,
    lineHeight: 20,
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
    paddingVertical: 60,
  },
  loadingIcon: {
    marginBottom: 16,
    color: "#4B40C3",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  playQuizSection: {
    backgroundColor: "#4B40C3",
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  playQuizContent: {
    flex: 1,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  warningBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  playQuizTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 28,
  },
  educationalTip: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 18,
    lineHeight: 22,
    fontWeight: "500",
  },
  findFriendsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  findFriendsText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  viewAllText: {
    fontSize: 14,
    color: "#4B40C3",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  videosScroll: {
    flexDirection: "row",
  },
  discoverCard: {
    borderRadius: 16,
    minHeight: 220,
    minWidth: 160,
    marginRight: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  cardImageContainer: {
    position: "relative",
    width: "100%",
    height: 100,
    backgroundColor: "#E5E7EB",
  },
  cardThumbnail: {
    width: "100%",
    height: "100%",
  },
  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
    lineHeight: 18,
  },
  cardAuthor: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  quizCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  quizCard: {
    width: "48%",
    marginBottom: 16,
    marginHorizontal: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4B40C3",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quizCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  quizIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#4B40C3",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  quizCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    lineHeight: 18,
  },
  quizCardDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },
  quizCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quizMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quizCardQuestions: {
    fontSize: 12,
    color: "#4B40C3",
    fontWeight: "700",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 20,
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
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10 || 34,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    zIndex: 10,
  },
  modalHeaderFullscreen: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomColor: "transparent",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 12,
    flex: 1,
  },
  modalTitleFullscreen: {
    color: "#FFFFFF",
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 5,
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "500",
  },
  warningModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  warningModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
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
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  warningModalText: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: "500",
  },
  warningModalBold: {
    fontWeight: "800",
    color: "#DC2626",
  },
  warningModalButton: {
    backgroundColor: "#4B40C3",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  warningModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
})

export default Dashboard