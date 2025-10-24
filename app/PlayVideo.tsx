import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import { Video } from "expo-av";

const PlayVideo = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { video } = params as { video: string };
  const parsedVideo = JSON.parse(video) as {
    id: string;
    title: string;
    file_path: string;
    thumbnail_path?: string;
  };

  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef(null);

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: Platform.OS === "ios" ? 20 : 0 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.back();
            setVideoLoading(false);
            setVideoError(null);
          }}
        >
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>{parsedVideo?.title || "Video"}</Text>
      </View>

      {/* Loading Indicator */}
      {videoLoading && (
        <View style={styles.videoLoadingContainer}>
          <ActivityIndicator size="large" color="#4B40C3" />
          <Text style={styles.videoLoadingText}>Loading video...</Text>
        </View>
      )}

      {/* Error Display */}
      {videoError && (
        <View style={styles.videoErrorContainer}>
          <Text style={styles.videoErrorText}>
            Failed to play video (ID: {parsedVideo?.id}, {parsedVideo?.title}):{" "}
            {videoError}. Please contact support.
          </Text>
        </View>
      )}

      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: parsedVideo?.file_path }}
        style={styles.videoView}
        useNativeControls
        resizeMode="contain"
        shouldPlay
        posterSource={{
          uri: parsedVideo?.thumbnail_path || "https://i.pravatar.cc/100",
        }}
        onLoadStart={() => setVideoLoading(true)}
        onLoad={() => {
          console.log(
            `Video loaded for ID: ${parsedVideo?.id}, ${parsedVideo?.title}`
          );
          setVideoLoading(false);
        }}
        onError={(error) => {
          console.error("Video error:", error);
          setVideoLoading(false);
          const errorMessage = JSON.stringify(error);
          setVideoError(errorMessage);
          Alert.alert(
            "Video Error",
            `ID: ${parsedVideo?.id} (${parsedVideo?.title}) - Failed to play video.`
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 12,
    flex: 1,
  },
  videoView: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  videoLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  videoLoadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  videoErrorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
  },
  videoErrorText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
});

export default PlayVideo;
