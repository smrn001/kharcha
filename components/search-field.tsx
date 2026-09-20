import { NativeBlock } from '@/components/native-block';
import { Icon } from '@expo/ui';
import { useTheme } from '@/lib/theme';
import { SEARCH_ICON, X_ICON } from '@/lib/icons';
import { Pressable, TextInput, View } from 'react-native';

/** Pill-shaped search input with an optional clear button. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  const colors = useTheme();
  return (
    <View
      style={{
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 22,
        backgroundColor: colors.surfaceContainer,
        paddingHorizontal: 16,
      }}
    >
      <NativeBlock>
        <Icon name={SEARCH_ICON} size={16} color={colors.textSecondary} />
      </NativeBlock>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        textAlignVertical="center"
        style={{
          flex: 1,
          height: 44,
          paddingVertical: 0,
          fontSize: 15,
          color: colors.text,
        }}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <NativeBlock>
            <Icon name={X_ICON} size={16} color={colors.textSecondary} />
          </NativeBlock>
        </Pressable>
      ) : null}
    </View>
  );
}