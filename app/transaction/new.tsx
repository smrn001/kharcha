import TransactionFormScreen from '@/screens/transaction-form';
import { useLocalSearchParams } from 'expo-router';

export default function NewTransactionRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <TransactionFormScreen editingId={id ?? null} />;
}