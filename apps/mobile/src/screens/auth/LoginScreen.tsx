import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../auth/authStore";

export default function LoginScreen() {
  const nav = useNavigation<any>();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: unknown) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.inner}>
        <Text style={styles.logo}>Moveee</Text>
        <Text style={styles.tagline}>Connect with your community</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.btn, (!email || !password) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnLabel}>Log in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nav.navigate("Register")} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  logo: { fontSize: 36, fontWeight: "800", color: "#14110d", marginBottom: 6, textAlign: "center" },
  tagline: { fontSize: 15, color: "#9e9e9e", marginBottom: 32, textAlign: "center" },
  input: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    fontSize: 15, marginBottom: 12, color: "#14110d",
    borderWidth: 1, borderColor: "#e0d8cc",
  },
  btn: { backgroundColor: "#14110d", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 8 },
  btnDisabled: { backgroundColor: "#ccc" },
  btnLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#9e9e9e", fontSize: 14 },
  linkBold: { color: "#b38238", fontWeight: "600" },
});
