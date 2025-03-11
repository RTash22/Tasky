import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';

function TodoListScreen() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTodo }]);
      setNewTodo('');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={todos}
        renderItem={({ item }) => <Text>{item.text}</Text>}
        keyExtractor={(item) => item.id}
      />
      <TextInput
        placeholder="Nueva tarea"
        value={newTodo}
        onChangeText={setNewTodo}
      />
      <Button title="Agregar" onPress={addTodo} />
    </View>
  );
}

export default TodoListScreen;