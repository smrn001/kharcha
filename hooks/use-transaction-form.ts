import { useCategories } from '@/hooks/use-categories';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { getTransactionById, createTransaction, updateTransaction } from '@/lib/db/transactions';
import { ensureDefaultAccount } from '@/lib/db/accounts';
import { minorUnitsToInput, parseAmountToMinorUnits } from '@/lib/format';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import type { TransactionType } from '@/types';

/**
 * All state and save/load logic for the add/edit transaction form. Wrapped in
 * a hook so `screens/transaction-form` stays declarative and readable.
 */
export function useTransactionForm(editingId: string | null) {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const { t } = useI18n();

  const [type, setType] = useState<TransactionType>(settings.defaultTransactionType);
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refetches whenever `type` changes so the picker only shows matching categories.
  const { categories } = useCategories(type);

  useEffect(() => {
    if (!editingId) {
      let active = true;
      ensureDefaultAccount(db)
        .then((account) => {
          if (active) setAccountId(account.id);
        })
        .catch((error) => {
          // Without this, `accountId` stays null and saving fails later with a
          // generic "accounts" message that gives no clue about the cause.
          console.warn('[kharcha] ensureDefaultAccount failed', error);
        });
      return () => {
        active = false;
      };
    }
    let active = true;
    getTransactionById(db, editingId).then((transaction) => {
      if (!active || !transaction) return;
      setType(transaction.type);
      setAmountInput(minorUnitsToInput(transaction.amount));
      setCategoryId(transaction.categoryId ?? null);
      setAccountId(transaction.accountId);
      setTitle(transaction.title ?? '');
      setNote(transaction.note ?? '');
      setDate(new Date(transaction.date));
      setLoadingEdit(false);
    });
    return () => {
      active = false;
    };
  }, [db, editingId]);

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setCategoryId(null);
  };

  const handleAmountChange = (input: string) => {
    setAmountInput(input.replace(/[^0-9.]/g, ''));
  };

  const handleSave = async () => {
    const amount = parseAmountToMinorUnits(amountInput);
    if (amount === null || amount <= 0) {
      setError(t('add.errAmount'));
      return;
    }
    if (!categoryId) {
      setError(t('add.errCategory'));
      return;
    }
    if (!accountId) {
      setError(t('add.errAccounts'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        amount,
        accountId,
        categoryId,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        date: date.toISOString(),
      };
      if (editingId) {
        await updateTransaction(db, editingId, payload);
      } else {
        await createTransaction(db, payload);
      }
      void hapticSuccess();
      router.back();
    } catch {
      void hapticError();
      setError(t('add.errSave'));
      setSaving(false);
    }
  };

  return {
    type,
    amountInput,
    categoryId,
    accountId,
    title,
    note,
    date,
    loadingEdit,
    saving,
    error,
    categories,
    currency: settings.currency,
    setCategoryId,
    setTitle,
    setNote,
    setDate,
    handleTypeChange,
    handleAmountChange,
    handleSave,
  };
}