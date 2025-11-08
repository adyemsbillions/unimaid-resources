"use client"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect, useRef } from "react"
import { Video, VideoFullscreenUpdate } from "expo-av"
import * as ScreenOrientation from "expo-screen-orientation"

const { width: screenWidth } = Dimensions.get("window")

// Modern & Accessible Color Palette
const COLORS = {
  primary: "#6366F1",        // Indigo (main brand)
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",
  success: "#10B981",        // Emerald
  warning: "#F59E0B",        // Amber
  danger: "#EF4444",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  shadow: "rgba(0, 0, 0, 0.08)",
}

const Dashboard = () => {
  const router = useRouter()
  const [username, setUsername] = useState("Guest")
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [allVideos, setAllVideos] = useState<any[]>([])
  const [donors, setDonors] = useState<any[]>([])
  const [userSubjects, setUserSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [warningModalVisible, setWarningModalVisible] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentAdsSlide, setCurrentAdsSlide] = useState(0)

  const videoRef = useRef<Video>(null)
  const adsScrollRef = useRef<ScrollView>(null)
  const adsAutoScrollRef = useRef<NodeJS.Timeout | null>(null)

  const ads = [
    {
      id: 1,
      title: "Unlock Premium",
      subtitle: "Access all courses & live classes",
      color: COLORS.primary,
      lightColor: COLORS.primaryLight,
      icon: "star",
    },
    {
      id: 2,
      title: "Score 300+ in JAMB",
      subtitle: "Expert guidance & past questions",
      color: COLORS.success,
      lightColor: "#34D399",
      icon: "trophy",
    },
    {
      id: 3,
      title: "Live Classes Daily",
      subtitle: "Join expert tutors at 6 PM",
      color: COLORS.primaryDark,
      lightColor: "#6366F1",
      icon: "videocam",
    },
  ]

  useEffect(() => {
    setUsername("TestUser")
    setUserSubjects(["Mathematics", "English", "Physics"])

    setQuizzes([
      { id: 1, title: "Math Quiz", num_questions: 20, subject: "Mathematics", icon: "calculator" },
      { id: 2, title: "English Quiz", num_questions: 15, subject: "English", icon: "book" },
      { id: 3, title: "Physics Quiz", num_questions: 25, subject: "Physics", icon: "flash" },
      { id: 4, title: "Chemistry Quiz", num_questions: 18, subject: "Chemistry", icon: "flask" },
      { id: 5, title: "Biology Quiz", num_questions: 22, subject: "Biology", icon: "leaf" },
    ])

    const dummyVideos = [
      {
        id: 1,
        title: "Quadratic Equations",
        subject_name: "Mathematics",
        file_path: "https://example.com/video1.mp4",
        thumbnail_path: "https://images.unsplash.com/photo-1642726197512-617ce0e62262",
        created_at: "2023-01-01",
      },
      {
        id: 2,
        title: "Grammar Basics",
        subject_name: "English",
        file_path: "https://example.com/video2.mp4",
        thumbnail_path: "https://images.unsplash.com/photo-1642726197512-617ce0e62262",
        created_at: "2023-02-01",
      },
      {
        id: 3,
        title: "Newton's Laws",
        subject_name: "Physics",
        file_path: "https://example.com/video3.mp4",
        thumbnail_path: "https://images.unsplash.com/photo-1642726197512-617ce0e62262",
        created_at: "2023-03-01",
      },
    ]
    setAllVideos(dummyVideos)

    setDonors([
      { id: 1, name: "Donor 1", image: "https://example.com/donor1.png" },
      { id: 2, name: "Donor 2", image: "https://example.com/donor2.png" },
      { id: 3, name: "Donor 3", image: "https://example.com/donor3.png" },
    ])

    setWarningModalVisible(true)
    setIsLoading(false)

    adsAutoScrollRef.current = setInterval(() => {
      setCurrentAdsSlide((prev) => {
        const nextSlide = (prev + 1) % ads.length
        const scrollPosition = nextSlide * (screenWidth - 32)
        adsScrollRef.current?.scrollTo({
          x: scrollPosition,
          animated: true,
        })
        return nextSlide
      })
    }, 4000)

    return () => {
      if (adsAutoScrollRef.current) {
        clearInterval(adsAutoScrollRef.current)
      }
    }
  }, [])

  const handleProfile = () => router.push("/profile")
  const handleSearch = () => router.push("/search")
  const handleLibrary = () => router.push("/library")
  const handleViewAllQuizzes = () => router.push("/allquiz")
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

  const handleAdsScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32))
    setCurrentAdsSlide(slide)
    if (adsAutoScrollRef.current) {
      clearInterval(adsAutoScrollRef.current)
    }
    adsAutoScrollRef.current = setInterval(() => {
      setCurrentAdsSlide((prev) => {
        const nextSlide = (prev + 1) % ads.length
        const scrollPosition = nextSlide * (screenWidth - 32)
        adsScrollRef.current?.scrollTo({
          x: scrollPosition,
          animated: true,
        })
        return nextSlide
      })
    }, 4000)
  }

  const QuizCard = ({ quiz }: { quiz: any }) => (
    <TouchableOpacity style={styles.quizCard} onPress={() => handleQuizSelect(quiz.id)} activeOpacity={0.7}>
      <View style={styles.quizCardIconContainer}>
        <Ionicons name="help-circle" size={32} color="#FFFFFF" />
      </View>
      <View style={styles.quizCardInfo}>
        <Text style={styles.quizCardTitle} numberOfLines={2}>
          {quiz.title}
        </Text>
        <Text style={styles.quizCardQuestions}>{quiz.num_questions} Questions</Text>
        <Text style={styles.quizCardSubject}>{quiz.subject}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  )

  const CategorySection = () => {
    const categories = [
      { id: 1, name: "JAMB", icon: "book-outline", color: COLORS.primary, description: "Exam Prep" },
      { id: 2, name: "WAEC", icon: "school-outline", color: COLORS.success, description: "General Exams" },
      { id: 3, name: "Safety", icon: "shield-outline", color: COLORS.warning, description: "Guidelines" },
      { id: 4, name: "Courses", icon: "grid-outline", color: COLORS.primaryLight, description: "Full Curriculum" },
    ]

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>Categories</Text>
          <TouchableOpacity onPress={handleLibrary}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon as any} size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryDescription}>{cat.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  const AdsCarousel = () => (
    <View style={styles.section}>
      <ScrollView
        ref={adsScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleAdsScroll}
        style={styles.adsScroll}
      >
        {ads.map((ad) => (
          <View key={ad.id} style={[styles.adCard, { width: screenWidth - 32 }]}>
            <View style={[styles.adCardGradient, { backgroundColor: ad.color }]}>
              <Ionicons name={ad.icon as any} size={80} color="rgba(255,255,255,0.1)" style={styles.adCardIcon} />
              <View style={styles.adCardContent}>
                <Text style={styles.adCardTitle}>{ad.title}</Text>
                <Text style={styles.adCardSubtitle}>{ad.subtitle}</Text>
                <TouchableOpacity style={styles.adCardButton}>
                  <Text style={styles.adCardButtonText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.adsDots}>
        {ads.map((_, index) => (
          <View key={index} style={[styles.adsDot, currentAdsSlide === index && styles.adsDotsActive]} />
        ))}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleSearch} style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <Text style={styles.searchPlaceholder}>Search lessons, quizzes...</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeGreeting}>Welcome back!</Text>
                <Text style={styles.welcomeName}>{username}</Text>
                <Text style={styles.welcomeSubtext}>Continue your learning journey</Text>
              </View>
              <View style={styles.welcomeIllustration}>
                <Ionicons name="book" size={64} color="#FFFFFF" />
              </View>
            </View>

            <AdsCarousel />

            <CategorySection />

            {quizzes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Practice Quizzes</Text>
                  <TouchableOpacity onPress={handleViewAllQuizzes}>
                    <Text style={styles.viewAllLink}>View All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.quizzesContainer}>
                  {quizzes.slice(0, 4).map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={36} color={COLORS.success} />
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={36} color={COLORS.primary} />
                  <Text style={styles.statNumber}>45h</Text>
                  <Text style={styles.statLabel}>Learning</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flame" size={36} color={COLORS.warning} />
                  <Text style={styles.statNumber}>7</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/dashboard")}>
          <Ionicons name="home" size={24} color={COLORS.primary} />
          <Text style={[styles.navText, { color: COLORS.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleSearch}>
          <Ionicons name="search" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleLibrary}>
          <Ionicons name="play-circle" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Videos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <Ionicons name="person" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* VIDEO MODAL */}
      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={closeVideo}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalHeader, isFullscreen && styles.modalHeaderFullscreen]}>
            <TouchableOpacity onPress={closeVideo}>
              <Ionicons name="close" size={28} color={isFullscreen ? "#FFFFFF" : COLORS.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isFullscreen && styles.modalTitleFullscreen]} numberOfLines={1}>
              {selectedVideo?.title || "Untitled Video"}
            </Text>
            <TouchableOpacity onPress={toggleFullscreen}>
              <Ionicons
                name={isFullscreen ? "contract" : "expand"}
                size={24}
                color={isFullscreen ? "#FFFFFF" : COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {videoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
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
              Alert.alert("Error", `Failed to load video: ${e}`)
            }}
            onFullscreenUpdate={onFullscreenUpdate}
            shouldPlay={false}
          />
        </SafeAreaView>
      </Modal>

      {/* WARNING MODAL */}
      <Modal animationType="fade" transparent={true} visible={warningModalVisible} onRequestClose={dismissWarningModal}>
        <View style={styles.warningModalContainer}>
          <View style={styles.warningModalContent}>
            <Ionicons name="warning" size={48} color={COLORS.primary} style={styles.warningIcon} />
            <Text style={styles.warningModalTitle}>Account Security</Text>
            <Text style={styles.warningModalText}>
              Your account will be <Text style={styles.warningModalBold}>permanently banned</Text> if you share your
              login credentials. Keep your account secure!
            </Text>
            <TouchableOpacity style={styles.warningModalButton} onPress={dismissWarningModal}>
              <Text style={styles.warningModalButtonText}>I Understand</Text>
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
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  notificationIcon: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 12,
  },
  welcomeSection: {
    backgroundColor: COLORS.primary,
    margin: 16,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  welcomeIllustration: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  viewAllLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },
  adsScroll: {
    marginHorizontal: -16,
  },
  adCard: {
    paddingHorizontal: 16,
  },
  adCardGradient: {
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  adCardIcon: {
    position: "absolute",
    right: -30,
    top: -30,
    opacity: 0.12,
  },
  adCardContent: {
    zIndex: 1,
  },
  adCardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  adCardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "500",
    marginBottom: 16,
  },
  adCardButton: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  adCardButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  adsDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  adsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  adsDotsActive: {
    backgroundColor: COLORS.primary,
    width: 28,
  },
  quizzesContainer: {
    gap: 12,
  },
  quizCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quizCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quizCardInfo: {
    flex: 1,
  },
  quizCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  quizCardQuestions: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  quizCardSubject: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  categorySection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 6,
  },
  bottomPadding: {
    height: 24,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 2,
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10 || 34,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  modalHeaderFullscreen: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderBottomColor: "transparent",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
    marginHorizontal: 12,
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    width: "85%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  warningIcon: {
    marginBottom: 16,
  },
  warningModalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  warningModalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  warningModalBold: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  warningModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  warningModalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
})

export default Dashboard