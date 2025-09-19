"use client"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "http://192.168.218.38/unimaidresourcesquiz/"

const Search = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState([])

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
    fetchCourses()
  }, [router])

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

  // Filter courses based on search query
  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quizzes or authors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Search Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <View style={styles.quizContainer}>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.quizCard}
                  onPress={() => handleQuizSelect(course.id)}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name={course.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{course.title}</Text>
                    <Text style={styles.cardAuthor}>by {course.author}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No results found.</Text>
            )}
          </View>
        </View>
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
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
})

export default Search