import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface TabBarIconProps {
  route: {
    name: string;
  };
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, color, size }) => {
  let iconName: keyof typeof MaterialIcons.glyphMap = 'home';

  switch (route.name) {
    case 'Home':
      iconName = 'home';
      break;
    case 'CreatePost':
      iconName = 'add-circle';
      break;
    case 'Profile':
      iconName = 'person';
      break;
    default:
      iconName = 'home';
  }

  return <MaterialIcons name={iconName} size={size} color={color} />;
};

export default TabBarIcon; 