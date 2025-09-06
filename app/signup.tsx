"use client"
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Image, Dimensions, TextInput, ScrollView, Alert } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"

const { width, height } = Dimensions.get("window")

export default function SignupScreen() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [department, setDepartment] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async () => {
    try {
      const response = await fetch("http://192.168.50.38/unimaidresourcesquiz/api/signup.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          department,
          phoneNumber,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert("Success", data.message, [
          { text: "OK", onPress: () => router.push("/login") },
        ])
      } else {
        Alert.alert("Error", data.error || "Something went wrong")
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred")
      console.error("Signup error:", error)
    }
  }

  const handleLogin = () => {
    router.push("/login")
    console.log("Navigating to /login")
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Image with Gradient Overlay */}
      <View style={styles.backgroundContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
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
              <TextInput
                style={styles.input}
                placeholder="Department"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={department}
                onChangeText={setDepartment}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

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
})