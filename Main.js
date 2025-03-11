import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TodoListScreen from './TodoListScreen';

const Stack = createStackNavigator();

function Main() {
  return (
    <Stack.Navigator initialRouteName="TodoList">
      <Stack.Screen 
        name="TodoList" 
        component={TodoListScreen} 
        options={{ 
          title: 'Lista de Tareas',
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      {/* Aquí puedes agregar más pantallas si es necesario */}
    </Stack.Navigator>
  );
}

export default Main;