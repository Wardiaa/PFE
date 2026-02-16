import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  color?: string;
  className?: string;
}

const AppIcon: React.FC<IconProps> = ({ name, size = 20, color, className = '' }) => {
  const IconComponent = Icons[name] as React.ElementType;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} color={color} className={className} />;
};

export default AppIcon;