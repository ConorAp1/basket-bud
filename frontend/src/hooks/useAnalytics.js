import { useState, useCallback } from 'react';
import {
  getAnalyticsSummary,
  getAnalyticsByShop,
  getAnalyticsByCategory,
  getTopProducts,
  getShopComparison,
  getPriceAlerts,
} from '../services/api';
import { useAnalyticsStore } from '../store';

export function useAnalytics() {
  const {
    summary, byShop, byCategory, topProducts, shopComparison, priceAlerts, dateRange,
    setSummary, setByShop, setByCategory, setTopProducts, setShopComparison, setPriceAlerts,
  } = useAnalyticsStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (days = 30) => {
    setLoading(true);
    setError(null);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const dateParams = { startDate };

    try {
      const [summaryData, shopData, categoryData, topProductsData, shopCompData, alertsData] =
        await Promise.all([
          getAnalyticsSummary(dateParams),
          getAnalyticsByShop(dateParams),
          getAnalyticsByCategory(dateParams),
          getTopProducts(dateParams),
          getShopComparison(dateParams),
          getPriceAlerts(),
        ]);

      setSummary(summaryData);
      setByShop(shopData);
      setByCategory(categoryData);
      setTopProducts(topProductsData);
      setShopComparison(shopCompData);
      setPriceAlerts(alertsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setSummary, setByShop, setByCategory, setTopProducts, setShopComparison, setPriceAlerts]);

  return {
    summary, byShop, byCategory, topProducts, shopComparison, priceAlerts,
    dateRange, loading, error, fetchAll,
  };
}
