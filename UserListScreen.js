import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { supabase } from './supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function UserListScreen() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState({});
  const [deleting, setDeleting] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUsers();
      fetchRoles();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.nombre_usuario.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_usuario, rol_id')
        .order('nombre_usuario');

      if (error) throw error;
      console.log("Usuarios cargados:", data?.length);
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, nombre_rol');

      if (error) throw error;
      
      const rolesObj = {};
      data.forEach(role => {
        rolesObj[role.id] = role.nombre_rol;
      });
      
      setRoles(rolesObj);
    } catch (error) {
      console.error('Error fetching roles:', error.message);
    }
  }

  const getRoleName = (rolId) => {
    return roles[rolId] || "Sin rol asignado";
  };

  const handleEdit = (userId) => {
    console.log("Navegando a editar usuario con ID:", userId);
    navigation.navigate('EditUserScreen', { userId });
  };

  const handleDelete = (userId, userName) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro que deseas eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            
            // Verificar relaciones
            const relations = await checkUserRelations(userId);
            
            if (relations.error) {
              Alert.alert("Error", "No se pudieron verificar las relaciones del usuario: " + relations.error);
              setDeleting(false);
              return;
            }
            
            if (relations.hasRelations) {
              Alert.alert(
                "Usuario con tareas asignadas", 
                `Este usuario tiene ${relations.taskAssignments} tarea(s) asignada(s). ¿Deseas eliminar todas las asignaciones y al usuario?`,
                [
                  { text: "Cancelar", style: "cancel", onPress: () => setDeleting(false) },
                  { 
                    text: "Eliminar todo", 
                    style: "destructive",
                    onPress: () => deleteUserWithRelations(userId) 
                  }
                ]
              );
            } else {
              // No hay relaciones, proceder con eliminación simple
              deleteUser(userId);
            }
          }
        }
      ]
    );
  };

  // Versión simplificada para IDs numéricos
  const deleteUser = async (userId) => {
    try {
      console.log("=== INICIO PROCESO DE ELIMINACIÓN ===");
      console.log("ID de usuario a eliminar:", userId);
      
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();
      
      console.log("Resultado de eliminación:", error ? "Error" : "Éxito");
      
      if (error) {
        console.error("Error al eliminar usuario:", error);
        Alert.alert("Error", "No se pudo eliminar el usuario: " + error.message);
        throw error;
      }
      
      console.log("Usuario eliminado:", data);
      actualizarInterfaz(userId);
      console.log("=== FIN PROCESO DE ELIMINACIÓN ===");
    } catch (error) {
      console.error("ERROR:", error);
      Alert.alert("Error", "Ocurrió un error al eliminar el usuario: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Versión simplificada para eliminar usuario con relaciones
  const deleteUserWithRelations = async (userId) => {
    try {
      console.log("=== INICIO ELIMINACIÓN EN CASCADA ===");
      console.log("ID de usuario a eliminar con relaciones:", userId);
      
      // 1. Eliminar asignaciones de tareas
      console.log("Eliminando asignaciones de tareas...");
      const { data: assignmentsData, error: assignError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('user_id', userId)
        .select();
      
      if (assignError) {
        console.error("Error al eliminar asignaciones:", assignError);
        throw assignError;
      }
      
      console.log("Asignaciones eliminadas:", assignmentsData?.length || 0);
      
      // 2. Eliminar el usuario
      console.log("Eliminando usuario...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();
      
      if (userError) {
        console.error("Error al eliminar usuario:", userError);
        throw userError;
      }
      
      console.log("Usuario eliminado:", userData);
      
      // Actualizar interfaz
      actualizarInterfaz(userId);
      console.log("=== FIN ELIMINACIÓN EN CASCADA ===");
    } catch (error) {
      console.error("ERROR EN ELIMINACIÓN CASCADA:", error);
      Alert.alert("Error", "No se pudieron eliminar todos los registros: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Función para verificar relaciones (simplificada para IDs numéricos)
  const checkUserRelations = async (userId) => {
    try {
      const { data: taskAssignments, error: taskError } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('user_id', userId);
        
      if (taskError) throw taskError;
      
      return {
        hasRelations: taskAssignments && taskAssignments.length > 0,
        taskAssignments: taskAssignments?.length || 0,
        createdTasks: 0 // Mantenemos por compatibilidad
      };
    } catch (error) {
      console.error("Error verificando relaciones:", error);
      return { error: error.message };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuario..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('RegisterScreen')}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading || deleting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f4511e" />
          <Text style={styles.loadingText}>
            {deleting ? "Eliminando usuario..." : "Cargando usuarios..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? "No se encontraron usuarios que coincidan con la búsqueda" : "No hay usuarios registrados"}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.nombre_usuario}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{getRoleName(item.rol_id)}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(item.id)}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewTasksButton]}
                  onPress={() => Alert.alert("Tareas", "Ver tareas de este usuario (en desarrollo)")}
                >
                  <Text style={styles.buttonText}>Ver tareas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id, item.nombre_usuario)}
                >
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#f4511e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  roleText: {
    fontSize: 14,
    color: '#555',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  editButton: {
    backgroundColor: '#2196f3',
  },
  viewTasksButton: {
    backgroundColor: '#4caf50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  }
});