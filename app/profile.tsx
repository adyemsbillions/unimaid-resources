"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Stats {
  quizzes_taken: number
  avg_score: number
  streak_days: number
}

interface Achievement {
  icon: string
  label: string
  bgColor: string
}

interface Activity {
  icon: string
  name: string
  score: string
  time: string
  bgColor: string
}

interface UserData {
  success: boolean
  username?: string
  subjects?: string[]
  gender?: string
  state?: string
  age?: number
  has_edited_profile?: boolean
  error?: string
}

interface StatsData {
  success: boolean
  stats: Stats
  achievements: Achievement[]
  recentActivity: Activity[]
  error?: string
}

const BASE_URL = "https://ilearn.lsfort.ng/"

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]

const Profile: React.FC = () => {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("Loading...")
  const [subjects, setSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<Stats>({ quizzes_taken: 0, avg_score: 0, streak_days: 0 })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [hasEditedProfile, setHasEditedProfile] = useState<boolean>(false)

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [gender, setGender] = useState<string>("")
  const [state, setState] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---------- FETCH USER ----------
  const fetchUser = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) {
        router.replace("/")
        return
      }

      const res = await fetch(`${BASE_URL}api/get_user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId) }),
      })
      const json = await res.json()

      if (json.success) {
        setUserName(json.username || "User")
      } else {
        Alert.alert("Error", json.error || "Failed to load user")
        router.replace("/")
      }
    } catch (e) {
      console.error("Failed to fetch user:", e)
      Alert.alert("Error", "Check internet or login again")
    }
  }, [router])

  // ---------- FETCH USER DATA (subjects, gender, etc.) ----------
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

      if (json.success) {
        setSubjects(json.subjects || [])
        setGender(json.gender || "")
        setState(json.state || "")
        setAge(json.age ? json.age.toString() : "")
        setHasEditedProfile(!!json.has_edited_profile)
      }
    } catch (e) {
      console.error("Failed to fetch user data:", e)
    }
  }, [])

  // ---------- FETCH STATS ----------
  const fetchStats = useCallback(async () => {
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
        setAchievements(json.achievements || [])
        setRecentActivity(json.recentActivity || [])
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e)
    }
  }, [])

  // ---------- LOAD ALL DATA ----------
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchUser(),
        fetchUserData(),
        fetchStats(),
      ])
      setIsLoading(false)
    }
    loadData()
  }, [fetchUser, fetchUserData, fetchStats])

  // ---------- LOGOUT ----------
  const handleLogout = async () => {
    await AsyncStorage.removeItem("userId")
    router.replace("/")
  }

  // ---------- EDIT PROFILE ----------
  const openEditModal = () => {
    if (hasEditedProfile) {
      Alert.alert("Profile Locked", "You can only edit your profile once.")
      return
    }
    setEditModalVisible(true)
  }

  const closeEditModal = () => {
    setEditModalVisible(false)
  }

  const handleSaveProfile = async () => {
    if (!gender || !state || !age) {
      Alert.alert("Incomplete", "Please fill in all fields.")
      return
    }
    if (isNaN(Number.parseInt(age)) || Number.parseInt(age) < 10 || Number.parseInt(age) > 100) {
      Alert.alert("Invalid Age", "Please enter a valid age between 10 and 100.")
      return
    }
    setIsSubmitting(true)
    try {
      const userId = await AsyncStorage.getItem("userId")
      const response = await fetch(`${BASE_URL}api/update_user_profile.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number.parseInt(userId!),
          gender,
          state,
          age: Number.parseInt(age),
        }),
      })
      const text = await response.text()
      let result
      try {
        result = JSON.parse(text)
      } catch {
        throw new Error("Invalid response")
      }
      if (response.ok && result.success) {
        setHasEditedProfile(true)
        await fetchUserData() // Refresh data
        Alert.alert("Success", "Profile updated successfully!")
        closeEditModal()
      } else {
        Alert.alert("Error", result.error || "Failed to update profile")
      }
    } catch (error: any) {
      Alert.alert("Error", `Network error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/dashboard")}>
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* PROFILE CARD */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            {isLoading ? (
              <Text style={styles.avatarText}>...</Text>
            ) : (
              <Text style={styles.avatarText}>
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{isLoading ? "Loading..." : userName}</Text>
          <Text style={styles.userSubtitle}>Quiz Enthusiast • Keep Learning</Text>
          <TouchableOpacity
            style={[styles.editButton, hasEditedProfile && styles.editButtonDisabled]}
            onPress={openEditModal}
            disabled={hasEditedProfile}
          >
            <Ionicons name="pencil-outline" size={16} color="#fff" />
            <Text style={styles.editButtonText}>
              {hasEditedProfile ? "Profile Locked" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* YOUR STATS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.statValue}>{stats.quizzes_taken}</Text>
              <Text style={styles.statLabel}>Quizzes</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={20} color="#FFD93D" />
              </View>
              <Text style={styles.statValue}>{stats.avg_score}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={20} color="#FF8C42" />
              </View>
              <Text style={styles.statValue}>{stats.streak_days}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* YOUR SUBJECTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Subjects</Text>
          <View style={styles.subjectsContainer}>
            {isLoading ? (
              <Text style={styles.noDataText}>Loading subjects...</Text>
            ) : subjects.length > 0 ? (
              subjects.map((subject, index) => (
                <View key={index} style={styles.subjectItem}>
                  <Text style={styles.subjectText}>{subject}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No subjects selected</Text>
            )}
          </View>
        </View>

        {/* ACHIEVEMENTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsContainer}>
            {isLoading ? (
              <Text style={styles.noDataText}>Loading achievements...</Text>
            ) : achievements.length > 0 ? (
              achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.bgColor }]}>
                    <Ionicons name={achievement.icon as any} size={24} color="#333" />
                  </View>
                  <Text style={styles.achievementLabel}>{achievement.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No achievements yet</Text>
            )}
          </View>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {isLoading ? (
              <Text style={styles.noDataText}>Loading recent activity...</Text>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: activity.bgColor }]}>
                    <Ionicons name={activity.icon as any} size={20} color="#333" />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityScore}>{activity.score}</Text>
                  </View>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No recent activity</Text>
            )}
          </View>
        </View>

        {/* SETTINGS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
            {[{ label: "Notifications", enabled: true }].map((setting, index) => (
              <View key={index} style={styles.settingItem}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                <View style={[styles.toggle, { backgroundColor: setting.enabled ? "#6B46C1" : "#ccc" }]}>
                  <View style={[styles.toggleCircle, { transform: [{ translateX: setting.enabled ? 18 : 2 }] }]} />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/support")}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Get Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal animationType="slide" transparent={true} visible={editModalVisible} onRequestClose={closeEditModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  {["Male", "Female", "Prefer not to say"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pickerOption, gender === option && styles.pickerOptionSelected]}
                      onPress={() => setGender(option)}
                    >
                      <Text style={[styles.pickerText, gender === option && styles.pickerTextSelected]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* State */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State of Residence</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateScroll}>
                  {NIGERIAN_STATES.map((stateName) => (
                    <TouchableOpacity
                      key={stateName}
                      style={[styles.stateChip, state === stateName && styles.stateChipSelected]}
                      onPress={() => setState(stateName)}
                    >
                      <Text style={[styles.stateChipText, state === stateName && styles.stateChipTextSelected]}>
                        {stateName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Age */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholder="Enter your age"
                  maxLength={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeEditModal}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// === STYLES (unchanged) ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 0,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  iconButton: { padding: 5 },
  scrollView: { flex: 1 },
  profileContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#6B46C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  userName: { fontSize: 24, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  userSubtitle: { fontSize: 14, color: "#999", marginBottom: 20 },
  editButton: {
    backgroundColor: "#6B46C1",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  editButtonDisabled: { backgroundColor: "#ccc" },
  editButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  viewAllText: { fontSize: 14, color: "#6B46C1", fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f8f9fb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#999", fontWeight: "500" },
  subjectsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectItem: {
    backgroundColor: "#EDE9FE",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  subjectText: { fontSize: 13, color: "#6B46C1", fontWeight: "600" },
  achievementsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fb",
    borderRadius: 12,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  achievementLabel: { fontSize: 12, color: "#666", textAlign: "center", fontWeight: "500" },
  activityContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activityDetails: { flex: 1, marginLeft: 12 },
  activityName: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },
  activityScore: { fontSize: 11, color: "#6B46C1", fontWeight: "600", marginTop: 2 },
  activityTime: { fontSize: 11, color: "#999" },
  settingsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabel: { fontSize: 14, color: "#1a1a2e", fontWeight: "500" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flex: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  noDataText: { fontSize: 14, color: "#999", textAlign: "center", padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  modalScroll: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  pickerContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  pickerOptionSelected: { backgroundColor: "#6B46C1", borderColor: "#6B46C1" },
  pickerText: { color: "#666", fontSize: 14 },
  pickerTextSelected: { color: "#fff", fontWeight: "600" },
  stateScroll: { maxHeight: 120 },
  stateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginRight: 8,
    marginBottom: 8,
  },
  stateChipSelected: { backgroundColor: "#6B46C1", borderColor: "#6B46C1" },
  stateChipText: { color: "#666", fontSize: 13 },
  stateChipTextSelected: { color: "#fff", fontWeight: "600" },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  cancelButton: { backgroundColor: "#f0f0f0" },
  cancelButtonText: { color: "#666", fontWeight: "600" },
  saveButton: { backgroundColor: "#6B46C1" },
  saveButtonDisabled: { backgroundColor: "#ccc" },
  saveButtonText: { color: "#fff", fontWeight: "600" },
})

export default Profile