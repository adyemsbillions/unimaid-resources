"use client"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect, useRef, useCallback } from "react"
import { Video, VideoFullscreenUpdate } from "expo-av"
import * as ScreenOrientation from "expo-screen-orientation"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width: screenWidth } = Dimensions.get("window")

const COLORS = {
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
}

const BASE_URL = "https://ilearn.lsfort.ng/"

interface CategoryAPI {
  id: number
  name: string
  slug?: string
  description?: string | null
  image_url?: string | null
  color: string
}

interface CategoryUI {
  id: number
  name: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  description: string
  image_url?: string
}

interface Stats {
  quizzes_taken: number
  avg_score: number
  streak_days: number
}

interface UserData {
  success: boolean
  username?: string
  subjects?: string[]
  error?: string
}

const Dashboard = () => {
  const router = useRouter()
  const [username, setUsername] = useState("Guest")
  const [subjects, setSubjects] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryUI[]>([])
  const [stats, setStats] = useState<Stats>({
    quizzes_taken: 0,
    avg_score: 0,
    streak_days: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [warningModalVisible, setWarningModalVisible] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentAdsSlide, setCurrentAdsSlide] = useState(0)

  const videoRef = useRef<Video>(null)
  const adsScrollRef = useRef<ScrollView>(null)

  const ads = [
    { id: 1, title: "Unlock Premium", subtitle: "Access all courses & live classes", color: COLORS.primary, icon: "star" },
    { id: 2, title: "Score 300+ in JAMB", subtitle: "Expert guidance & past questions", color: COLORS.success, icon: "trophy" },
    { id: 3, title: "Live Classes Daily", subtitle: "Join expert tutors at 6 PM", color: COLORS.primaryDark, icon: "videocam" },
  ]

  // ---------- FETCH USER ----------
  const fetchUser = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) {
        router.replace("/login")
        return
      }

      const res = await fetch(`${BASE_URL}api/get_user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId) }),
      })
      const json = await res.json()
      if (json.success) {
        setUsername(json.username || "User")
      } else {
        Alert.alert("Error", json.error || "Failed to load user")
        router.replace("/login")
      }
    } catch (e) {
      console.error("Failed to fetch user:", e)
      Alert.alert("Error", "Check internet or login again")
    }
  }, [router])

  // ---------- FETCH USER DATA (for subjects) ----------
  const fetchUserData = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) return

      const res = await fetch(`${BASE_URL}api/get_user_data.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId) }),
      })
      const text = await res.text()
      let json: UserData
      try {
        json = JSON.parse(text)
      } catch {
        console.error("Invalid JSON from get_user_data.php")
        return
      }

      if (json.success && Array.isArray(json.subjects)) {
        setSubjects(json.subjects)
      }
    } catch (e) {
      console.error("Failed to fetch user data:", e)
    }
  }, [])

  // ---------- FETCH USER STATS ----------
  const fetchUserStats = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) return

      const res = await fetch(`${BASE_URL}api/get_user_stats.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId) }),
      })
      const json = await res.json()

      if (json.success && json.stats) {
        setStats({
          quizzes_taken: json.stats.quizzes_taken || 0,
          avg_score: Math.round(json.stats.avg_score || 0),
          streak_days: json.stats.streak_days || 0,
        })
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e)
    }
  }, [])

  // ---------- FETCH CATEGORIES ----------
  const fetchCategories = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch(`${BASE_URL}api/fetch_category.php`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        const mapped: CategoryUI[] = json.data.map((c: CategoryAPI) => ({
          id: c.id,
          name: c.name || `Category ${c.id}`,
          icon: getIcon(c.name || ""),
          color: c.color || COLORS.primary,
          description: c.description || "Explore lessons",
          image_url: c.image_url || undefined,
        }))
        setCategories(mapped)
      }
    } catch (e) {
      console.error(e)
      Alert.alert("Network Error", "Check internet")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
    fetchUserData()
    fetchCategories()
    fetchUserStats()
  }, [fetchUser, fetchUserData, fetchCategories, fetchUserStats])

  // ---------- ICON FALLBACK ----------
  const getIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
      JAMB: "book-outline",
      WAEC: "school-outline",
      Safety: "shield-outline",
      Courses: "grid-outline",
      Mathematics: "calculator",
      English: "book",
      Physics: "flash",
      Chemistry: "flask",
      Biology: "leaf",
    }
    return map[name] || "folder-outline"
  }

  // ---------- NAV ----------
  const handleProfile = () => router.push("/profile")
  const handleSearch = () => router.push("/search")
  const handleLibrary = () => router.push("/library")
  const handleViewAllQuizzes = () => router.push("/allquiz")

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
    isFullscreen
      ? await videoRef.current.dismissFullscreenPlayer()
      : await videoRef.current.presentFullscreenPlayer()
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

  // ---------- ADS: Manual Scroll Only ----------
  const handleAdsScroll = (e: any) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32))
    setCurrentAdsSlide(slide)
  }

  // ---------- CATEGORIES GRID (4 RANDOM) ----------
  const CategorySection = () => {
    if (isLoading && !refreshing) return null
    if (categories.length === 0) {
      return (
        <View style={styles.categorySection}>
          <Text style={styles.emptyText}>No categories yet</Text>
        </View>
      )
    }

    const randomCategories = [...categories]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>Categories</Text>
          <TouchableOpacity onPress={() => router.push("/categories")}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {randomCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/subjects?category_id=${cat.id}`)}
            >
              <Image
                source={{ uri: cat.image_url || "https://via.placeholder.com/150" }}
                style={styles.categoryImageBackground}
                resizeMode="cover"
              />

              <View style={styles.categoryOverlay}>
                <LinearGradient
                  colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)", "transparent"]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryDescription}>{cat.description}</Text>
                </View>
              </View>

              {!cat.image_url && (
                <View style={[styles.categoryIconFallback, { backgroundColor: cat.color }]}>
                  <Ionicons name={cat.icon} size={28} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  // ---------- ADS CAROUSEL ----------
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
        {ads.map((_, i) => (
          <View key={i} style={[styles.adsDot, currentAdsSlide === i && styles.adsDotsActive]} />
        ))}
      </View>
    </View>
  )

  // ---------- SUPPORT CARD (NEW) ----------
  const SupportCard = () => (
    <View style={styles.section}>
      <View style={styles.supportCard}>
        <LinearGradient
          colors={["#991B1B", "#7F1D1D"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.supportContent}>
          <Text style={styles.supportText}>
            Are you or someone you know facing mental health struggles, child abuse, or sexual abuse? You can get help — speak up, support is here for you.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Get Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  // ---------- YOUR SUBJECTS SECTION ----------
  const YourSubjectsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Subjects</Text>
        <TouchableOpacity onPress={handleViewAllQuizzes}>
          <Text style={styles.viewAllLink}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.subjectsContainer}>
        {subjects.length > 0 ? (
          subjects.map((subject, index) => (
            <View key={index} style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>{subject}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No subjects selected</Text>
        )}
      </View>
    </View>
  )

  // ---------- MAIN RETURN ----------
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchCategories(true)
              fetchUserData()
              fetchUserStats()
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {isLoading && !refreshing ? (
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
                <Ionicons name="book" size={64} color="#FFF" />
              </View>
            </View>

            <AdsCarousel />

            <CategorySection />

            {/* SUPPORT CARD */}
            <SupportCard />

            {/* YOUR SUBJECTS */}
            <YourSubjectsSection />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={36} color={COLORS.success} />
                  <Text style={styles.statNumber}>{stats.quizzes_taken}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="school" size={36} color={COLORS.primary} />
                  <Text style={styles.statNumber}>{stats.avg_score}%</Text>
                  <Text style={styles.statLabel}>Avg Score</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flame" size={36} color={COLORS.warning} />
                  <Text style={styles.statNumber}>{stats.streak_days}</Text>
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
              <Ionicons name="close" size={28} color={isFullscreen ? "#FFF" : COLORS.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isFullscreen && styles.modalTitleFullscreen]} numberOfLines={1}>
              {selectedVideo?.title || "Video"}
            </Text>
            <TouchableOpacity onPress={toggleFullscreen}>
              <Ionicons name={isFullscreen ? "contract" : "expand"} size={24} color={isFullscreen ? "#FFF" : COLORS.primary} />
            </TouchableOpacity>
          </View>

          {videoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}

          {selectedVideo && (
            <Video
              ref={videoRef}
              source={{ uri: selectedVideo.file_path }}
              style={styles.videoView}
              useNativeControls
              resizeMode="contain"
              posterSource={{ uri: selectedVideo.thumbnail_path }}
              onLoadStart={() => setVideoLoading(true)}
              onReadyForDisplay={() => setVideoLoading(false)}
              onError={() => {
                setVideoLoading(false)
                Alert.alert("Error", "Cannot play video")
              }}
              onFullscreenUpdate={onFullscreenUpdate}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* WARNING MODAL */}
      <Modal animationType="fade" transparent visible={warningModalVisible} onRequestClose={dismissWarningModal}>
        <View style={styles.warningModalContainer}>
          <View style={styles.warningModalContent}>
            <Ionicons name="warning" size={48} color={COLORS.primary} style={styles.warningIcon} />
            <Text style={styles.warningModalTitle}>Account Security</Text>
            <Text style={styles.warningModalText}>
              Your account will be <Text style={styles.warningModalBold}>permanently banned</Text> if you share your login credentials.
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  searchPlaceholder: { fontSize: 14, color: COLORS.textMuted, fontWeight: "500" },
  notificationIcon: { position: "relative", padding: 8 },
  notificationBadge: { position: "absolute", top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger, borderWidth: 2, borderColor: COLORS.surface },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  loadingText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: "600", marginTop: 12 },
  welcomeSection: { backgroundColor: COLORS.primary, margin: 16, marginBottom: 24, borderRadius: 24, padding: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  welcomeContent: { flex: 1 },
  welcomeGreeting: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "600", marginBottom: 4 },
  welcomeName: { fontSize: 28, fontWeight: "900", color: "#FFF", marginBottom: 6, letterSpacing: -0.6 },
  welcomeSubtext: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  welcomeIllustration: { width: 76, height: 76, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  section: { paddingHorizontal: 16, marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, letterSpacing: -0.4 },
  viewAllLink: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
  adsScroll: { marginHorizontal: -16 },
  adCard: { paddingHorizontal: 16 },
  adCardGradient: { borderRadius: 20, padding: 24, overflow: "hidden" },
  adCardIcon: { position: "absolute", right: -30, top: -30, opacity: 0.12 },
  adCardContent: { zIndex: 1 },
  adCardTitle: { fontSize: 24, fontWeight: "900", color: "#FFF", marginBottom: 8, letterSpacing: -0.3 },
  adCardSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.92)", fontWeight: "500", marginBottom: 16 },
  adCardButton: { backgroundColor: "rgba(255,255,255,0.22)", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  adCardButtonText: { color: "#FFF", fontWeight: "700", fontSize: 13, letterSpacing: 0.3 },
  adsDots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 },
  adsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#CBD5E1" },
  adsDotsActive: { backgroundColor: COLORS.primary, width: 28 },
  categorySection: { paddingHorizontal: 16, marginBottom: 32 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  categoryTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, letterSpacing: -0.4 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  categoryCard: { width: "48%", height: 140, borderRadius: 16, overflow: "hidden", position: "relative" },
  categoryImageBackground: { ...StyleSheet.absoluteFillObject },
  categoryOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  categoryTextContainer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#FFF", marginBottom: 4 },
  categoryDescription: { fontSize: 11, color: "#FFF", fontWeight: "500", opacity: 0.9 },
  categoryIconFallback: { position: "absolute", top: 16, left: 16, width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "900", color: COLORS.text, marginTop: 10 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600", marginTop: 6 },
  bottomPadding: { height: 24 },
  bottomNav: { flexDirection: "row", backgroundColor: COLORS.surface, paddingVertical: 8, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  navText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600", marginTop: 2 },
  modalContainer: { flex: 1, backgroundColor: "#000" },
  modalHeader: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10 || 34, backgroundColor: "rgba(255,255,255,0.97)", borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
  modalHeaderFullscreen: { backgroundColor: "rgba(0,0,0,0.75)", borderBottomColor: "transparent", paddingTop: Platform.OS === "ios" ? 50 : 20 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, flex: 1, marginHorizontal: 12 },
  modalTitleFullscreen: { color: "#FFF" },
  videoView: { flex: 1, backgroundColor: "#000" },
  videoLoadingContainer: { position: "absolute", inset: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.8)", zIndex: 5 },
  videoLoadingText: { color: "#FFF", fontSize: 16, marginTop: 10, fontWeight: "500" },
  warningModalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  warningModalContent: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "85%", maxWidth: 380, alignItems: "center" },
  warningIcon: { marginBottom: 16 },
  warningModalTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 12, textAlign: "center", letterSpacing: -0.3 },
  warningModalText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22, fontWeight: "500" },
  warningModalBold: { fontWeight: "800", color: COLORS.primary },
  warningModalButton: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14 },
  warningModalButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", paddingVertical: 16, fontStyle: "italic" },

  // Your Subjects
  subjectsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },
  subjectChip: {
    backgroundColor: "#EDE9FE",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  subjectChipText: {
    fontSize: 14,
    color: "#6B46C1",
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    width: "100%",
    paddingVertical: 8,
  },

  // NEW: Support Card
  supportCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minHeight: 120,
  },
  supportContent: {
    padding: 20,
    justifyContent: "space-between",
    flex: 1,
  },
  supportText: {
    color: "#FFF",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    flexShrink: 1,
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  supportButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
})

export default Dashboard