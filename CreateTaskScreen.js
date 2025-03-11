import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabaseClient';

export default function CreateTaskScreen({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setFetchingUsers(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_usuario');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setFetchingUsers(false);
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(userId)) {
        // Si ya está seleccionado, lo quitamos
        return prevSelected.filter(id => id !== userId);
      } else {
        // Si no está seleccionado, lo agregamos
        return [...prevSelected, userId];
      }
    });
  };

  async function createTask() {
    if (!titulo.trim()) {
      alert('Por favor ingresa un título para la tarea');
      return;
    }
    
    if (selectedUsers.length === 0) {
      alert('Por favor selecciona al menos un usuario');
      return;
    }
    
    try {
      setLoading(true);
      
      // Primero insertar la tarea
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({ titulo, descripcion })
        .select();
      
      if (taskError) throw taskError;
      
      const taskId = taskData[0].id;
      
      // Luego crear las asignaciones para cada usuario seleccionado
      const assignments = selectedUsers.map(userId => ({
        task_id: taskId,
        user_id: userId,
        status: 2 // Pendiente
      }));
      
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert(assignments);
      
      if (assignmentError) throw assignmentError;

      // Crear objeto de tarea nueva con sus asignaciones
      const newTask = {
        id: taskId,
        titulo,
        descripcion,
        created_at: new Date().toISOString(),
        task_assignments: selectedUsers.map(userId => ({
          task_id: taskId,
          user_id: userId,
          status: 2 // Pendiente
        }))
      };

      // Si usas un contexto global o estado compartido:
      // taskContext.addTask(newTask);

      alert('Tarea creada con éxito');
      navigation.navigate({
        name: 'TaskListScreen',
        params: { newTask },
        merge: true,
      });
    } catch (error) {
      console.error('Error creating task:', error.message);
      alert('Error al crear la tarea: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Escribe el título de la tarea"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Describe la tarea en detalle"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Asignar a (selecciona uno o varios)</Text>
        
        {fetchingUsers ? (
          <ActivityIndicator size="small" color="#f4511e" />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.userItem,
                  selectedUsers.includes(item.id) && styles.userItemSelected
                ]}
                onPress={() => toggleUserSelection(item.id)}
              >
                <Text style={[
                  styles.userName,
                  selectedUsers.includes(item.id) && styles.userNameSelected
                ]}>
                  {item.nombre_usuario}
                </Text>
                
                {selectedUsers.includes(item.id) && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={createTask}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creando..." : "Crear Tarea"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  userItemSelected: {
    backgroundColor: '#f4511e',
    borderColor: '#f4511e',
  },
  userName: {
    fontSize: 16,
    color: '#333',
  },
  userNameSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#f8998b',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});