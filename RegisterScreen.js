import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState('');
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const navigation = useNavigation();

  // Cargar roles al iniciar la pantalla
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setFetchingRoles(true);
      const { data, error } = await supabase
        .from('roles')
        .select('id, nombre_rol')
        .order('nombre_rol');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error al obtener roles:', error.message);
      setErrorRegistro('Error al cargar roles disponibles');
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleSubmit = async () => {
    if (!nombreUsuario.trim()) {
      setErrorRegistro('Por favor ingresa un nombre de usuario');
      return;
    }

    try {
      setLoading(true);
      setErrorRegistro(null);
      console.log("Verificando si el usuario existe:", nombreUsuario);

      // Verificar si el nombre de usuario ya existe
      const { data: usuariosExistentes, error: errorExistente } = await supabase
        .from('users')
        .select('*')
        .eq('nombre_usuario', nombreUsuario);

      if (errorExistente) {
        console.error("Error al verificar usuario existente:", errorExistente);
        throw errorExistente;
      }

      if (usuariosExistentes && usuariosExistentes.length > 0) {
        setErrorRegistro('El nombre de usuario ya existe.');
        return;
      }

      console.log("Insertando nuevo usuario:", nombreUsuario, "con rol:", selectedRol || "sin rol");
      
      // Insertar el nuevo usuario con rol
      const { data, error: errorInsert } = await supabase
        .from('users')
        .insert([{ 
          nombre_usuario: nombreUsuario,
          rol_id: selectedRol || null  // Convertir string vacío a null para la BD
        }])
        .select();

      if (errorInsert) {
        console.error("Error al insertar usuario:", errorInsert);
        throw errorInsert;
      }

      // Obtener el ID del usuario recién insertado
      const newUserId = data[0]?.id;
      const newUser = { 
        id: newUserId,
        nombre_usuario: nombreUsuario,
        rol_id: selectedRol || null 
      };

      // Actualizar la lista global (usando un contexto global o almacenamiento)
      // Por ejemplo, si tienes un contexto UserContext:
      // userContext.addUser(newUser);

      console.log("Usuario registrado con éxito:", data);
      setRegistroExitoso(true);
      setErrorRegistro(null);
      setNombreUsuario('');
      setSelectedRol('');
      
      // Navegar a la lista de tareas después de un registro exitoso
      setTimeout(() => {
        navigation.navigate('TaskListScreen');
      }, 1500);
    } catch (error) {
      console.error('Error al registrar usuario:', error.message);
      setErrorRegistro(`Error: ${error.message}`);
      setRegistroExitoso(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Usuario</Text>
      
      {registroExitoso && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>¡Registro exitoso! Redirigiendo...</Text>
        </View>
      )}
      
      {errorRegistro && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorRegistro}</Text>
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
          {fetchingRoles ? (
            <ActivityIndicator size="small" color="#f4511e" />
          ) : (
            <Picker
              selectedValue={selectedRol}
              onValueChange={(itemValue) => setSelectedRol(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="-- Sin rol asignado --" value="" />
              {roles.map((rol) => (
                <Picker.Item 
                  key={rol.id} 
                  label={rol.nombre_rol} 
                  value={rol.id} 
                />
              ))}
            </Picker>
          )}
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
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.link}
        onPress={() => navigation.navigate('UserListScreen')}
      >
        <Text style={styles.linkText}>Ver todos los usuarios</Text>
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
    paddingVertical: 5,
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
  successBox: {
    backgroundColor: '#dff2bf',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#4f8a10',
    textAlign: 'center',
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
  link: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 16,
  },
});