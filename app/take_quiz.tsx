"use client"
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, ScrollView, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState, useEffect } from "react"

const COLORS = {
  primary: "#6366F1",
  success: "#10b981",
  danger: "#ef4444",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
}

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string
}

export default function TakeQuizPage() {
  const { course_id, title } = useLocalSearchParams<{ course_id: string; title: string }>()
  const router = useRouter()
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: string}>({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [questionCount, setQuestionCount] = useState("")
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    if (!course_id) return

    fetch(`https://ilearn.lsfort.ng/api/fetch_quiz.php?course_id=${course_id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setAllQuestions(json.data)
        }
      })
      .catch(() => Alert.alert("Error", "Failed to load quiz"))
      .finally(() => setLoading(false))
  }, [course_id])

  const startQuiz = () => {
    const num = parseInt(questionCount)
    if (isNaN(num) || num < 1 || num > allQuestions.length) {
      Alert.alert("Invalid", `Enter a number between 1 and ${allQuestions.length}`)
      return
    }

    let selected = allQuestions.sort(() => Math.random() - 0.5).slice(0, num)

    selected = selected.map((q: Question) => {
      const opts = [
        { key: 'a', text: q.option_a },
        { key: 'b', text: q.option_b },
        { key: 'c', text: q.option_c },
        { key: 'd', text: q.option_d }
      ].filter(o => o.text?.trim())

      opts.sort(() => Math.random() - 0.5)
      const newQ: any = { ...q }

      opts.forEach((opt, i) => {
        const letter = ['a','b','c','d'][i]
        newQ[`option_${letter}`] = opt.text
        if (opt.key === q.correct_answer.toLowerCase()) {
          newQ.correct_answer = letter.toUpperCase()
        }
      })

      return newQ
    })

    setQuestions(selected)
    setShowQuiz(true)
  }

  const handleAnswer = (qid: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [qid]: answer }))
  }

  const submitQuiz = () => {
    let correct = 0
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++
    })
    setScore(correct)
    setSubmitted(true)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loading}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!showQuiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.startCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="book" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.quizTitle}>{title}</Text>
            <Text style={styles.available}>Available questions: {allQuestions.length}</Text>

            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder={`1 - ${allQuestions.length}`}
              value={questionCount}
              onChangeText={setQuestionCount}
              placeholderTextColor={COLORS.textSecondary}
            />

            <TouchableOpacity style={styles.startBtn} onPress={startQuiz}>
              <Ionicons name="play" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.startText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100)
    const grade = percentage >= 90 ? "A1" : percentage >= 80 ? "B2" : percentage >= 70 ? "B3" : percentage >= 60 ? "C4" : percentage >= 50 ? "C6" : "F9"

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <View style={styles.resultCard}>
            <View style={styles.scoreContainer}>
              <Text style={styles.bigScore}>{score}</Text>
              <Text style={styles.scoreSlash}>/</Text>
              <Text style={styles.scoreDenom}>{questions.length}</Text>
            </View>
            
            <Text style={[styles.grade, {color: percentage >= 70 ? COLORS.success : COLORS.danger}]}>{grade}</Text>
            <Text style={styles.percentage}>{percentage}%</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="close-circle" size={32} color={COLORS.danger} />
                <Text style={styles.statValue}>{questions.length - score}</Text>
                <Text style={styles.statLabel}>Wrong</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="help-circle" size={32} color={COLORS.textSecondary} />
                <Text style={styles.statValue}>{questions.length - Object.keys(answers).length}</Text>
                <Text style={styles.statLabel}>Skipped</Text>
              </View>
            </View>

            <View style={styles.review}>
              <Text style={styles.reviewTitle}>📋 Detailed Review</Text>
              {questions.map((q, i) => {
                const user = answers[q.id]
                const correct = q.correct_answer
                const isCorrect = user === correct

                return (
                  <View key={q.id} style={[styles.qReview, isCorrect ? styles.correctBorder : user ? styles.wrongBorder : styles.skippedBorder]}>
                    <Text style={styles.qText}>Q{i+1}: {q.question_text}</Text>
                    {user && <Text style={styles.answerLine}>Your answer: <Text style={isCorrect ? styles.correct : styles.wrong}>{user}. {q[`option_${user.toLowerCase()}`]}</Text></Text>}
                    {!user && <Text style={styles.skipped}>Not answered</Text>}
                    <Text style={styles.answerLine}>Correct: <Text style={styles.correct}>{correct}. {q[`option_${correct.toLowerCase()}`]}</Text></Text>
                    {q.explanation && <Text style={styles.exp}><Text style={styles.expTitle}>💡 </Text>{q.explanation}</Text>}
                  </View>
                )
              })}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.shareBtn} onPress={() => {
                const msg = `I scored ${score}/${questions.length} (${percentage}%) - ${grade} in "${title}" on LSFORT.ng! 🚀\nJoin here: https://lsfort.ng`
                Alert.alert("Shared!", msg)
              }}>
                <Ionicons name="share-social" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.shareText}>Share Result</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.backText}>Back to Topics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>{current + 1}/{questions.length}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Text style={styles.qnum}>Question {current + 1} of {questions.length}</Text>
        <Text style={styles.question}>{q.question_text}</Text>

        <View style={styles.options}>
          {['A','B','C','D'].map(letter => {
            const opt = letter.toLowerCase()
            if (!q[`option_${opt}`]) return null
            const isSelected = answers[q.id] === letter
            return (
              <TouchableOpacity
                key={letter}
                style={[styles.option, isSelected && styles.selected]}
                onPress={() => handleAnswer(q.id, letter)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionBadge, isSelected && styles.selectedBadge]}>
                  <Text style={[styles.optionLetter, isSelected && styles.selectedLetter]}>{letter}</Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.selectedText]}>{q[`option_${opt}`]}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.nav}>
          <TouchableOpacity onPress={() => setCurrent(Math.max(0, current-1))} disabled={current===0} style={[styles.navBtn, current===0 && styles.disabled]}>
            <Ionicons name="chevron-back" size={20} color={current===0 ? "#b0b9c6" : "white"} />
            <Text style={[styles.navText, current===0 && { color: "#b0b9c6" }]}>Previous</Text>
          </TouchableOpacity>
          {current === questions.length - 1 ? (
            <TouchableOpacity onPress={submitQuiz} style={styles.submitBtn}>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setCurrent(current+1)} style={styles.nextBtn}>
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  loading: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  
  startCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 24, 
    padding: 32, 
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: { 
    alignItems: "center", 
    marginBottom: 24,
    width: 80,
    height: 80,
    backgroundColor: "#f0f4ff",
    borderRadius: 20,
    justifyContent: "center",
    alignSelf: "center",
  },
  
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e5e7eb",
  },
  headerBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text, flex: 1, marginLeft: 12 },
  progressIndicator: { 
    backgroundColor: "#f0f4ff", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
  },
  progressText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  
  progressSection: { 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progress: { height: 6, backgroundColor: "#e5e7eb", flex: 1, borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  progressPercent: { fontSize: 12, fontWeight: "600", color: COLORS.primary, minWidth: 35 },
  
  questionContainer: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  qnum: { fontSize: 14, fontWeight: "600", color: COLORS.primary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  question: { fontSize: 18, fontWeight: "600", marginBottom: 28, lineHeight: 28, color: COLORS.text },
  
  options: { gap: 12, marginBottom: 32 },
  option: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: COLORS.surface, 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selected: { 
    backgroundColor: "#eef2ff", 
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  selectedBadge: { backgroundColor: COLORS.primary },
  optionLetter: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  selectedLetter: { color: "white" },
  optionText: { fontSize: 15, flex: 1, color: COLORS.text, lineHeight: 22 },
  selectedText: { color: COLORS.primary, fontWeight: "500" },
  
  nav: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 32 },
  navBtn: { 
    flex: 1,
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    backgroundColor: "#94a3b8", 
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtn: { 
    flex: 1,
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtn: { 
    flex: 1,
    backgroundColor: COLORS.success, 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabled: { backgroundColor: "#cbd5e1", opacity: 0.6 },
  navText: { color: "white", fontWeight: "600", textAlign: "center", fontSize: 15 },
  nextText: { color: "white", fontWeight: "600", fontSize: 16 },
  submitText: { color: "white", fontWeight: "600", fontSize: 16 },
  
  resultScroll: { paddingVertical: 20, paddingHorizontal: 16 },
  resultCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreContainer: { 
    alignItems: "center", 
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  bigScore: { fontSize: 72, fontWeight: "900", color: COLORS.primary },
  scoreSlash: { fontSize: 40, fontWeight: "300", color: COLORS.textSecondary, marginHorizontal: 4 },
  scoreDenom: { fontSize: 48, fontWeight: "700", color: COLORS.textSecondary },
  grade: { fontSize: 56, fontWeight: "900", textAlign: "center", marginBottom: 12 },
  percentage: { fontSize: 28, textAlign: "center", color: COLORS.text, fontWeight: "600", marginBottom: 28 },
  
  statsRow: { flexDirection: "row", justifyContent: "space-around", gap: 12, marginVertical: 28 },
  statCard: { 
    flex: 1,
    alignItems: "center", 
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: { fontSize: 28, fontWeight: "800", color: COLORS.primary, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, fontWeight: "500" },
  
  review: { marginTop: 28, backgroundColor: "#f9fafb", padding: 20, borderRadius: 16, marginBottom: 20 },
  reviewTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  qReview: { 
    backgroundColor: "white", 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  correctBorder: { borderLeftColor: COLORS.success },
  wrongBorder: { borderLeftColor: COLORS.danger },
  skippedBorder: { borderLeftColor: "#94a3b8", backgroundColor: "#f8fafc" },
  qText: { fontSize: 14, marginBottom: 12, fontWeight: "600", color: COLORS.text },
  answerLine: { fontSize: 13, marginVertical: 6, color: COLORS.text, lineHeight: 20 },
  correct: { color: COLORS.success, fontWeight: "700" },
  wrong: { color: COLORS.danger, fontWeight: "700" },
  skipped: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 13 },
  exp: { backgroundColor: "#f0fdf4", padding: 12, borderRadius: 10, marginTop: 10, fontSize: 13, lineHeight: 20, color: "#166534" },
  expTitle: { fontWeight: "700", color: COLORS.success },
  
  actionButtons: { gap: 12 },
  shareBtn: { 
    backgroundColor: "#25d366", 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { color: "white", fontWeight: "700", fontSize: 15 },
  backBtn: { 
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  
  quizTitle: { fontSize: 26, fontWeight: "900", color: COLORS.primary, textAlign: "center", marginBottom: 16 },
  available: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 28, textAlign: "center", fontWeight: "500" },
  input: { 
    fontSize: 20, 
    fontWeight: "700", 
    textAlign: "center", 
    backgroundColor: "#f9fafb", 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 2, 
    borderColor: COLORS.primary, 
    marginBottom: 28,
    color: COLORS.text,
  },
  startBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  startText: { color: "white", fontWeight: "700", fontSize: 16, textAlign: "center" },
})
