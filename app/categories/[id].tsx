import EditCategoryScreen from '@/screens/categories/edit';
import { useLocalSearchParams } from 'expo-router';

export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditCategoryScreen id={id} />;
}
