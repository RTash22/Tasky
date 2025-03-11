import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EditUserScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState('');  // Usa string vacío en lugar de null
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        console.log("Obteniendo información del usuario ID:", userId);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          console.log("Usuario cargado:", data);
          setNombreUsuario(data.nombre_usuario);
          // Asegurar que selectedRol no sea null o undefined
          setSelectedRol(data.rol_id !== null ? data.rol_id : '');
        }
      } catch (error) {
        console.error('Error fetching user:', error.message);
        Alert.alert('Error', 'No se pudo cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, nombre_rol')
        .order('nombre_rol');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error al obtener roles:', error.message);
    }
  };

  const handleSubmit = async () => {
    if (!nombreUsuario || !nombreUsuario.trim()) {
      Alert.alert('Error', 'Por favor ingrese un nombre de usuario');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error: errorUpdate } = await supabase
        .from('users')
        .update({ 
          nombre_usuario: nombreUsuario,
          rol_id: selectedRol === '' ? null : selectedRol  // Convertir string vacío a null para la BD
        })
        .eq('id', userId);
      
      if (errorUpdate) throw errorUpdate;
      
      Alert.alert(
        'Éxito', 
        'Usuario actualizado correctamente',
        [{ 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Usuario</Text>
      
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre de Usuario:</Text>
        <TextInput
          style={styles.input}
          value={nombreUsuario}
          onChangeText={setNombreUsuario}
          placeholder="Ingresa nombre de usuario"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Rol:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedRol || ''}  // Asegurar que nunca sea undefined
            onValueChange={(itemValue) => setSelectedRol(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="-- Sin rol asignado --" value="" />  {/* Usa string vacío en lugar de null */}
            {roles.map((rol) => (
              <Picker.Item 
                key={rol.id} 
                label={rol.nombre_rol} 
                value={rol.id} 
              />
            ))}
          </Picker>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Usuario</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#f8998b',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f4511e',
  },
  cancelButtonText: {
    color: '#f4511e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#ffbaba',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d8000c',
    textAlign: 'center',
  },
});