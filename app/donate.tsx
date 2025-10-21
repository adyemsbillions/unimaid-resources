"use client"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, Switch, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as WebBrowser from "expo-web-browser"
import * as ImagePicker from "expo-image-picker"

const BASE_URL = "https://uresources.cravii.ng/"

const Donate = () => {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("paystack")
  const [image, setImage] = useState(null)

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId")
        if (!userId) {
          console.log("No user logged in, navigating to /login")
          router.replace("/login")
        }
      } catch (error) {
        console.error("Error checking login status:", error)
        Alert.alert("Error", "Failed to check login status")
      }
    }
    checkLoginStatus()
  }, [router])

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Please allow access to your photo library")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5
    })

    if (!result.canceled) {
      const formData = new FormData()
      formData.append('image', {
        uri: result.assets[0].uri,
        name: `donor_image.${result.assets[0].uri.split('.').pop()}`,
        type: `image/${result.assets[0].uri.split('.').pop()}`
      })

      try {
        const response = await fetch(`${BASE_URL}api/upload_image.php`, {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" }
        })
        const responseText = await response.text()
        console.log("Image Upload Response:", responseText)
        const data = JSON.parse(responseText)
        if (data.success) {
          setImage(data.image_url)
          Alert.alert("Success", "Image uploaded successfully")
        } else {
          Alert.alert("Error", data.error || "Failed to upload image")
        }
      } catch (error) {
        console.error("Image Upload Error:", error)
        Alert.alert("Error", "Failed to upload image")
      }
    }
  }

  const handleDonate = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId")
      if (!userId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        Alert.alert("Error", "Please enter a valid amount")
        return
      }
      if (!isAnonymous && !image) {
        Alert.alert("Error", "Please upload an image or choose to donate anonymously")
        return
      }

      const response = await fetch(`${BASE_URL}api/submit_donation.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId),
          amount: parseFloat(amount),
          isAnonymous,
          paymentMethod,
          image: isAnonymous ? 'https://i.pravatar.cc/100?img=1' : image
        })
      })
      const responseText = await response.text()
      console.log("Donation API Response:", responseText)
      try {
        const data = JSON.parse(responseText)
        if (data.success) {
          if (paymentMethod === "paystack") {
            const result = await WebBrowser.openBrowserAsync(data.payment_url)
            if (result.type === "cancel") {
              Alert.alert("Payment Cancelled", "You cancelled the payment process")
            } else {
              Alert.alert("Payment Initiated", "Please complete the payment in the browser")
            }
          } else {
            Alert.alert(
              "Bank Transfer Details",
              `Please transfer ₦${parseFloat(amount).toLocaleString()} to:\n` +
              `Bank: ${data.bank_details.bank_name}\n` +
              `Account Name: ${data.bank_details.account_name}\n` +
              `Account Number: ${data.bank_details.account_number}\n` +
              `Sort Code: ${data.bank_details.sort_code}`
            )
          }
          router.push("/library")
        } else {
          Alert.alert("Error", data.error || "Failed to process donation")
        }
      } catch (e) {
        console.error("Donation JSON Parse Error:", e)
        Alert.alert("Error", "Invalid donation response from server")
      }
    } catch (error) {
      console.error("Error submitting donation:", error)
      Alert.alert("Error", "Failed to submit donation")
    }
  }

  const handleBack = () => {
    router.push("/library")
    console.log("Back pressed, navigating to /library")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donate</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Donation Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Donate Anonymously</Text>
          <Switch
            value={isAnonymous}
            onValueChange={(value) => {
              setIsAnonymous(value)
              if (value) setImage(null)
            }}
            trackColor={{ false: "#E5E7EB", true: "#6B46C1" }}
            thumbColor={isAnonymous ? "#fff" : "#fff"}
          />
        </View>

        {!isAnonymous && (
          <View style={styles.imageContainer}>
            <Text style={styles.label}>Upload Image</Text>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={24} color="#666" />
                <Text style={styles.uploadButtonText}>Choose Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[styles.paymentButton, paymentMethod === "paystack" && styles.paymentButtonActive]}
            onPress={() => setPaymentMethod("paystack")}
          >
            <Text style={[styles.paymentButtonText, paymentMethod === "paystack" && styles.paymentButtonTextActive]}>
              Paystack
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentButton, paymentMethod === "bank_transfer" && styles.paymentButtonActive]}
            onPress={() => setPaymentMethod("bank_transfer")}
          >
            <Text style={[styles.paymentButtonText, paymentMethod === "bank_transfer" && styles.paymentButtonTextActive]}>
              Bank Transfer
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleDonate}>
          <Text style={styles.submitButtonText}>Donate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  iconButton: {
    padding: 5,
  },
  formContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 10,
  },
  paymentOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  paymentButtonActive: {
    borderColor: "#6B46C1",
    backgroundColor: "#EDE9FE",
  },
  paymentButtonText: {
    fontSize: 14,
    color: "#333",
  },
  paymentButtonTextActive: {
    color: "#6B46C1",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#6B46C1",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default Donate