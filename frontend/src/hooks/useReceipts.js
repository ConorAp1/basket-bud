import { useState, useCallback } from 'react';
import { getReceipts, getReceiptById } from '../services/api';
import { useReceiptStore } from '../store';

export function useReceipts() {
  const { receipts, setReceipts } = useReceiptStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReceipts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReceipts(params);
      setReceipts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setReceipts]);

  return { receipts, loading, error, fetchReceipts };
}

export function useReceiptDetail(id) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReceipt = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReceiptById(id);
      setReceipt(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { receipt, loading, error, fetchReceipt };
}
