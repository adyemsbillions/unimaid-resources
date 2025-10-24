"use client"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "https://uresources.cravii.ng/"

const Search = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState([])
  const [videos, setVideos] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId")
        if (!userId) {
          console.log("No user logged in, navigating to /login")
          router.replace("/login")
        }
      } catch (error) {
        console.error("Error checking login status:", error)
      }
    }
    checkLoginStatus()

    const fetchCourses = async () => {
      try {
        const response = await fetch(`${BASE_URL}api/get_courses.php`)
        const responseText = await response.text()
        console.log("Courses API Response:", responseText)
        try {
          const data = JSON.parse(responseText)
          if (data.success) {
            setCourses(data.courses)
            setFilteredCourses(data.courses)
          } else {
            Alert.alert("Error", data.error || "Failed to fetch courses")
          }
        } catch (e) {
          console.error("Courses JSON Parse Error:", e)
          Alert.alert("Error", "Invalid courses response from server")
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
        Alert.alert("Error", "Failed to fetch courses")
      }
    }

    const fetchVideos = async () => {
      try {
        const response = await fetch(`${BASE_URL}api/get_videos.php`)
        const responseText = await response.text()
        console.log("Videos API Response:", responseText, "Status:", response.status)
        try {
          const data = JSON.parse(responseText)
          if (response.ok && Array.isArray(data)) {
            setVideos(data)
            setFilteredVideos(data)
          } else {
            Alert.alert("Error", "Failed to fetch videos")
          }
        } catch (e) {
          console.error("Videos JSON Parse Error:", e)
          Alert.alert("Error", "Invalid videos response from server")
        }
      } catch (error) {
        console.error("Error fetching videos:", error)
        Alert.alert("Error", "Failed to fetch videos")
      }
    }

    fetchCourses()
    fetchVideos()
  }, [router])

  useEffect(() => {
    const filteredCourses = courses.filter(
      (course) =>
        (course.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.author || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredCourses(filteredCourses)

    const filteredVideos = videos.filter(
      (video) =>
        (video.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.subject_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredVideos(filteredVideos)
  }, [searchQuery, courses, videos])

  const handleBack = () => {
    router.push("/dashboard")
    console.log("Back pressed, navigating to /dashboard")
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userId")
      console.log("User logged out, navigating to /")
      router.replace("/")
    } catch (error) {
      console.error("Logout error:", error)
      Alert.alert("Error", "Failed to log out")
    }
  }

  const handleQuizSelect = (id) => {
    router.push(`/takequiz/${id}`)
    console.log(`Quiz ${id} pressed, navigating to /takequiz/${id}`)
  }

  const handleVideoSelect = (video) => {
    router.push({
      pathname: "/qa-viewall",
      params: { selectedVideo: JSON.stringify(video) },
    })
    console.log(`Video ${video.id} pressed, navigating to /qa-viewall with video data`)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quizzes, videos, or authors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quizzes</Text>
          <View style={styles.quizContainer}>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.quizCard}
                  onPress={() => handleQuizSelect(course.id)}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name={course.icon || "book"} size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{course.title || "Untitled Quiz"}</Text>
                    <Text style={styles.cardAuthor}>by {course.author || "Unknown Author"}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>
                {searchQuery ? "No quizzes match your search" : "No quizzes available"}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Videos</Text>
          <View style={styles.videoContainer}>
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoCard}
                  onPress={() => handleVideoSelect(video)}
                >
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
                      <Ionicons name="play" size= {28} color="#FFFFFF" />
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
              <Text style={styles.emptyText}>
                {searchQuery ? "No videos match your search" : "No videos available"}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  quizContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  quizCard: {
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
  cardAuthor: {
    fontSize: 12,
    color: "#666",
  },
  videoContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cardImageContainer: {
    position: "relative",
    width: 80,
    height: 50,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginRight: 10,
  },
  cardThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
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
  cardDate: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  bottomPadding: {
    height: 20,
  },
})

export default Search