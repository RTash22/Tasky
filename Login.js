import React, { useState, useEffect } from 'react';
import { View, Text, Button, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import { supabase, supabaseUrl } from './supabaseClient';
import * as AuthSession from 'expo-auth-session';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Configura el clientId dependiendo de la plataforma (Android o Web)
  const clientId = Platform.select({
    android: '267826938859-topi0d8jp5uju6522fb2mmrvn2ubff7r.apps.googleusercontent.com',
    web: '267826938859-r2k0e8r50cl06vvru9m4kvgsm2mvq0k1.apps.googleusercontent.com',
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientId,
  });

  // Maneja la respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      signInWithGoogle(id_token);
    }
  }, [response]);

  // Inicia sesión con el token de Google en Supabase
  const signInWithGoogle = async (idToken) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) throw error;
      setUser(data.user);
      console.log("Inicio de sesión exitoso:", data.user);
    } catch (error) {
      console.error('Error al iniciar sesión', error.message);
      alert('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Tasky</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#f4511e" />
      ) : (
        
        <Button
          title="Iniciar sesión con Google"
          disabled={!request}
          onPress={() => promptAsync()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});