"use client"
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useState, useEffect } from "react"

const TakeQuiz = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`http://192.168.103.38/unimaidresourcesquiz/api/get_questions.php?course_id=${id}`)
        const data = await response.json()
        setQuestions(data)
      } catch (error) {
        console.error("Error fetching questions:", error)
      }
    }
    fetchQuestions()
  }, [id])

  const handleAnswerSelect = (questionId, option) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    let correctCount = 0
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct_option) {
        correctCount++
      }
    })
    setScore(correctCount)
    setShowResults(true)
  }

  const handleBack = () => {
    router.back()
    console.log("Back pressed, navigating to previous screen")
  }

  const currentQuestion = questions[currentQuestionIndex]

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

      {questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No questions available</Text>
        </View>
      ) : showResults ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Quiz Results</Text>
          <Text style={styles.scoreText}>Score: {score} / {questions.length}</Text>
          {questions.map((question, index) => (
            <View key={question.id} style={styles.resultItem}>
              <Text style={styles.resultQuestion}>{index + 1}. {question.question_text}</Text>
              <Text style={styles.resultAnswer}>
                Your Answer: {selectedAnswers[question.id] || "Not answered"}
              </Text>
              <Text style={styles.resultCorrect}>
                Correct Answer: {question.correct_option}
              </Text>
              <Text style={styles.resultExplanation}>
                Explanation: {question.explanation || "No explanation provided"}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back to Quizzes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {currentQuestionIndex + 1}. {currentQuestion?.question_text}
          </Text>
          <View style={styles.optionsContainer}>
            {["option_a", "option_b", "option_c", "option_d"].map((opt, index) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestion?.id] === String.fromCharCode(65 + index)
                    ? styles.selectedOption
                    : null
                ]}
                onPress={() => handleAnswerSelect(currentQuestion.id, String.fromCharCode(65 + index))}
              >
                <Text style={styles.optionText}>
                  {String.fromCharCode(65 + index)}. {currentQuestion?.[opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
            {currentQuestionIndex < questions.length - 1 ? (
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
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#333",
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: "#8B5CF6",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  navButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  resultAnswer: {
    fontSize: 14,
    color: "#666",
  },
  resultCorrect: {
    fontSize: 14,
    color: "#2ecc71",
  },
  resultExplanation: {
    fontSize: 14,
    color: "#666",
  },
  backButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
})

export default TakeQuiz