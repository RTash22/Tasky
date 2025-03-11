import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from './supabaseClient';
import { useNavigation } from '@react-navigation/native';

export default function TaskListScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      
      // Esta consulta obtiene tareas con información del usuario asignado
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
            users (
              id,
              nombre_usuario
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      alert('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 1: return "Completada";
      case 2: return "Pendiente";
      case 3: return "En progreso";
      default: return "Desconocido";
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Cargando tareas...</Text>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateTaskScreen')}
          >
            <Text style={styles.buttonText}>+ Nueva Tarea</Text>
          </TouchableOpacity>
          
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.taskItem}
                onPress={() => navigation.navigate('TaskDetailScreen', { taskId: item.id })}
              >
                <Text style={styles.taskTitle}>{item.titulo}</Text>
                <Text numberOfLines={2}>{item.descripcion}</Text>
                
                {item.task_assignments && item.task_assignments.length > 0 && (
                  <View style={styles.assignmentInfo}>
                    <View style={styles.assignedUsers}>
                      <Text style={styles.assignedToLabel}>
                        Asignado a: 
                      </Text>
                      {item.task_assignments.slice(0, 2).map((assignment, index) => (
                        <Text key={assignment.id} style={styles.userName}>
                          {assignment.users?.nombre_usuario}
                          {index < Math.min(item.task_assignments.length - 1, 1) ? ", " : ""}
                        </Text>
                      ))}
                      {item.task_assignments.length > 2 && (
                        <Text style={styles.userName}>
                          {` y ${item.task_assignments.length - 2} más`}
                        </Text>
                      )}
                    </View>
                    <Text style={[
                      styles.statusBadge,
                      { backgroundColor: item.task_assignments[0]?.status === 1 ? '#8bc34a' : '#ff9800' }
                    ]}>
                      {getStatusText(item.task_assignments[0]?.status)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  taskItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  assignmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  assignedUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  assignedToLabel: {
    fontWeight: 'bold',
  },
  userName: {
    marginLeft: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    color: 'white',
    fontWeight: 'bold',
  },
});