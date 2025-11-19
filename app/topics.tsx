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

interface Topic {
  id: number
  name: string
  subject_id: number
}

export default function TopicsPage() {
  const { subject_id, subject_name } = useLocalSearchParams<{ 
    subject_id: string
    subject_name?: string 
  }>()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [subjectName, setSubjectName] = useState("Topics")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTopics = useCallback(async (pull = false) => {
    if (!subject_id) {
      Alert.alert("Error", "Subject ID missing")
      return
    }

    if (pull) setRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch(`https://ilearn.lsfort.ng/api/fetch_topics.php?subject_id=${subject_id}`)
      const text = await res.text()

      if (!text.trim()) throw new Error("Empty response")

      const json = JSON.parse(text)

      if (json.success && Array.isArray(json.data)) {
        setTopics(json.data)
        if (subject_name) setSubjectName(subject_name)
      } else {
        setTopics([])
        Alert.alert("No Topics", json.error || "This subject has no topics yet.")
      }
    } catch (e: any) {
      console.error("Fetch topics error:", e)
      Alert.alert("Error", e.message || "Failed to load topics")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [subject_id, subject_name])

  useEffect(() => {
    if (subject_id) {
      fetchTopics()
    }
  }, [fetchTopics])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {subjectName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchTopics(true)} 
            colors={[COLORS.primary]} 
          />
        }
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading topics...</Text>
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Topics Yet</Text>
            <Text style={styles.emptyText}>This subject doesn't have any topics.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicItem}
                onPress={() => {
                  router.push({
                    pathname: "/either", // GO TO EITHER PAGE
                    params: { 
                      topic_id: topic.id.toString(),
                      topic_name: topic.name 
                    }
                  })
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
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
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
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: COLORS.text,
    flex: 1,
    marginLeft: 12,
  },
  loading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingVertical: 80 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  empty: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 32,
    paddingVertical: 80 
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: { 
    fontSize: 14, 
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  list: { 
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  topicName: { 
    flex: 1, 
    fontSize: 15.5, 
    fontWeight: "600", 
    color: COLORS.text 
  },
})