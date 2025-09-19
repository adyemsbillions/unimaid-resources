
"use client"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "http://192.168.218.38/unimaidresourcesquiz/"

const Profile = () => {
  const router = useRouter()
  const [userName, setUserName] = useState("Loading...")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ quizzes_taken: 0, avg_score: 0, streak_days: 0 })
  const [achievements, setAchievements] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId")
        if (!userId) {
          console.log("No user logged in, navigating to /login")
          router.replace("/login")
          return
        }

        console.log("Fetching user data for userId:", userId)

        const userResponse = await fetch(`${BASE_URL}api/get_user_data.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parseInt(userId) }),
        })
        const userText = await userResponse.text()
        console.log("User API Response:", userText)
        let userData
        try {
          userData = JSON.parse(userText)
        } catch (jsonError) {
          console.error("JSON Parse error (user):", jsonError)
          throw new Error("Invalid JSON response from server")
        }

        if (userResponse.ok && userData.success) {
          setUserName(userData.username || "Unknown User")
        } else {
          Alert.alert("Error", userData.error || "Failed to fetch user data")
          setUserName("Unknown User")
          router.replace("/login")
          return
        }

        const statsResponse = await fetch(`${BASE_URL}api/get_user_stats.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parseInt(userId) }),
        })
        const statsText = await statsResponse.text()
        console.log("Stats API Response:", statsText)
        let statsData
        try {
          statsData = JSON.parse(statsText)
        } catch (jsonError) {
          console.error("JSON Parse error (stats):", jsonError)
          throw new Error("Invalid JSON response from server")
        }

        if (statsResponse.ok && statsData.success) {
          setStats(statsData.stats)
          setAchievements(statsData.achievements)
          setRecentActivity(statsData.recentActivity)
        } else {
          Alert.alert("Error", statsData.error || "Failed to fetch stats")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        Alert.alert("Error", `Network error occurred: ${error.message}`)
        setUserName("Unknown User")
        router.replace("/login")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            {isLoading ? (
              <Text style={styles.avatarText}>...</Text>
            ) : (
              <Text style={styles.avatarText}>
                {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{isLoading ? "Loading..." : userName}</Text>
          <Text style={styles.userSubtitle}>Quiz Enthusiast</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.quizzes_taken}</Text>
              <Text style={styles.statLabel}>Quizzes Taken</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avg_score}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.streak_days}</Text>
              <Text style={styles.statLabel}>Streak Days</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsContainer}>
            {achievements.length > 0 ? (
              achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.bgColor }]}>
                    <Ionicons name={achievement.icon} size={24} color="#333" />
                  </View>
                  <Text style={styles.achievementLabel}>{achievement.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No achievements yet</Text>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: activity.bgColor }]}>
                    <Ionicons name={activity.icon} size={20} color="#333" />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityScore}>Scored {activity.score}</Text>
                  </View>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No recent activity</Text>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
            {[
              { label: "Notifications", enabled: true },
              { label: "Sound Effects", enabled: false },
              { label: "Dark Mode", enabled: false },
            ].map((setting, index) => (
              <View key={index} style={styles.settingItem}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                <View style={[styles.toggle, { backgroundColor: setting.enabled ? "#6B46C1" : "#ccc" }]}>
                  <View
                    style={[
                      styles.toggleCircle,
                      { transform: [{ translateX: setting.enabled ? 18 : 2 }] },
                    ]}
                  />
                </View>
              </View>
            ))}
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
  profileContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 15,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: "#6B46C1",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6B46C1",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  achievementsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  achievementItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 10,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  achievementLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  activityContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityDetails: {
    flex: 1,
    marginLeft: 10,
  },
  activityName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  activityScore: {
    fontSize: 12,
    color: "#666",
  },
  activityTime: {
    fontSize: 12,
    color: "#999",
  },
  settingsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 14,
    color: "#333",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    padding: 10,
  },
})

export default Profile
