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
  Alert,
  Animated,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://uresources.cravii.ng/";

// Subjects from subjects.json
const JAMB_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Commerce",
  "Accounting",
  "Government",
  "Geography",
  "Literature in English",
  "Christian Religious Studies (CRS)",
  "Islamic Religious Studies (IRS)",
  "Agricultural Science",
  "History",
  "Civic Education",
  "Fine Arts",
  "Home Economics",
  "Technical Drawing",
  "Further Mathematics",
  "French",
  "Music",
  "Computer Studies",
];

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BASE_URL}api/get_slide_images.php`);
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          const formattedImages = data.map((item) => {
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

  // Handle subject selection
  const toggleSubject = (subject) => {
    if (subject === "English Language" && !selectedSubjects.includes("English Language")) {
      setSelectedSubjects([subject, ...selectedSubjects.filter((s) => s !== "English Language")]);
    } else if (selectedSubjects.includes(subject)) {
      if (subject !== "English Language") {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
      }
    } else if (selectedSubjects.length < 4) {
      setSelectedSubjects([...selectedSubjects, subject]);
    } else {
      Alert.alert("Limit Reached", "You can only select up to 4 subjects.");
    }
  };

  const handleSignup = async () => {
    console.log("Signup pressed, navigating to /signup");
    if (selectedSubjects.length !== 4) {
      Alert.alert("Error", "Please select exactly 4 subjects, including English Language.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}api/signup.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          department,
          phoneNumber,
          subjects: selectedSubjects,
        }),
      });

      // Log raw response for debugging
      const rawResponse = await response.text();
      console.log("Raw response:", rawResponse);

      // Attempt to parse JSON
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        console.error("JSON parse error:", e.message, rawResponse);
        Alert.alert("Error", "Invalid server response: " + e.message);
        return;
      }

      if (response.ok) {
        Alert.alert("Success", data.message, [
          { text: "OK", onPress: () => router.push("/login") },
        ]);
      } else {
        Alert.alert("Error", data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Network error occurred: " + error.message);
    }
  };

  const handleLogin = () => {
    router.push("/login");
    console.log("Navigating to /login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Render subject item
  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        selectedSubjects.includes(item) && styles.subjectItemSelected,
      ]}
      onPress={() => toggleSubject(item)}
    >
      <Text
        style={[
          styles.subjectText,
          selectedSubjects.includes(item) && styles.subjectTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

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
              <Text style={styles.mainText}>Join Unimaid Resources</Text>
              <Text style={styles.subText}>Create an account to start your quiz adventure</Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
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
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={toggleConfirmPasswordVisibility}>
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Department"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={department}
                onChangeText={setDepartment}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (Optional)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowSubjectModal(true)}
              >
                <Text
                  style={[
                    styles.input,
                    { color: selectedSubjects.length > 0 ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)" },
                  ]}
                >
                  {selectedSubjects.length > 0
                    ? selectedSubjects.join(", ")
                    : "Select 4 JAMB Subjects"}
                </Text>
              </TouchableOpacity>

              {/* Subject Selection Modal */}
              <Modal
                visible={showSubjectModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSubjectModal(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select 4 JAMB Subjects</Text>
                    <Text style={styles.modalSubtitle}>
                      English Language is mandatory. Select 3 additional subjects.
                    </Text>
                    <FlatList
                      data={JAMB_SUBJECTS}
                      renderItem={renderSubjectItem}
                      keyExtractor={(item) => item}
                      style={styles.subjectList}
                    />
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setShowSubjectModal(false)}
                    >
                      <Text style={styles.modalButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} activeOpacity={0.9}>
                <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.gradientButton}>
                  <Text style={styles.primaryButtonText}>Sign Up</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.authContainer}>
                <Text style={styles.authPrompt}>Already have an account?</Text>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin} activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 20,
    textAlign: "center",
  },
  subjectList: {
    marginBottom: 20,
  },
  subjectItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  subjectItemSelected: {
    backgroundColor: "rgba(139, 92, 246, 0.4)",
    borderColor: "#8B5CF6",
  },
  subjectText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  subjectTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});