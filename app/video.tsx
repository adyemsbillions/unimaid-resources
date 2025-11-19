"use client"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Video, ResizeMode } from "expo-av"
import { useState, useRef } from "react"

const { width, height } = Dimensions.get("window")

export default function VideoPage() {
  const { video_id, title } = useLocalSearchParams<{ video_id: string; title: string }>()
  const router = useRouter()
  const videoRef = useRef<any>(null)
  const [status, setStatus] = useState<any>({})

  // Your real video path
  const videoUrl = video_id ? `https://ilearn.lsfort.ng/api/me/uploads/videos/${video_id}.mp4` : null

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {decodeURIComponent(title || "Video Lesson")}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={setStatus}
            onError={(e) => console.log("Video error:", e)}
          />
        ) : (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={60} color="#ef4444" />
            <Text style={styles.errorText}>Video not found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10,
  },
  backBtn: { padding: 8 },
  title: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: width,
    height: height * 0.6,
  },
  error: {
    alignItems: "center",
  },
  errorText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
  },
})