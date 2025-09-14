"use client"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const Library = () => {
  const router = useRouter()

  // Placeholder data for saved quizzes
  const savedQuizzes = [
    { id: 1, title: "Productivity Quiz", author: "Alex Johnson", icon: "bar-chart" },
    { id: 2, title: "General Knowledge Trivia", author: "Sarah Lee", icon: "bulb" },
    { id: 3, title: "Science Challenge", author: "Mark Brown", icon: "flask" },
  ]

  // Placeholder data for donors
  const donors = [
    { id: 1, name: "Alice Smith", amount: 5000, avatar: "https://i.pravatar.cc/100?img=8" },
    { id: 2, name: "Bob Wilson", amount: 10000, avatar: "https://i.pravatar.cc/100?img=9" },
    { id: 3, name: "Clara Jones", amount: 2500, avatar: "https://i.pravatar.cc/100?img=10" },
  ]

  // Placeholder data for handouts
  const handouts = [
    { id: 1, title: "Study Guide: Productivity 101", type: "PDF" },
    { id: 2, title: "Science Notes", type: "PDF" },
  ]

  // Placeholder data for loans
  const loans = [
    { id: 1, title: "Student Loan", amount: 20000, term: "12 months" },
    { id: 2, title: "Education Support Loan", amount: 50000, term: "24 months" },
  ]

  // Placeholder data for downloads
  const downloads = [
    { id: 1, title: "Productivity Quiz Results", type: "PDF" },
    { id: 2, title: "Science Notes", type: "PDF" },
  ]

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
    }
  }

  const handleDonate = () => {
    router.push("/donate")
    console.log("Donate pressed, navigating to /donate")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Donate Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support Us</Text>
            <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
              <Text style={styles.donateButtonText}>Donate Now</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.donorScroll}
            snapToInterval={150 + 20} // Card width + margin
            decelerationRate="fast"
          >
            {donors.map((donor) => (
              <View key={donor.id} style={styles.donorCard}>
                <Image source={{ uri: donor.avatar }} style={styles.donorAvatar} />
                <Text style={styles.donorName}>{donor.name}</Text>
                <Text style={styles.donorAmount}>₦{donor.amount.toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Handouts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handouts</Text>
          <View style={styles.itemContainer}>
            {handouts.length > 0 ? (
              handouts.map((handout) => (
                <TouchableOpacity key={handout.id} style={styles.itemCard}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{handout.title}</Text>
                    <Text style={styles.cardSubtitle}>{handout.type}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No handouts available.</Text>
            )}
          </View>
        </View>

        {/* Quiz Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Quizzes</Text>
          <View style={styles.itemContainer}>
            {savedQuizzes.length > 0 ? (
              savedQuizzes.map((quiz) => (
                <TouchableOpacity key={quiz.id} style={styles.itemCard}>
                  <View style={styles.cardIcon}>
                    <Ionicons name={quiz.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{quiz.title}</Text>
                    <Text style={styles.cardSubtitle}>by {quiz.author}</Text>
                  </View>
                  <Ionicons name="bookmark" size={20} color="#6B46C1" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No quizzes saved yet.</Text>
            )}
          </View>
        </View>

        {/* Take a Loan Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Take a Loan</Text>
          <View style={styles.itemContainer}>
            {loans.length > 0 ? (
              loans.map((loan) => (
                <TouchableOpacity key={loan.id} style={styles.itemCard}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="cash" size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{loan.title}</Text>
                    <Text style={styles.cardSubtitle}>₦{loan.amount.toLocaleString()} - {loan.term}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No loan options available.</Text>
            )}
          </View>
        </View>

        {/* My Downloads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Downloads</Text>
          <View style={styles.itemContainer}>
            {downloads.length > 0 ? (
              downloads.map((download) => (
                <TouchableOpacity key={download.id} style={styles.itemCard}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="download" size={24} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{download.title}</Text>
                    <Text style={styles.cardSubtitle}>{download.type}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No downloads yet.</Text>
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
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  donateButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  donateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  donorScroll: {
    marginTop: 10,
  },
  donorCard: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    alignItems: "center",
    marginRight: 10,
  },
  donorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  donorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  donorAmount: {
    fontSize: 12,
    color: "#6B46C1",
  },
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  itemCard: {
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
  cardSubtitle: {
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

export default Library