"use client"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: string
  loading?: boolean
}

type Language = "en" | "fr" | "ha"

const TRANSLATIONS = {
  en: {
    chooseLang: "Please choose your language:",
    contactPrompt: "You're so brave. Please share your **email** and **phone number** (e.g., name@example.com 08012345678)\nA professional will contact you in under 30 minutes.",
    contactThanks: "Thank you. A professional will contact you shortly.\nYou're not alone. You're strong.",
    startNew: "Start New Chat",
  },
  fr: {
    chooseLang: "Veuillez choisir votre langue :",
    contactPrompt: "Vous êtes courageux. Veuillez partager votre **email** et **numéro de téléphone** (ex. nom@exemple.com 08012345678)\nUn professionnel vous contactera sous 30 minutes.",
    contactThanks: "Merci. Un professionnel vous contactera bientôt.\nVous n'êtes pas seul. Vous êtes fort.",
    startNew: "Nouvelle conversation",
  },
  ha: {
    chooseLang: "Zaɓi harshenku:",
    contactPrompt: "Kuna da ƙarfin hali. Da fatan za ku raba **email** da **lambar waya** (misali: sunan@misali.com 08012345678)\nƙwararre zai tuntuɓe ku cikin minti 30.",
    contactThanks: "Na gode. ƙwararre zai tuntuɓe ku nan ba da jimawa ba.\nBa ku kaɗai ba. Kuna da ƙarfi.",
    startNew: "Fara Sabon Tattaunawa",
  },
}

