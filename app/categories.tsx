"use client"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect, useCallback } from "react"
import { LinearGradient } from "expo-linear-gradient"

const COLORS = {
  primary: "#6366F1",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
}

interface CategoryAPI {
  id: number
  name: string
  description?: string | null
  image_url?: string | null
  color: string
}

interface CategoryUI {
  id: number
  name: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  description: string
  image_url?: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryUI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const getIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
      JAMB: "book-outline",
      WAEC: "school-outline",
      Safety: "shield-outline",
      Courses: "grid-outline",
      Mathematics: "calculator",
      English: "book",
      Physics: "flash",
      Chemistry: "flask",
      Biology: "leaf",
    }
    return map[name] || "folder-outline"
  }

  const fetchCategories = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await fetch("https://ilearn.lsfort.ng/api/fetch_category.php")
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        const mapped: CategoryUI[] = json.data.map((c: CategoryAPI) => ({
          id: c.id,
          name: c.name || `Category ${c.id}`,
          icon: getIcon(c.name || ""),
          color: c.color || COLORS.primary,
          description: c.description || "Explore lessons",
          image_url: c.image_url || undefined,
        }))
        setCategories(mapped)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCategories(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/subjects?category_id=${cat.id}`)}
              >
                <Image
                  source={{ uri: cat.image_url || "https://via.placeholder.com/150" }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />

                <View style={styles.overlay}>
                  <LinearGradient
                    colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)", "transparent"]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.name}>{cat.name}</Text>
                    <Text style={styles.description}>{cat.description}</Text>
                  </View>
                </View>

                {!cat.image_url && (
                  <View style={[styles.iconFallback, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={32} color="#FFF" />
                  </View>
                )}
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
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 34,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  loadingText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginBottom: 12,
  },
  categoryImage: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  textContainer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 },
  name: { fontSize: 15, fontWeight: "700", color: "#FFF", marginBottom: 4 },
  description: { fontSize: 11, color: "#FFF", fontWeight: "500", opacity: 0.9 },
  iconFallback: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
})