import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Main from './Main';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen 
          name="Main" 
          component={Main}
          options={{
            headerShown: false // Esto oculta la barra de navegación superior
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}