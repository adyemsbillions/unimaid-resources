"use client";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://uresources.cravii.ng/";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch images (same as OnboardingScreen)
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BASE_URL}api/get_slide_images.php`);
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          const formattedImages = data.map((item) => {
            // Clean up legacy URLs
            let cleanUrl = item.image_url
              .replace("http://192.168.218.38/unimaidresourcesquiz/api/uploads/", "")
              .replace("uploads/", "")
              .replace(/^\//, "");
            return {
              id: item.id,
              image_url: `${BASE_URL}api/uploads/${cleanUrl}`,
            };
          });
          setImages(formattedImages);
          // Preload images
          formattedImages.forEach((image) => Image.prefetch(image.image_url));
        } else {
          console.error("Error fetching images:", data.error || "Invalid response");
          Alert.alert("Error", data.error || "Failed to fetch images");
          setImages([]);
        }
      } catch (error) {
        console.error("Network error fetching images:", error);
        Alert.alert("Error", "Network error occurred while fetching images");
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Slideshow animation
  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * images.length);
        } while (newIndex === currentImageIndex && images.length > 1);
        setCurrentImageIndex(newIndex);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [images, currentImageIndex, fadeAnim]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BASE_URL}api/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("userId", data.userId.toString());
        setModalVisible(true);
      } else {
        Alert.alert("Error", data.error || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
      console.error("Login error:", error);
    }
  };

  const handleSignup = () => {
    router.push("/signup");
    console.log("Navigating to /signup");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    router.push("/dashboard");
  };

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo/Brand Area */}
          <View style={styles.brandContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>Unimaid Resources</Text>
            </View>
          </View>

          {/* Main Content Area */}
          <View style={styles.mainContent}>
            <View style={styles.textContainer}>
              <Text style={styles.mainText}>Welcome Back</Text>
              <Text style={styles.subText}>Log in to continue your quiz journey</Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={togglePasswordVisibility}>
                  <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.9}>
                <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.gradientButton}>
                  <Text style={styles.primaryButtonText}>Log In</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.authContainer}>
                <Text style={styles.authPrompt}>Don't have an account?</Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSignup} activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.modalGradient}>
              <Text style={styles.modalIcon}>✅</Text>
              <Text style={styles.modalTitle}>Login Successful!</Text>
              <Text style={styles.modalMessage}>You're ready to continue your quiz journey.</Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleModalClose}>
                <Text style={styles.modalButtonText}>Go to Dashboard</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 10,
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
    color: "#8B5CF6",
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
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: width * 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: "#FFFFFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  passwordContainer: {
    position: "relative",
    width: width * 0.8,
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 12,
    padding: 10,
  },
  eyeIcon: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 20,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalGradient: {
    padding: 24,
    alignItems: "center",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
  },
});