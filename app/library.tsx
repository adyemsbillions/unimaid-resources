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

const BASE_URL = "https://ilearn.lsfort.ng/"

const AllVideos = () => {
  const router = useRouter()
  const [videos, setVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videosResponse = await fetch(`${BASE_URL}api/get_videos.php`)
        const videosText = await videosResponse.text()
        console.log("Videos API Response:", videosText, "Status:", videosResponse.status)
        let videosData
        try {
          videosData = JSON.parse(videosText)
        } catch (jsonError) {
          console.error("Videos JSON Parse error:", jsonError)
          throw new Error("Invalid JSON response from videos API")
        }

        if (videosResponse.ok && Array.isArray(videosData)) {
          setVideos(videosData)
          setFilteredVideos(videosData)
        } else {
          Alert.alert("Error", "Failed to fetch videos")
          setVideos([])
          setFilteredVideos([])
        }
      } catch (error) {
        console.error("Error fetching videos:", error)
        Alert.alert("Error", `Network error occurred: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    fetchVideos()
  }, [])

  useEffect(() => {
    const filtered = videos.filter(
      (video) =>
        (video.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.subject_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredVideos(filtered)
  }, [searchQuery, videos])

  const openVideo = (video) => {
    setSelectedVideo(video)
    setVideoLoading(true)
    setModalVisible(true)
  }

  const handleBack = () => {
    router.push("/dashboard")
    console.log("Back pressed, navigating to /dashboard")
  }

  const handleSearch = () => {
    router.push("/search")
    console.log("Search pressed, navigating to /search")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#4B40C3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Videos</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
            <Ionicons name="search-outline" size={28} color="#4B40C3" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos by title or subject"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color="#4B40C3" style={styles.loadingIcon} />
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        ) : (
          <View style={styles.videoGrid}>
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <TouchableOpacity key={video.id} style={styles.videoCard} onPress={() => openVideo(video)}>
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{
                        uri:
                          video.thumbnail_path ||
                          "https://images.unsplash.com/photo-1642726197512-617ce0e62262?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D&auto=format&fit=crop&q=60&w=600",
                      }}
                      style={styles.cardThumbnail}
                      onError={(error) =>
                        console.error(`Thumbnail load failed for ${video.thumbnail_path}:`, error.nativeEvent.error)
                      }
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
                    <Text style={styles.cardDate}>{new Date(video.created_at).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="videocam-off" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? "No videos match your search" : "No videos available"}
                </Text>
              </View>
            )}
            <View style={styles.bottomPadding} />
          </View>
        )}
      </ScrollView>

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
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false)
                setVideoLoading(false)
              }}
            >
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedVideo?.title || "Untitled Video"}</Text>
          </View>
          {videoLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#4B40C3" />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}
          <Video
            source={{ uri: selectedVideo?.file_path }}
            style={[styles.videoView, videoLoading && { display: "none" }]}
            useNativeControls
            resizeMode="contain"
            posterSource={{
              uri:
                selectedVideo?.thumbnail_path ||
                "https://images.unsplash.com/photo-1642726197512-617ce0e62262?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D&auto=format&fit=crop&q=60&w=600",
            }}
            onError={(error) => {
              setVideoLoading(false)
              Alert.alert("Error", `Failed to load video: ${error}`)
            }}
            onLoadStart={() => setVideoLoading(true)}
            onLoad={() => setVideoLoading(false)}
            shouldPlay={false}
          />
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 44,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
  },
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 10,
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
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
  videoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  videoCard: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
    fontSize: 18,
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
    fontWeight: "500",
  },
})

export default AllVideos