import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, FlatList } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import RegisterScreen from './RegisterScreen';
import TaskListScreen from './TaskListScreen';
import CreateTaskScreen from './CreateTaskScreen';
import TaskDetailScreen from './TaskDetailScreen';
import UserListScreen from './UserListScreen';
import EditUserScreen from './EditUserScreen';

const Stack = createStackNavigator();

// Componente para el botón del menú que estará en el encabezado
function MenuButton() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();
  
  // Opciones del menú con sus rutas e iconos
  const menuItems = [
    { 
      title: 'Registro de Usuario', 
      icon: 'person-outline',
      navigate: () => navigation.navigate('RegisterScreen') 
    },
    { 
      title: 'Mis Tareas', 
      icon: 'list-outline',
      navigate: () => navigation.navigate('TaskListScreen') 
    },
    { 
      title: 'Usuarios', 
      icon: 'people-outline',
      navigate: () => navigation.navigate('UserListScreen') 
    }
  ];
  
  return (
    <>
      <TouchableOpacity onPress={() => setMenuVisible(true)}>
        <Ionicons name="menu-outline" size={30} color="#fff" />
      </TouchableOpacity>
      
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <SafeAreaView style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.menu}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Tasky App</Text>
              </View>
              <FlatList
                data={menuItems}
                keyExtractor={(item) => item.title}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.menuItem} onPress={item.navigate}>
                    <Ionicons name={item.icon} size={24} color="#000" />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function Main() {
  return (
    <Stack.Navigator
      initialRouteName="RegisterScreen"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Añadir el botón de menú personalizado en el lado izquierdo del encabezado
        headerLeft: () => (
          <View style={{ marginLeft: 15 }}>
            <MenuButton />
          </View>
        ),
      }}
    >
      <Stack.Screen 
        name="RegisterScreen" 
        component={RegisterScreen}
        options={{ title: "Registro de Usuario" }}
      />
      <Stack.Screen 
        name="TaskListScreen" 
        component={TaskListScreen}
        options={{ title: "Mis Tareas" }}
      />
      <Stack.Screen 
        name="CreateTaskScreen" 
        component={CreateTaskScreen} 
        options={{ title: "Nueva Tarea" }}
      />
      <Stack.Screen 
        name="TaskDetailScreen" 
        component={TaskDetailScreen}
        options={{ title: "Detalle de Tarea" }}
      />
      <Stack.Screen 
        name="UserListScreen" 
        component={UserListScreen}
        options={{ title: "Usuarios" }}
      />
      <Stack.Screen 
        name="EditUserScreen" 
        component={EditUserScreen}
        options={{ title: "Editar Usuario" }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  menu: {
    padding: 20,
  },
  menuHeader: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default Main;