"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const Dashboard = () => {
  const router = useRouter()

  const topAuthors = [
    { id: 1, name: "Rayford", avatar: "https://i.pravatar.cc/100?img=1" },
    { id: 2, name: "Willard", avatar: "https://i.pravatar.cc/100?img=2" },
    { id: 3, name: "Hannah", avatar: "https://i.pravatar.cc/100?img=3" },
    { id: 4, name: "Geoffrey", avatar: "https://i.pravatar.cc/100?img=4" },
  ]

  const friendAvatars = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    avatar: `https://i.pravatar.cc/60?img=${i + 10}`,
  }))

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userId")
      console.log("User logged out, navigating to /")
      router.replace("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="search-outline" size={24} color="#6B46C1" />
          <Text style={styles.logo}>Unimaid Resources</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Play Quiz Section */}
        <View style={styles.playQuizSection}>
          <View style={styles.playQuizContent}>
            <Text style={styles.playQuizTitle}>Play quiz together with{"\n"}your friends</Text>

            <View style={styles.friendsContainer}>
              {friendAvatars.map((friend, index) => (
                <View key={friend.id} style={[styles.friendAvatar, { zIndex: friendAvatars.length - index }]}>
                  <Image source={{ uri: friend.avatar }} style={styles.friendImage} />
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.findFriendsButton}>
              <Text style={styles.findFriendsText}>Find Friends</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Discover Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.discoverCards}>
            <TouchableOpacity style={[styles.discoverCard, styles.productivityCard]}>
              <View style={styles.cardIcon}>
                <Ionicons name="bar-chart" size={24} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Get Smarter with{"\n"}Productivity Quiz</Text>
              <View style={styles.cardFooter}>
                <Image source={{ uri: "https://i.pravatar.cc/30?img=5" }} style={styles.cardAvatar} />
                <Text style={styles.cardAuthor}>Alex Johnson</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.discoverCard, styles.ideasCard]}>
              <View style={styles.cardIcon}>
                <Ionicons name="bulb" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.cardTitle}>Great Ideas Come{"\n"}from Brilliant Minds</Text>
              <View style={styles.cardFooter}>
                <Image source={{ uri: "https://i.pravatar.cc/30?img=6" }} style={styles.cardAvatar} />
                <Text style={styles.cardAuthor}>Emma Thompson</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Authors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Authors</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.authorsContainer}>
            {topAuthors.map((author) => (
              <TouchableOpacity key={author.id} style={styles.authorItem}>
                <Image source={{ uri: author.avatar }} style={styles.authorAvatar} />
                <Text style={styles.authorName}>{author.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#6B46C1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  playQuizSection: {
    backgroundColor: "#6B46C1",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playQuizContent: {
    flex: 1,
  },
  playQuizTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  friendsContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  friendAvatar: {
    marginLeft: -8,
  },
  friendImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  findFriendsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  findFriendsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  playButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#6B46C1",
    fontWeight: "500",
  },
  discoverCards: {
    flexDirection: "row",
    gap: 15,
  },
  discoverCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    minHeight: 140,
  },
  productivityCard: {
    backgroundColor: "#8B5CF6",
  },
  ideasCard: {
    backgroundColor: "#FEF3C7",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
  cardAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  cardAuthor: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  authorsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  authorItem: {
    alignItems: "center",
    flex: 1,
  },
  authorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
})

export default Dashboard