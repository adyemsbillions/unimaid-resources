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
}

interface Topic {
  id: number
  name: string
  subject_id: number
}

export default function SubjectDetail() {
  const { id, sid } = useLocalSearchParams<{ id: string; sid: string }>()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [subjectName, setSubjectName] = useState("Topics")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTopics = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch(`https://ilearn.lsfort.ng/api/fetch_topics.php?subject_id=${sid}`)
      const json = await res.json()

      if (json.success) {
        setTopics(json.data)
        if (json.data.length > 0) {
          setSubjectName(json.data[0].name || "Topics")
        }
      } else {
        Alert.alert("Error", json.error)
      }
    } catch (e) {
      Alert.alert("Network Error", "Check internet")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [sid])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Topics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTopics(true)} colors={[COLORS.primary]} />
        }
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No topics found</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicItem}
                onPress={() => {
                  Alert.alert("Next Step", `Open lessons for Topic ID: ${topic.id}`)
                  // Later: router.push(`/lessons?topic_id=${topic.id}`)
                }}
              >
                <View style={styles.topicIcon}>
                  <Ionicons name="reader-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.topicName}>{topic.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
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
  list: { paddingHorizontal: 16 },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topicName: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.text },
})