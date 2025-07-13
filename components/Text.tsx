import { Text as DefaultText, TextProps as DefaultTextProps } from 'react-native';

export function Text(props: DefaultTextProps) {
  return (
    <DefaultText
      {...props}
      style={[{ fontFamily: 'Righteous' }, props.style]}
    />
  );
} 