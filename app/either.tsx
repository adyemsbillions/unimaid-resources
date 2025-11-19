"use client"
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Alert, ActivityIndicator, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState, useEffect } from "react"

const COLORS = {
  primary: "#6366F1",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
}

interface Option {
  type: "video" | "quiz"
  id: number
  title: string
  path?: string
  thumbnail_path?: string
  question_count?: number
}

export default function EitherPage() {
  const { topic_id, topic_name } = useLocalSearchParams<{ topic_id: string; topic_name: string }>()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Option[]>([])
  const [videos, setVideos] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"quizzes" | "videos">("quizzes")

  useEffect(() => {
    if (!topic_id) return

    fetch(`https://ilearn.lsfort.ng/api/fetch_either.php?topic_id=${topic_id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const quizData = json.data.filter((item: any) => item.type === "quiz")
          const videoData = json.data.filter((item: any) => item.type === "video")
          setQuizzes(quizData)
          setVideos(videoData)
        }
      })
      .catch(() => Alert.alert("Error", "Failed to load content"))
      .finally(() => setLoading(false))
  }, [topic_id])

  const handleChoice = (opt: Option) => {
    if (opt.type === "video") {
      router.push({
        pathname: "/video",
        params: { video_id: opt.id.toString(), title: opt.title }
      })
    } else {
      router.push({
        pathname: "/take_quiz",
        params: { course_id: opt.id.toString(), title: opt.title }
      })
    }
  }

  const data = activeTab === "quizzes" ? quizzes : videos

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{topic_name || "Choose"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "quizzes" && styles.activeTab]}
          onPress={() => setActiveTab("quizzes")}
        >
          <Ionicons 
            name="document-text" 
            size={16} 
            color={activeTab === "quizzes" ? "white" : COLORS.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === "quizzes" && styles.activeTabText]}>
            QUIZZES ({quizzes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "videos" && styles.activeTab]}
          onPress={() => setActiveTab("videos")}
        >
          <Ionicons 
            name="play-circle" 
            size={16} 
            color={activeTab === "videos" ? "white" : COLORS.textSecondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === "videos" && styles.activeTabText]}>
            VIDEOS ({videos.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading {activeTab}...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="alert-circle-outline" size={56} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No {activeTab === "quizzes" ? "Quizzes" : "Videos"}</Text>
              <Text style={styles.emptyText}>
                No {activeTab === "quizzes" ? "quiz" : "video"} available for this topic yet.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {data.map((opt) => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={styles.card} 
                  onPress={() => handleChoice(opt)}
                  activeOpacity={0.7}
                >
                  {opt.type === "video" ? (
                    <View style={styles.mediaContainer}>
                      <Image 
                        source={{ uri: opt.thumbnail_path || "https://via.placeholder.com/300x160" }} 
                        style={styles.thumbnail}
                      />
                      <View style={styles.playButtonOverlay}>
                        <Ionicons name="play" size={28} color="white" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.quizIcon}>
                      <View style={styles.quizIconBg}>
                        <Ionicons name="document-text" size={44} color={COLORS.primary} />
                      </View>
                      <Text style={styles.quizCount}>{opt.question_count || 0} Questions</Text>
                    </View>
                  )}
                  
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{opt.title}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardType}>
                        {opt.type === "video" ? "Video Lesson" : "Quiz"}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
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
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { 
    padding: 8,
    borderRadius: 8,
    marginLeft: -8,
  },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text, flex: 1, marginLeft: 12 },
  
  tabContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  tab: { 
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  activeTab: { 
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: { 
    fontWeight: "600", 
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  activeTabText: { 
    color: "white",
    fontWeight: "700",
  },
  
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400 },
  loadingText: { marginTop: 16, fontSize: 15, color: COLORS.textSecondary, fontWeight: "500" },
  
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, maxWidth: 280 },
  
  grid: { gap: 16, paddingBottom: 16 },
  
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  mediaContainer: {
    position: "relative",
    width: "100%",
    height: 160,
  },
  thumbnail: { 
    width: "100%", 
    height: "100%",
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  
  quizIcon: {
    height: 160,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  quizIconBg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quizCount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 4,
  },
  
  cardContent: { 
    padding: 16,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: COLORS.text,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  cardType: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    fontWeight: "500",
  },
})
