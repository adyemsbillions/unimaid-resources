"use client"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "https://ilearn.lsfort.ng/"

const TakeQuiz = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [showSelection, setShowSelection] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerInterval, setTimerInterval] = useState(null)
  const [username, setUsername] = useState("Guest")
  const [questionCount, setQuestionCount] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId")
        if (userId) {
          const userResponse = await fetch(`${BASE_URL}api/get_user.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: parseInt(userId) }),
          })
          const userData = await userResponse.json()
          if (userResponse.ok && userData.success) {
            setUsername(userData.username || "Guest")
          }
        }

        const response = await fetch(`${BASE_URL}api/get_questions.php?course_id=${id}`)
        const text = await response.text()
        console.log("Questions API Response:", text, "Status:", response.status)
        let data
        try {
          data = JSON.parse(text)
        } catch (e) {
          console.error("Questions JSON Parse Error:", e)
          Alert.alert("Error", "Invalid response from server")
          setIsLoading(false)
          return
        }
        if (response.ok && Array.isArray(data)) {
          setQuestions(data)
        } else {
          Alert.alert("Error", data.error || "Failed to fetch questions")
          setQuestions([])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        Alert.alert("Error", `Network error: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (showResults || showSelection || selectedQuestions.length === 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          Alert.alert("Time's Up!", "Moving to next question")
          if (currentQuestionIndex < selectedQuestions.length - 1) {
            handleNext()
          } else {
            handleSubmit()
          }
          return 30
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)

    return () => clearInterval(interval)
  }, [currentQuestionIndex, showResults, showSelection, selectedQuestions.length])

  useEffect(() => {
    if (!showResults && !showSelection && selectedQuestions.length > 0) {
      setTimeLeft(30)
    }
  }, [currentQuestionIndex])

  const handleQuestionCountSelect = () => {
    const count = parseInt(questionCount)
    if (isNaN(count) || count < 1 || count > questions.length) {
      Alert.alert("Invalid Input", `Please enter a number between 1 and ${questions.length}`)
      return
    }
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, count)
    setSelectedQuestions(shuffled)
    setShowSelection(false)
    setCurrentQuestionIndex(0)
    setQuestionCount("")
  }

  const handleAnswerSelect = (questionId, option) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    let correctCount = 0
    selectedQuestions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correct_option) {
        correctCount++
      }
    })
    setScore(correctCount)
    setShowResults(true)
    if (timerInterval) clearInterval(timerInterval)

    try {
      const userId = await AsyncStorage.getItem("userId")
      if (userId) {
        const response = await fetch(`${BASE_URL}api/save_quiz_result.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: parseInt(userId),
            courseId: parseInt(id),
            score: correctCount,
            totalQuestions: selectedQuestions.length,
          }),
        })
        const result = await response.json()
        if (!result.success) {
          console.error("Failed to save quiz result:", result.error)
        }
      }
    } catch (error) {
      console.error("Error saving quiz result:", error)
    }
  }

  const handleBack = () => {
    if (showSelection) {
      router.back()
    } else if (showResults) {
      setShowResults(false)
      setShowSelection(true)
      setSelectedAnswers({})
      setCurrentQuestionIndex(0)
      setScore(0)
    } else {
      setShowSelection(true)
    }
    console.log("Back pressed")
    if (timerInterval) clearInterval(timerInterval)
  }

  const getOptionText = (question, option) => {
    if (!option) return "Not answered"
    switch (option) {
      case "A":
        return question.option_a || "Option A"
      case "B":
        return question.option_b || "Option B"
      case "C":
        return question.option_c || "Option C"
      case "D":
        return question.option_d || "Option D"
      default:
        return "Invalid option"
    }
  }

  const getGrade = (score, total) => {
    const percentage = (score / total) * 100
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const getBadge = (score, total) => {
    const percentage = (score / total) * 100
    if (percentage >= 90) return { icon: "trophy", color: "#FFD700", text: "Top Student" }
    if (percentage >= 80) return { icon: "medal", color: "#C0C0C0", text: "Excellent" }
    if (percentage >= 70) return { icon: "ribbon", color: "#CD7F32", text: "Good Job" }
    return { icon: "help-circle", color: "#666", text: "Keep Trying" }
  }

  const currentQuestion = selectedQuestions[currentQuestionIndex]

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={48} color="#6B46C1" />
          <Text style={styles.emptyText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No questions available</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (showSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#6B46C1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Questions</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>
            Enter number of questions (1 to {questions.length})
          </Text>
          <TextInput
            style={styles.input}
            value={questionCount}
            onChangeText={setQuestionCount}
            keyboardType="numeric"
            placeholder="e.g., 5"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.selectionButton, !questionCount && styles.disabledButton]}
            onPress={handleQuestionCountSelect}
            disabled={!questionCount}
          >
            <Text style={styles.selectionButtonText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Quiz</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      {!showResults ? (
        <View style={styles.quizContainer}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {selectedQuestions.length} • Time: {timeLeft}s
            </Text>
          </View>
          <ScrollView style={styles.questionScroll}>
            <Text style={styles.questionText}>
              {currentQuestionIndex + 1}. {currentQuestion?.question_text || "No question text"}
            </Text>
            <View style={styles.optionsContainer}>
              {["option_a", "option_b", "option_c", "option_d"].map((opt, index) => {
                const optionLetter = String.fromCharCode(65 + index)
                const isSelected = selectedAnswers[currentQuestion?.id] === optionLetter
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionButton, isSelected ? styles.selectedOption : null]}
                    onPress={() => handleAnswerSelect(currentQuestion.id, optionLetter)}
                  >
                    <Text
                      style={[styles.optionText, isSelected ? styles.selectedOptionText : null]}
                    >
                      {optionLetter}. {currentQuestion?.[opt] || "N/A"}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
            {currentQuestionIndex < selectedQuestions.length - 1 ? (
              <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                <Text style={styles.navButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.navButton} onPress={handleSubmit}>
                <Text style={styles.navButtonText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <ScrollView style={styles.resultsScroll}>
          <View style={styles.resultsOverview}>
            <Text style={styles.resultsTitle}>
              {score / selectedQuestions.length >= 0.8 ? "Great Job" : "Well Done"}, {username}!
            </Text>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreText}>Score: {score} / {selectedQuestions.length}</Text>
              <Text style={styles.percentageText}>
                {Math.round((score / selectedQuestions.length) * 100)}%
              </Text>
              <Text style={styles.gradeText}>Grade: {getGrade(score, selectedQuestions.length)}</Text>
              <View style={styles.badgeContainer}>
                <Ionicons
                  name={getBadge(score, selectedQuestions.length).icon}
                  size={48}
                  color={getBadge(score, selectedQuestions.length).color}
                />
                <Text style={styles.badgeText}>{getBadge(score, selectedQuestions.length).text}</Text>
              </View>
            </View>
          </View>
          {selectedQuestions.map((question, index) => {
            const userAnswer = selectedAnswers[question.id]
            const isCorrect = userAnswer === question.correct_option
            return (
              <View
                key={question.id}
                style={[styles.resultItem, !isCorrect && styles.incorrectItem]}
              >
                <Text style={styles.resultQuestion}>
                  {index + 1}. {question.question_text || "No question text"}
                </Text>
                <Text
                  style={[
                    styles.resultAnswer,
                    isCorrect ? styles.correctAnswer : styles.incorrectAnswer,
                  ]}
                >
                  Your Answer: {getOptionText(question, userAnswer)}
                </Text>
                <Text style={styles.resultCorrect}>
                  Correct Answer: {getOptionText(question, question.correct_option)}
                </Text>
                {question.explanation && (
                  <Text style={styles.resultExplanation}>
                    Explanation: {question.explanation}
                  </Text>
                )}
              </View>
            )
          })}
          <View style={styles.resultsButtonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setShowResults(false)
                setShowSelection(true)
                setSelectedAnswers({})
                setCurrentQuestionIndex(0)
                setScore(0)
              }}
            >
              <Text style={styles.backButtonText}>Retry Quiz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  headerPlaceholder: {
    width: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#333",
  },
  selectionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    width: 200,
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  selectionButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  selectionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  quizContainer: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  questionScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "500",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  navButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  resultsScroll: {
    flex: 1,
  },
  resultsOverview: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  scoreCard: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    width: "100%",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 20,
    color: "#6B46C1",
    fontWeight: "600",
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
    marginBottom: 12,
  },
  badgeContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incorrectItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  resultQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  resultAnswer: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  correctAnswer: {
    color: "#2ecc71",
    fontWeight: "500",
  },
  incorrectAnswer: {
    color: "#e74c3c",
    fontWeight: "500",
  },
  resultCorrect: {
    fontSize: 14,
    color: "#2ecc71",
    fontWeight: "500",
    marginBottom: 5,
  },
  resultExplanation: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    backgroundColor: "#f0f8ff",
    padding: 8,
    borderRadius: 5,
  },
  resultsButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
})

export default TakeQuiz