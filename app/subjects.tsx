"use client"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState, useEffect, useCallback } from "react"

const COLORS = {
  primary: "#6366F1",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
}

interface Subject {
  id: number
  name: string
  category_id: number
}

export default function SubjectsPage() {
  const { category_id } = useLocalSearchParams<{ category_id: string }>()
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categoryName, setCategoryName] = useState("Subjects")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSubjects = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch(`https://ilearn.lsfort.ng/api/fetch_subjects.php?category_id=${category_id}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setSubjects(json.data)
        // Optional: fetch category name from categories API
      } else {
        Alert.alert("Error", json.error || "No subjects")
      }
    } catch (e) {
      Alert.alert("Network Error", "Check internet")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [category_id])

  useEffect(() => {
    if (category_id) fetchSubjects()
  }, [fetchSubjects])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subjects</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSubjects(true)} colors={[COLORS.primary]} />
        }
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No subjects found</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={styles.subjectCard}
                onPress={() => router.push(`/topics?subject_id=${subject.id}`)}
              >
                <View style={styles.subjectIcon}>
                  <Ionicons name="book-outline" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  subjectCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  subjectIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
})