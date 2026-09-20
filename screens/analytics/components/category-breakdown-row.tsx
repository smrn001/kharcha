import { Icon, ListItem } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { categoryDisplayName } from '@/lib/i18n';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount } from '@/lib/format';
import type { CategorySpending } from '@/lib/db/analytics-queries';

// Single section row — map directly under FieldGroup.Section.
export function CategoryBreakdownRow({
  currency,
  category,
}: {
  currency: string;
  category: CategorySpending;
}) {
  const { lang } = useI18n();
  return (
    <ListItem
      leading={<Icon name={categoryIcon(category.icon)} size={18} />}
      children={categoryDisplayName(category, lang)}
      supportingText={`${formatAmount(category.amount, currency)} · ${category.percentage}%`}
    />
  );
}