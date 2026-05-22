import { useState, useCallback } from 'react';
import { getProducts, updateProduct as apiUpdateProduct, compareProduct } from '../services/api';
import { useProductStore } from '../store';

export function useProducts() {
  const { products, setProducts } = useProductStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(params);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setProducts]);

  return { products, loading, error, fetchProducts };
}

export function useProductCompare(productId) {
  const [comparison, setComparison] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparison = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareProduct(productId);
      setProduct(data.product);
      setComparison(data.comparison);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  return { product, comparison, loading, error, fetchComparison };
}
