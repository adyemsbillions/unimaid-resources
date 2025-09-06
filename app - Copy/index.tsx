"use client"
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Image, Dimensions } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

const { width, height } = Dimensions.get("window")

export default function OnboardingScreen() {
  const router = useRouter()

  const handleStartQuiz = () => {
    router.push("/quiz")
    console.log("Start Quiz pressed, navigating to /quiz")
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

      {/* Background Image with Enhanced Overlay */}
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

      <View style={styles.content}>
        {/* Logo/Brand Area */}
        <View style={styles.brandContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>FluentWave</Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <View style={styles.textContainer}>
            <Text style={styles.mainText}>Your Quiz Journey{"\n"}Starts Here</Text>
            <Text style={styles.subText}>
              Test your skills with engaging quizzes and{"\n"}conquer every challenge that comes your way
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartQuiz} activeOpacity={0.9}>
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.gradientButton}>
                <Text style={styles.primaryButtonText}>Start Quiz</Text>
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

        {/* Bottom Indicator */}
        <View style={styles.bottomIndicator}>
          <View style={styles.indicatorDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
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
    marginBottom: 60,
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
  bottomIndicator: {
    alignItems: "center",
    marginTop: 20,
  },
  indicatorDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeDot: {
    backgroundColor: "#8B5CF6",
    width: 24,
  },
})
