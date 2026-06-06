import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api, CULTURE_API } from "../../api/client";

export default function RegisterScreen() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await api.post(`${CULTURE_API}/register`, { email, username, password }, false);
      nav.replace("VerifyEmail", { email });
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const valid = email.trim() && username.trim() && password.length >= 8;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.logo}>Moveee</Text>
          <Text style={styles.tagline}>Create your account</Text>

          <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="Password (min 8 chars)" secureTextEntry value={password} onChangeText={setPassword} />

          <TouchableOpacity
            style={[styles.btn, !valid && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={!valid || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnLabel}>Create account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => nav.goBack()} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24 },
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
