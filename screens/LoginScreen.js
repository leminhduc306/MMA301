import React, { useState, useContext } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  Pressable,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { AuthContext } from "../context/AuthContext"

const LoginScreen = ({ navigation }) => {
  const { login, error } = useContext(AuthContext)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password")
      return
    }

    try {
      setLoading(true)
      await login(email, password)
      // Close the login modal after successful login
      navigation.goBack()
    } catch (err) {
      Alert.alert("Login Failed", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={() => navigation.goBack()}>
      <Pressable
        style={styles.modalOverlay}
        onPress={() => navigation.goBack()}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color="#888" />
          </TouchableOpacity>

          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Musium</Text>
              <Text style={styles.subtitle}>Music is Life</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                disabled={loading}>
                <Text style={styles.link}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Register")}
                disabled={loading}>
                <Text style={styles.registerText}>
                  Don't have an account? Register
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#262626",
    borderRadius: 20,
  },
  container: {
    backgroundColor: "#1a1a1a",
  },
  header: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  input: {
    backgroundColor: "#262626",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#404040",
  },
  errorText: {
    color: "#FF6B6B",
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#1DB954",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#404040",
    marginVertical: 24,
  },
  registerButton: {
    paddingVertical: 12,
  },
  registerText: {
    color: "#888",
    textAlign: "center",
    fontSize: 14,
  },
})

export default LoginScreen
