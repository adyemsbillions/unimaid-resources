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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Message {
  id: string
  text: string
  sender: "user" | "admin"
  timestamp: string
}

const BASE_URL = "https://ilearn.lsfort.ng/"
const POLL_INTERVAL = 3000 // 3 seconds

const Support: React.FC = () => {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [username, setUsername] = useState("User")
  const [isTyping, setIsTyping] = useState(false)

  const flatListRef = useRef<FlatList>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  // === INITIAL LOAD ===
  useEffect(() => {
    const init = async () => {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) {
        router.replace("/login")
        return
      }

      // Load username
      try {
        const res = await fetch(`${BASE_URL}api/get_user.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
        const data = await res.json()
        if (data.success) setUsername(data.username || "User")
      } catch (e) {}

      // Load messages & start polling
      await loadMessages()
      startPolling()
    }

    init()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [router])

  // === POLLING FOR NEW MESSAGES ===
  const startPolling = () => {
    intervalRef.current = setInterval(() => {
      if (!isSending && !isTyping) {
        loadMessages(true) // silent update
      }
    }, POLL_INTERVAL)
  }

  // === LOAD MESSAGES FROM SERVER ===
  const loadMessages = async (silent = false) => {
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) return

      const response = await fetch(`${BASE_URL}api/get_chat_history.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()

      if (data.success && Array.isArray(data.messages)) {
        const newMessages: Message[] = data.messages.map((m: any) => ({
          id: String(m.id),
          text: m.text,
          sender: m.sender,
          timestamp: m.timestamp,
        }))

        if (!silent) {
          setMessages(newMessages)
          lastMessageIdRef.current = newMessages[newMessages.length - 1]?.id || null
          scrollToBottom()
          return
        }

        // === SILENT UPDATE: Append only new messages ===
        if (newMessages.length > messages.length) {
          const lastId = lastMessageIdRef.current
          const startIndex = lastId
            ? newMessages.findIndex((m) => m.id === lastId) + 1
            : messages.length

          const incoming = newMessages.slice(startIndex)
          if (incoming.length > 0) {
            setMessages((prev) => [...prev, ...incoming])
            lastMessageIdRef.current = newMessages[newMessages.length - 1].id
            scrollToBottom()
          }
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  // === SCROLL TO BOTTOM ===
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // === SEND MESSAGE ===
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    const userId = await AsyncStorage.getItem("userId")
    if (!userId) return

    const messageText = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    try {
      const response = await fetch(`${BASE_URL}api/me/reply.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: messageText,
          sender: "user",
        }),
      })
      const data = await response.json()

      if (data.success) {
        // Optimistic UI
        const tempId = `temp-${Date.now()}`
        const optimistic: Message = {
          id: tempId,
          text: messageText,
          sender: "user",
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimistic])
        lastMessageIdRef.current = tempId
        scrollToBottom()

        // Sync with server
        setTimeout(() => loadMessages(), 500)
      } else {
        alert(data.error || "Failed to send")
        setNewMessage(messageText)
      }
    } catch (error) {
      alert("Network error")
      setNewMessage(messageText)
    } finally {
      setIsSending(false)
    }
  }

  // === RENDER MESSAGE ===
  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.adminMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === "user" ? styles.userText : styles.adminText,
        ]}
      >
        {item.text}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Chat</Text>
        <View style={styles.iconButton} />
      </View>

      {/* Welcome */}
      <View style={styles.chatHeader}>
        <Text style={styles.welcomeText}>Hi {username},</Text>
        <Text style={styles.supportText}>How can we help you today?</Text>
      </View>

      {/* Messages */}
   <FlatList
  ref={flatListRef}
  data={messages}
  renderItem={renderMessage}
  keyExtractor={(item, index) => {
    const id = item.id && item.id !== '0' && item.id !== '' 
      ? item.id 
      : `msg-${index}-${Date.now()}`;
    return id;
  }}
  style={styles.messagesList}
  showsVerticalScrollIndicator={false}
  onContentSizeChange={scrollToBottom}
  ListEmptyComponent={
    <View style={styles.emptyChat}>
      <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Start a conversation</Text>
    </View>
  }
/>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            placeholder="Type your message..."
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <Ionicons name="hourglass-outline" size={20} color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  chatHeader: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  welcomeText: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 5 },
  supportText: { fontSize: 14, color: "#666" },
  messagesList: { flex: 1, padding: 16 },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: "80%",
  },
  userMessage: { backgroundColor: "#6B46C1", alignSelf: "flex-end" },
  adminMessage: { backgroundColor: "#E5E7EB", alignSelf: "flex-start" },
  messageText: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  userText: { color: "#fff" },
  adminText: { color: "#333" },
  timestamp: { fontSize: 10, color: "#999", alignSelf: "flex-end" },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: { fontSize: 16, color: "#999", marginTop: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#6B46C1",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: "#ccc" },
})

export default Support