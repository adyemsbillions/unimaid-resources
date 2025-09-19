"use client"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect } from "react"

const AllQuizzes = () => {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState([])
  const [filteredQuizzes, setFilteredQuizzes] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("http://192.168.218.38/unimaidresourcesquiz/api/get_quizzes.php")
        const data = await response.json()
        setQuizzes(data)
        setFilteredQuizzes(data)
      } catch (error) {
        console.error("Error fetching quizzes:", error)
      }
    }
    fetchQuizzes()
  }, [])

  useEffect(() => {
    const filtered = quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredQuizzes(filtered)
  }, [searchQuery, quizzes])

  const handleBack = () => {
    router.back()
    console.log("Back pressed, navigating to previous screen")
  }

  const handleQuizPress = (quizId) => {
    router.push(`/takequiz/${quizId}`)
    console.log(`Quiz ${quizId} pressed, navigating to /takequiz/${quizId}`)
  }

  const renderQuizItem = ({ item }) => (
    <TouchableOpacity style={[styles.quizCard, styles.quizCardStyle]} onPress={() => handleQuizPress(item.id)}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardAuthor}>{item.author_name} • {item.num_questions} questions</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Quizzes</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search quizzes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredQuizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.quizCards}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerPlaceholder: {
    width: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  quizCards: {
    justifyContent: "space-between",
    gap: 15,
  },
  quizCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    minHeight: 100,
    marginBottom: 15,
  },
  quizCardStyle: {
    backgroundColor: "#8B5CF6",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardAuthor: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
})

export default AllQuizzes