// === DIRECT GEMINI CALL (NO PHP) ===
const GEMINI_KEY = "AIzaSyDwxxzhjFQnOT0BH8VoIc31htO6kJJv3h4"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`
export default function Support() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lang, setLang] = useState<Language>("en")
  const [context, setContext] = useState("")
  const [showInput, setShowInput] = useState(false)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [exchangeCount, setExchangeCount] = useState(0)

  const flatListRef = useRef<FlatList>(null)

  // Load saved session
  useEffect(() => {
    const init = async () => {
      const saved = await AsyncStorage.getItem("support_session")
      if (saved) {
        const { id, messages: m, language, ctx, count } = JSON.parse(saved)
        setSessionId(id)
        setLang(language || "en")
        setContext(ctx || "")
        setExchangeCount(count || 0)
        setMessages(m)
        if (m.length > 1) setShowInput(true)
      } else {
        startNewChat()
      }
    }
    init()
  }, [])

  // Start fresh chat
  const startNewChat = async () => {
    const id = `chat-${Date.now()}`
    setSessionId(id)
    setLang("en")
    setContext("")
    setExchangeCount(0)
    setShowInput(false)
    setInput("")

    const msg: Message = {
      id: `g-${Date.now()}`,
      text: TRANSLATIONS.en.chooseLang,
      sender: "bot",
      timestamp: new Date().toISOString(),
    }
    setMessages([msg])
    await save(id, [msg], "en", "", 0)
    scrollToBottom()
  }

  // Language selection
  const selectLanguage = async (value: Language) => {
    setLang(value)
    updateContext(`Language: ${value}`)

    const greeting = value === "en"
      ? "Hi, I'm here to support you. You're safe. How can I help?"
      : value === "fr"
      ? "Bonjour, je suis là pour vous soutenir. Vous êtes en sécurité. Comment puis-je aider ?"
      : "Sannu, ina nan don taimaka muku. Kuna cikin aminci. Yaya zan taimaka?"

    const botMsg: Message = {
      id: `b-${Date.now()}`,
      text: greeting,
      sender: "bot",
      timestamp: new Date().toISOString(),
    }
    const updated = [messages[0], botMsg]
    setMessages(updated)
    setShowInput(true)
    await save(sessionId!, updated, value, context, 0)
    scrollToBottom()
  }

const sendMessage = async () => {
  if (!input.trim() || isTyping) return

  const userMsg: Message = {
    id: `u-${Date.now()}`,
    text: input,
    sender: "user",
    timestamp: new Date().toISOString(),
  }
  const updated = [...messages, userMsg]
  setMessages(updated)
  setInput("")
  await save(sessionId!, updated, lang, context, exchangeCount)
  scrollToBottom()

  const typing: Message = {
    id: `t-${Date.now()}`,
    text: "",
    sender: "bot",
    timestamp: new Date().toISOString(),
    loading: true,
  }
  setMessages(prev => [...prev, typing])
  setIsTyping(true)
  scrollToBottom()

  const systemPrompt = lang === "en"
    ? "You are SafeSpace Bot, a compassionate, trauma-informed AI in Nigeria. Answer in clear English, under 80 words. Use **bold** for actions. Never give medical advice. If user is in danger, say: Call **112** now."
    : lang === "fr"
    ? "Vous êtes SafeSpace Bot, un assistant compatissant. Répondez en français clair, <80 mots. **Gras** pour actions. Urgence : Appelez **112** maintenant."
    : "Kai SafeSpace Bot ne, mai taimako mai tausayi. Amsa a Hausa mai sauƙi, <80 kalma. **Bold** don ayyuka. Gaggawa: Kirayi **112** yanzu."

  const prompt = [
    { role: "model", parts: [{ text: systemPrompt + "\nContext: " + context }] },
    { role: "user", parts: [{ text: input }] }
  ]

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: prompt })
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here for you."

    const botMsg: Message = {
      id: `b-${Date.now()}`,
      text: reply,
      sender: "bot",
      timestamp: new Date().toISOString(),
    }
    const final = updated.filter(m => !m.loading).concat(botMsg)
    setMessages(final)
    updateContext(`User: ${input} | Bot: ${reply}`)
    const newCount = exchangeCount + 1
    setExchangeCount(newCount)
    await save(sessionId!, final, lang, context, newCount)
    scrollToBottom()

    if (newCount >= 3 && !final.some(m => m.text.includes("email"))) {
      setTimeout(() => {
        const contactMsg: Message = {
          id: `c-${Date.now()}`,
          text: TRANSLATIONS[lang].contactPrompt,
          sender: "bot",
          timestamp: new Date().toISOString(),
        }
        const withContact = [...final, contactMsg]
        setMessages(withContact)
        save(sessionId!, withContact, lang, context, newCount)
      }, 2000)
    }
  } catch (e: any) {
    console.error("Direct Gemini error:", e)
    const errMsg: Message = {
      id: `e-${Date.now()}`,
      text: "Sorry, AI is busy. Try again in 10 seconds.",
      sender: "bot",
      timestamp: new Date().toISOString(),
    }
    const final = updated.filter(m => !m.loading).concat(errMsg)
    setMessages(final)
    await save(sessionId!, final, lang, context, exchangeCount)
    scrollToBottom()
  } finally {
    setIsTyping(false)
  }
}
  const updateContext = (info: string) =>
    setContext(prev => (prev + " | " + info).slice(-1200))

  const save = async (
    id: string,
    msgs: Message[],
    language: Language,
    ctx: string,
    count: number
  ) => {
    await AsyncStorage.setItem(
      "support_session",
      JSON.stringify({
        id,
        messages: msgs.filter(m => !m.loading),
        language,
        ctx,
        count,
      })
    )
  }

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user"
    const isLangSelect = item.text === TRANSLATIONS.en.chooseLang

    return (
      <View style={[styles.message, isUser ? styles.user : styles.bot]}>
        {!isUser && !isLangSelect && (
          <Text style={styles.botLabel}>SafeSpace Bot</Text>
        )}

        {item.loading ? (
          <ActivityIndicator size="small" color="#64748B" />
        ) : (
          <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
            {item.text}
          </Text>
        )}

        {isLangSelect && (
          <View style={styles.buttons}>
            {(["en", "fr", "ha"] as Language[]).map((l, i) => (
              <TouchableOpacity
                key={i}
                style={styles.btn}
                onPress={() => selectLanguage(l)}
              >
                <Text style={styles.btnText}>
                  {l === "en" ? "English" : l === "fr" ? "Français" : "Hausa"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!item.loading && (
          <Text style={styles.time}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.icon}>
          <Ionicons name="arrow-back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.title}>SafeSpace</Text>
        <TouchableOpacity onPress={startNewChat} style={styles.icon}>
          <Ionicons name="add-circle" size={26} color="#10B981" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={i => i.id}
        style={styles.list}
        onContentSizeChange={scrollToBottom}
      />

      {showInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={
                lang === "en"
                  ? "Type your message..."
                  : lang === "fr"
                  ? "Tapez votre message..."
                  : "Rubuta sakonku..."
              }
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              editable={!isTyping}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={isTyping || !input.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={input.trim() && !isTyping ? "#10B981" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

// YOUR EXACT ORIGINAL STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFBFD" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  icon: { padding: 6 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  message: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 20,
    maxWidth: "86%",
  },
  user: { backgroundColor: "#10B981", alignSelf: "flex-end" },
  bot: {
    backgroundColor: "#F8FAFC",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  botLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  text: { fontSize: 15, lineHeight: 21 },
  userText: { color: "#fff" },
  botText: { color: "#1E293B" },
  buttons: {
    marginTop: 10,
    gap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  btn: {
    backgroundColor: "#E0E7FF",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 8,
  },
  btnText: { fontSize: 14, color: "#4F46E5", fontWeight: "600" },
  time: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#F8FAFC",
  },
})