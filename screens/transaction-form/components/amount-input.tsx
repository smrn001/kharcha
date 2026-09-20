import { FormCard } from '@/components/form-card';
import { useTheme } from '@/lib/theme';
import { Text as RNText, TextInput as RNTextInput, View } from 'react-native';

export function AmountInput({
  title,
  currency,
  value,
  onValueChange,
}: {
  title: string;
  currency: string;
  value: string;
  onValueChange: (input: string) => void;
}) {
  const colors = useTheme();
  return (
    <FormCard title={title}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <RNText style={{ fontSize: 24, fontWeight: '600', color: colors.primary }}>
          {currency}
        </RNText>
        <RNTextInput
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onValueChange}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          textAlignVertical="center"
          style={{
            flex: 1,
            height: 64,
            paddingVertical: 0,
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
          }}
        />
      </View>
    </FormCard>
  );
}