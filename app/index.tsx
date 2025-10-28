"use client"
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Image, Dimensions, Animated, Alert, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window")
const BASE_URL = "https://ilearn.lsfort.ng/"

export default function OnboardingScreen() {
  const router = useRouter()
  const [images, setImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const fadeAnim = useRef(new Animated.Value(1)).current
  
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${BASE_URL}api/get_slide_images.php`)
        const data = await response.json()
        if (response.ok && Array.isArray(data)) {
          const formattedImages = data.map(item => ({
            id: item.id,
            image_url: `${BASE_URL}api/uploads/${item.image_url.startsWith('uploads/') ? item.image_url.replace('uploads/', '') : item.image_url}`
          }))
          setImages(formattedImages)
          // Preload images for smoother transitions
          formattedImages.forEach(image => Image.prefetch(image.image_url))
        } else {
          console.error("Error fetching images:", data.error || "Invalid response")
          Alert.alert("Error", data.error || "Failed to fetch images")
          setImages([])
        }
      } catch (error) {
        console.error("Network error fetching images:", error)
        Alert.alert("Error", "Network error occurred while fetching images")
        setImages([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchImages()
  }, [])

  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // Select a random index, ensuring it's different from the current index
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * images.length)
        } while (newIndex === currentImageIndex && images.length > 1)
        
        setCurrentImageIndex(newIndex)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start()
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [images, fadeAnim, currentImageIndex])

  const handleGetStarted = () => {
    router.push("/dashboard")
    console.log("Get Started pressed, navigating to /dashboard")
  }

  const handleSignup = () => {
    router.push("/signup")
    console.log("Signup pressed, navigating to /signup")
  }

  const handleLogin = () => {
    router.push("/login")
    console.log("Login pressed, navigating to /login")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Image with Fade Effect */}
      <View style={styles.backgroundContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading images...</Text>
          </View>
        ) : images.length > 0 ? (
          <Animated.Image
            source={{ uri: images[currentImageIndex].image_url }}
            style={[styles.backgroundImage, { opacity: fadeAnim }]}
            resizeMode="cover"
            onError={() => Alert.alert("Error", "Failed to load image")}
          />
        ) : (
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
            }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.content}>
        {/* Logo/Brand Area */}
        <View style={styles.brandContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Ilearn</Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <View style={styles.textContainer}>
            <Text style={styles.mainText}>Start Your Quiz</Text>
            <Text style={styles.subText}>Engage with fun quizzes and test your skills!</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted} activeOpacity={0.9}>
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.gradientButton}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.authContainer}>
              <Text style={styles.authPrompt}>Already have an account?</Text>
              <View style={styles.authButtons}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin} activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tertiaryButton} onPress={handleSignup} activeOpacity={0.8}>
                  <Text style={styles.tertiaryButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoPlaceholder: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  logoText: {
    color: "#CECBD5FF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 80,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  mainText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    width: width * 0.8,
    marginBottom: 32,
    borderRadius: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  authContainer: {
    alignItems: "center",
  },
  authPrompt: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  authButtons: {
    flexDirection: "row",
    gap: 16,
  },
  secondaryButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  secondaryButtonText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tertiaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  tertiaryButtonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
})