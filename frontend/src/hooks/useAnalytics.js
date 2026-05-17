import { useState, useCallback } from 'react';
import { getAnalyticsSummary, getAnalyticsByShop, getAnalyticsByCategory } from '../services/api';
import { useAnalyticsStore } from '../store';

export function useAnalytics() {
  const { summary, byShop, byCategory, dateRange, setSummary, setByShop, setByCategory } = useAnalyticsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (days = 30) => {
    setLoading(true);
    setError(null);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [summaryData, shopData, categoryData] = await Promise.all([
        getAnalyticsSummary({ startDate }),
        getAnalyticsByShop({ startDate }),
        getAnalyticsByCategory({ startDate }),
      ]);
      setSummary(summaryData);
      setByShop(shopData);
      setByCategory(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setSummary, setByShop, setByCategory]);

  return { summary, byShop, byCategory, dateRange, loading, error, fetchAll };
}
