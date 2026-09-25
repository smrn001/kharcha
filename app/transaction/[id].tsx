import TransactionDetailScreen from '@/screens/transaction-detail';
import { useLocalSearchParams } from 'expo-router';

export default function TransactionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionDetailScreen id={id} />;
}
