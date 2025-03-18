import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient';
import { Ionicons } from '@expo/vector-icons';

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [status, setStatus] = useState(2); // Default: Pendiente
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
    fetchUsers();
  }, [taskId]);

  async function fetchTaskDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, 
          titulo, 
          descripcion, 
          created_at,
          task_assignments (
            id,
            status,
            user_id,
            users (
              id,
              nombre_usuario
            )
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      
      setTask(data);
      
      // Extraer todos los usuarios asignados
      if (data.task_assignments && data.task_assignments.length > 0) {
        // Tomar el primer status como referencia (usualmente deberían ser todos iguales)
        setStatus(data.task_assignments[0].status || 2);
        
        // Extraer todos los IDs de usuarios asignados
        const assignedUserIds = data.task_assignments
          .filter(assignment => assignment.user_id)
          .map(assignment => assignment.user_id);
        
        setSelectedUsers(assignedUserIds);
      }
    } catch (error) {
      console.error('Error fetching task details:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la tarea');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_usuario');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  }

  async function updateTaskAssignment() {
    try {
      setUpdating(true);
      
      // Primero eliminamos todas las asignaciones existentes
      const { error: deleteError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);
      
      if (deleteError) throw deleteError;
      
      // Luego creamos nuevas asignaciones para todos los usuarios seleccionados
      const assignments = selectedUsers.map(userId => ({
        task_id: taskId,
        user_id: userId,
        status: status
      }));
      
      const { error: insertError } = await supabase
        .from('task_assignments')
        .insert(assignments);
      
      if (insertError) throw insertError;
      
      Alert.alert('Éxito', 'Tarea actualizada correctamente');
      fetchTaskDetails(); // Refresh task data
    } catch (error) {
      console.error('Error updating task:', error.message);
      Alert.alert('Error', 'No se pudo actualizar la tarea: ' + error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function updateTaskInfo() {
    try {
      if (!editedTitle || !editedTitle.trim()) {
        Alert.alert('Error', 'El título de la tarea es obligatorio');
        return;
      }
      
      setUpdating(true);
      
      // Actualizar la tarea en la base de datos
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          titulo: editedTitle,
          descripcion: editedDescription 
        })
        .eq('id', taskId);
      
      if (updateError) throw updateError;
      
      // Actualizar el estado local
      setTask(prev => ({
        ...prev,
        titulo: editedTitle,
        descripcion: editedDescription
      }));
      
      Alert.alert('Éxito', 'Información de la tarea actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar la tarea:', error.message);
      Alert.alert('Error', 'No se pudo actualizar la información: ' + error.message);
    } finally {
      setUpdating(false);
      setEditing(false); // Si tienes un estado para controlar el modo de edición
    }
  }

  async function deleteTask() {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro que deseas eliminar esta tarea? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              console.log("=== INICIO PROCESO DE ELIMINACIÓN DE TAREA ===");
              console.log("ID de tarea a eliminar (int):", taskId);
              
              // 1. Eliminar primero las asignaciones
              console.log("1. Eliminando asignaciones de tareas...");
              const { data: assignData, error: assignError } = await supabase
                .from('task_assignments')
                .delete()
                .eq('task_id', taskId)
                .select();
              
              if (assignError) {
                console.error("Error al eliminar asignaciones:", assignError);
                throw assignError;
              }
              
              console.log(`${assignData?.length || 0} asignaciones eliminadas`);
              
              // 2. Eliminar la tarea
              console.log("2. Eliminando tarea...");
              const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)
                .select();
              
              if (taskError) {
                console.error("Error al eliminar tarea:", taskError);
                throw taskError;
              }
              
              console.log("Tarea eliminada:", taskData);
              console.log("=== TAREA ELIMINADA EXITOSAMENTE ===");
              
              // Navegación de vuelta a la lista
              Alert.alert(
                'Éxito', 
                'Tarea eliminada correctamente',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    navigation.navigate({
                      name: 'TaskListScreen',
                      params: { deletedTaskId: taskId },
                      merge: true
                    });
                  } 
                }]
              );
            } catch (error) {
              console.error('Error al eliminar tarea:', error);
              
              // Si falló la eliminación, intentar con la API REST directa
              try {
                console.log("Intentando método alternativo: API REST");
                const apiKey = supabase.supabaseKey;
                const supabaseUrl = supabase.supabaseUrl;
                
                const response = await fetch(
                  `${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`,
                  {
                    method: 'DELETE',
                    headers: {
                      'apikey': apiKey,
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=representation'
                    }
                  }
                );
                
                if (response.ok) {
                  console.log("Eliminación exitosa con API REST");
                  Alert.alert(
                    'Éxito', 
                    'Tarea eliminada correctamente',
                    [{ 
                      text: 'OK', 
                      onPress: () => {
                        navigation.navigate({
                          name: 'TaskListScreen',
                          params: { deletedTaskId: taskId },
                          merge: true
                        });
                      } 
                    }]
                  );
                  return;
                } else {
                  throw new Error(`API REST respondió: ${response.status}`);
                }
              } catch (restError) {
                console.error("Error en método alternativo:", restError);
                Alert.alert('Error', 'No se pudo eliminar la tarea: ' + error.message);
              }
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  }

  const getStatusText = (statusCode) => {
    switch (statusCode) {
      case 1: return "Completada";
      case 2: return "Pendiente";
      case 3: return "En progreso";
      default: return "Desconocido";
    }
  };

  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case 1: return "#8bc34a"; // Green for completed
      case 2: return "#ff9800"; // Orange for pending
      case 3: return "#03a9f4"; // Blue for in progress
      default: return "#9e9e9e"; // Grey for unknown
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Task Details */}
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task?.titulo}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{getStatusText(status)}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{task?.descripcion || "Sin descripción"}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha de creación</Text>
        <Text>{new Date(task?.created_at).toLocaleDateString()}</Text>
      </View>
      
      {/* Assignment Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asignar a:</Text>
        <View style={styles.userList}>
          {users.map((user) => (
            <TouchableOpacity 
              key={user.id} 
              style={[
                styles.userSelectItem,
                selectedUsers.includes(user.id) && styles.userSelectItemSelected
              ]}
              onPress={() => {
                setSelectedUsers(prev => {
                  if (prev.includes(user.id)) {
                    // Si ya está seleccionado, lo quitamos
                    return prev.filter(id => id !== user.id);
                  } else {
                    // Si no está seleccionado, lo agregamos
                    return [...prev, user.id];
                  }
                });
              }}
            >
              <Text style={[
                styles.userSelectText,
                selectedUsers.includes(user.id) && styles.userSelectTextSelected
              ]}>
                {user.nombre_usuario}
              </Text>
              
              {selectedUsers.includes(user.id) && (
                <Text style={{color: "#fff", fontSize: 18, fontWeight: "bold"}}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          {users.length === 0 && (
            <Text style={styles.noDataText}>No hay usuarios disponibles</Text>
          )}
          
          {users.length > 0 && selectedUsers.length === 0 && (
            <Text style={styles.helperText}>Toca un usuario para asignarle la tarea</Text>
          )}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado</Text>
        <Picker
          selectedValue={status}
          onValueChange={(itemValue) => setStatus(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Pendiente" value={2} />
          <Picker.Item label="En progreso" value={3} />
          <Picker.Item label="Completada" value={1} />
        </Picker>
      </View>
      
      {/* Mostrar todos los usuarios asignados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asignado a:</Text>
        {task.task_assignments && task.task_assignments.length > 0 ? (
          task.task_assignments.map((assignment, index) => (
            <View key={assignment.id} style={styles.assignedUserItem}>
              <Text style={styles.assignedUserName}>
                {assignment.users?.nombre_usuario || "Usuario desconocido"}
              </Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(assignment.status) }
              ]}>
                <Text style={styles.statusText}>{getStatusText(assignment.status)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text>No asignado</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.updateButton]}
          onPress={updateTaskAssignment}
          disabled={updating}
        >
          <Text style={styles.buttonText}>
            {updating ? "Actualizando..." : "Actualizar Tarea"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]}
          onPress={deleteTask}
          disabled={updating}
        >
          <Text style={styles.buttonText}>Eliminar Tarea</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  description: {
    lineHeight: 22,
    fontSize: 16,
  },
  picker: {
    marginTop: -10,
    marginBottom: -10,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: '#f4511e',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  assignedUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignedUserName: {
    fontSize: 16,
  },
  userList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userSelectItem: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userSelectItemSelected: {
    backgroundColor: '#f4511e',
  },
  userSelectText: {
    fontSize: 16,
    marginRight: 10,
  },
  userSelectTextSelected: {
    color: '#fff',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  helperText: {
    fontSize: 14,
    color: '#999',
  },
});