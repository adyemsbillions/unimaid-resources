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
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect } from "react"
import { Video } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "https://ilearn.lsfort.ng/"

const AllVideos = () => {
  const router = useRouter()

  // ────── STATE ──────
  const [allVideos, setAllVideos] = useState<any[]>([])
  const [userSubjects, setUserSubjects] = useState<string[]>([])
  const [filteredVideos, setFilteredVideos] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)

  // ────── FETCH USER + VIDEOS (ONCE) ──────
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId")
        if (!userId) {
          router.replace("/login")
          return
        }

        // Fetch user subjects
        const userRes = await fetch(`${BASE_URL}api/get_user_data.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parseInt(userId) }),
        })
        const userText = await userRes.text()
        let userData
        try {
          userData = JSON.parse(userText)
        } catch (e) {
          console.error("User JSON error:", e)
          throw new Error("Invalid user data")
        }

        if (!userRes.ok || !userData.success) {
          Alert.alert("Error", userData.error || "Failed to load user")
          return
        }

        const subjects = Array.isArray(userData.subjects) ? userData.subjects : []
        console.log("User selected subjects:", subjects) // DEBUG
        setUserSubjects(subjects)

        // Fetch ALL videos
        const videosRes = await fetch(`${BASE_URL}api/get_videos.php`)
        const videosText = await videosRes.text()
        let videosData
        try {
          videosData = JSON.parse(videosText)
        } catch (e) {
          console.error("Videos JSON error:", e)
          throw new Error("Invalid videos data")
        }

        if (!videosRes.ok || !Array.isArray(videosData)) {
          Alert.alert("Error", "Failed to fetch videos")
          setAllVideos([])
        } else {
          console.log("Total videos from API:", videosData.length) // DEBUG
          setAllVideos(videosData)
        }
      } catch (e: any) {
        console.error("Load error:", e)
        Alert.alert("Error", `Network error: ${e.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, []) // Empty deps → runs once

  // ────── FILTER: SUBJECTS + SEARCH (runs when data changes) ──────
  useEffect(() => {
    if (allVideos.length === 0) {
      setFilteredVideos([])
      return
    }

    console.log("Filtering with subjects:", userSubjects) // DEBUG

    // 1. Filter by user subjects
    const subjectFiltered = userSubjects.length === 0
      ? allVideos
      : allVideos.filter((v) => {
          const match = userSubjects.includes(v.subject_name)
          console.log(`Video: "${v.title}" | Subject: ${v.subject_name} → ${match ? "KEEP" : "SKIP"}`)
          return match
        })

    // 2. Then filter by search
    const final = subjectFiltered.filter(
      (video) =>
        (video.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.subject_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    console.log(`Final videos to show: ${final.length}`)
    setFilteredVideos(final)
  }, [allVideos, userSubjects, searchQuery])

  // ────── VIDEO PLAYER ──────
  const openVideo = (video: any) => {
    setSelectedVideo(video)
    setVideoLoading(true)
    setModalVisible(true)
  }

  const handleBack = () => router.push("/dashboard")
  const handleSearch = () => router.push("/search")

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#4B40C3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Videos</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
          <Ionicons name="search-outline" size={28} color="#4B40C3" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or subject"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* VIDEO GRID */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B40C3" />
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        ) : (
          <View style={styles.videoGrid}>
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoCard}
                  onPress={() => openVideo(video)}
                >
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{
                        uri: video.thumbnail_path || "https://images.unsplash.com/photo-1642726197512-617ce0e62262?ixlib=rb-4.1.0&auto=format&fit=crop&w=600",
                      }}
                      style={styles.cardThumbnail}
                    />
                    <View style={styles.playIconOverlay}>
                      <Ionicons name="play" size={28} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {video.title || "Untitled"}
                    </Text>
                    <Text style={styles.cardAuthor} numberOfLines={1}>
                      {video.subject_name || "Unknown"}
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
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? "No videos match your search"
                    : userSubjects.length === 0
                    ? "No videos available"
                    : `No videos for: ${userSubjects.join(", ")}`}
                </Text>
              </View>
            )}
            <View style={styles.bottomPadding} />
          </View>
        )}
      </ScrollView>

      {/* VIDEO MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false)
          setVideoLoading(false)
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); setVideoLoading(false) }}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedVideo?.title || "Video"}</Text>
          </View>

          {videoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#4B40C3" />
              <Text style={styles.videoLoadingText}>Loading...</Text>
            </View>
          )}

          <Video
            source={{ uri: selectedVideo?.file_path }}
            style={styles.videoView}
            useNativeControls
            resizeMode="contain"
            onLoadStart={() => setVideoLoading(true)}
            onReadyForDisplay={() => setVideoLoading(false)}
            onError={(e) => {
              setVideoLoading(false)
              Alert.alert("Error", "Video failed to load")
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1F2937", flex: 1, textAlign: "center" },
  iconButton: { padding: 8 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 10 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  videoGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16 },
  videoCard: { width: "48%", marginBottom: 16, backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" },
  cardImageContainer: { position: "relative", width: "100%", height: 100, backgroundColor: "#E5E7EB" },
  cardThumbnail: { width: "100%", height: "100%" },
  playIconOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)"
  },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  cardAuthor: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  cardDate: { fontSize: 11, color: "#9CA3AF" },
  emptyStateContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 40, width: "100%" },
  emptyStateText: { fontSize: 14, color: "#9CA3AF", textAlign: "center", marginTop: 12 },
  bottomPadding: { height: 20 },
  modalContainer: { flex: 1, backgroundColor: "#000" },
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#FFF" },
  modalTitle: { flex: 1, marginLeft: 12, fontSize: 18, fontWeight: "700" },
  videoView: { flex: 1 },
  videoLoadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)" },
  videoLoadingText: { color: "#FFF", marginTop: 12 }
})

export default AllVideos