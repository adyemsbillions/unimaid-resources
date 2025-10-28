"use client"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as WebBrowser from "expo-web-browser"

interface Quiz {
  id: number;
  title: string;
  num_questions: number;
}

interface PaymentData {
  success: boolean;
  payment_url?: string;
  reference?: string;
  error?: string;
}

interface StatusData {
  success: boolean;
  isPaid: boolean;
  error?: string;
}

const BASE_URL = "https://ilearn.lsfort.ng/"

const AllQuizzes: React.FC = () => {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isPaid, setIsPaid] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Use the provided Paystack public key (for reference only; not used client-side)
  const EMAIL = "user@example.com" // Get from user data or login
  const AMOUNT = 100000; // 1000 NGN in kobo


  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`${BASE_URL}api/get_quizzes.php`)
        const data: Quiz[] = await response.json()
        setQuizzes(data)
        setFilteredQuizzes(data)

        // Check payment status from AsyncStorage
        const paymentStatus = await AsyncStorage.getItem("isPaid")
        if (paymentStatus === "true") {
          setIsPaid(true)
          setFilteredQuizzes(data)
        } else {
          // Show only one quiz if not paid and check database status
          setFilteredQuizzes(data.slice(0, 1))
          const userId = await AsyncStorage.getItem("userId")
          if (userId) await checkPaymentStatus(parseInt(userId), null)
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error)
      }
    }
    fetchQuizzes()
  }, [])

  useEffect(() => {
    const filtered = quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (!isPaid) {
      setFilteredQuizzes(filtered.slice(0, 1)) // Limit to one quiz if not paid
    } else {
      setFilteredQuizzes(filtered)
    }
  }, [searchQuery, quizzes, isPaid])

  const handleBack = () => {
    router.back()
    console.log("Back pressed, navigating to previous screen")
  }

  const handleQuizPress = (quizId: number) => {
    router.push(`/takequiz/${quizId}`)
    console.log(`Quiz ${quizId} pressed, navigating to /takequiz/${quizId}`)
  }

  const initiatePayment = async () => {
    if (loading) return

    setLoading(true)
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) {
        Alert.alert("Error", "Please log in to make a payment")
        return
      }

      const response = await fetch(`${BASE_URL}api/submit_quiz_payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId),
          amount: AMOUNT,
          email: EMAIL,
        }),
      })
      const responseText = await response.text()
      console.log("Payment API Response:", responseText)
      try {
        const data: PaymentData = JSON.parse(responseText)
        if (data.success && data.payment_url) {
          const result = await WebBrowser.openBrowserAsync(data.payment_url)
          if (result.type === "cancel") {
            Alert.alert("Payment Cancelled", "You cancelled the payment process")
          } else {
            Alert.alert("Payment Initiated", "Please complete the payment in the browser")
            // Poll or wait for backend to update payment status with reference
            await checkPaymentStatus(parseInt(userId), data.reference)
          }
        } else {
          Alert.alert("Error", data.error || "Failed to initiate payment")
        }
      } catch (e) {
        console.error("Payment JSON Parse Error:", e)
        Alert.alert("Error", "Invalid payment response from server")
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      Alert.alert("Error", "Failed to initiate payment")
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async (userId: number, reference?: string | null) => {
    try {
      const response = await fetch(`${BASE_URL}api/check_payment_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data: StatusData = await response.json()
      if (data.success) {
        if (data.isPaid) {
          setIsPaid(true)
          const response = await fetch(`${BASE_URL}api/get_quizzes.php`)
          const quizData: Quiz[] = await response.json()
          setQuizzes(quizData)
          setFilteredQuizzes(quizData)
          await AsyncStorage.setItem("isPaid", "true")
          Alert.alert("Success", "Payment confirmed! All quizzes are now unlocked.")
        } else if (reference) {
          // Directly verify with Paystack if database shows unpaid
          const verifyResponse = await fetch(`${BASE_URL}api/verify_payment.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          })
          const verifyData: { success: boolean; error?: string } = await verifyResponse.json()
          if (verifyData.success) {
            setIsPaid(true)
            const response = await fetch(`${BASE_URL}api/get_quizzes.php`)
            const quizData: Quiz[] = await response.json()
            setQuizzes(quizData)
            setFilteredQuizzes(quizData)
            await AsyncStorage.setItem("isPaid", "true")
            Alert.alert("Success", "Payment confirmed! All quizzes are now unlocked.")
            // Update database via backend if needed
            await fetch(`${BASE_URL}api/update_payment_status.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference, userId }),
            })
          } else {
            setTimeout(() => checkPaymentStatus(userId, reference), 5000) // Retry every 5 seconds
          }
        } else {
          setTimeout(() => checkPaymentStatus(userId, reference), 5000) // Retry every 5 seconds
        }
      } else {
        Alert.alert("Error", data.error || "Failed to check payment status")
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <TouchableOpacity style={styles.quizCard} onPress={() => handleQuizPress(item.id)}>
      <View style={styles.quizCardHeader}>
        <Ionicons name="book" size={24} color="#4B40C3" />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <View style={styles.quizCardContent}>
        <Text style={styles.cardQuestions}>{item.num_questions} Questions</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Quizzes</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search quizzes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {!isPaid && (
        <TouchableOpacity style={[styles.payButton, loading && styles.payButtonDisabled]} onPress={initiatePayment} disabled={loading}>
          <Ionicons name={loading ? "hourglass-outline" : "card-outline"} size={20} color="#FFFFFF" />
          <Text style={styles.payButtonText}>
            {loading ? "Processing Payment..." : "Pay ₦1000 to Unlock All Quizzes"}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredQuizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.quizCards}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.noQuizzesText}>No quizzes available</Text>}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerPlaceholder: {
    width: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  quizCards: {
    justifyContent: "space-between",
    gap: 15,
  },
  quizCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 100,
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4B40C3",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  quizCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 8,
    flex: 1,
  },
  quizCardContent: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cardQuestions: {
    fontSize: 12,
    color: "#4B40C3",
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: "#4B40C3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noQuizzesText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 20,
  },
})

export default AllQuizzes