import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validateField(field: string, values?: { pw?: string; cpw?: string }) {
    const pw = values?.pw ?? password;
    const cpw = values?.cpw ?? confirmPassword;

    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];

      if (field === 'email') {
        if (!email.trim()) next.email = 'Email is required';
        else if (!validateEmail(email.trim())) next.email = 'Enter a valid email address';
      }

      if (field === 'password') {
        if (!pw) next.password = 'Password is required';
        else if (pw.length < 8) next.password = 'Password must be at least 8 characters';
        // Re-validate confirm if it was already touched
        if (touched.confirmPassword && cpw) {
          delete next.confirmPassword;
          if (pw !== cpw) next.confirmPassword = 'Passwords do not match';
        }
      }

      if (field === 'confirmPassword') {
        if (!cpw) next.confirmPassword = 'Please confirm your password';
        else if (pw !== cpw) next.confirmPassword = 'Passwords do not match';
      }

      return next;
    });
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    setTouched({ email: true, password: true, confirmPassword: true });
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setErrors({});
    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (err: any) {
      const raw = err?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join('\n')
        : raw || err?.message || 'Registration failed';
      setErrors({ api: String(message) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Cupidora</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Email"
            placeholderTextColor="#b0a3a8"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (touched.email) validateField('email');
            }}
            onBlur={() => handleBlur('email')}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {errors.email ? (
          <Text style={styles.fieldError}>{errors.email}</Text>
        ) : null}

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              errors.password ? styles.inputError : null,
            ]}
            placeholder="Password"
            placeholderTextColor="#b0a3a8"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (touched.password) validateField('password', { pw: v });
            }}
            onBlur={() => handleBlur('password')}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#b0a3a8"
            />
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <Text style={styles.fieldError}>{errors.password}</Text>
        ) : null}

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              errors.confirmPassword ? styles.inputError : null,
            ]}
            placeholder="Confirm password"
            placeholderTextColor="#b0a3a8"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              if (touched.confirmPassword) validateField('confirmPassword', { cpw: v });
            }}
            onBlur={() => handleBlur('confirmPassword')}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirm(!showConfirm)}
          >
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#b0a3a8"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? (
          <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
        ) : null}

        {errors.api ? <Text style={styles.errorText}>{errors.api}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    color: '#e8566d',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#b0a3a8',
    marginBottom: 36,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#faf5f6',
    borderWidth: 1,
    borderColor: '#f0e0e3',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#d94452',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  fieldError: {
    color: '#d94452',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  errorText: {
    color: '#d94452',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e8566d',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    color: '#b0a3a8',
    fontSize: 15,
  },
  linkBold: {
    color: '#e8566d',
    fontWeight: '600',
  },
});
