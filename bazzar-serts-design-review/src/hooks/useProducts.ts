import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Review } from '../types';

/**
 * Хук для получения списка всех активных товаров.
 * @returns Объект с продуктами, состоянием загрузки и ошибкой.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('bazzar_products')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setProducts(data || []);
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  return { products, loading, error };
}

/**
 * Хук для получения конкретного товара по ID и похожих товаров.
 * @param id - UUID товара.
 */
export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchProductData() {
      try {
        // Fetch current product
        const { data: prodData, error: prodErr } = await supabase
          .from('bazzar_products')
          .select('*')
          .eq('id', id)
          .single();

        if (prodErr) throw prodErr;
        
        if (prodData && isMounted) {
          setProduct(prodData);
          
          // Fetch related concurrently with reviews
          const [relRes, revRes] = await Promise.all([
            supabase
              .from('bazzar_products')
              .select('*')
              .eq('category', prodData.category)
              .neq('id', prodData.id)
              .eq('active', true)
              .limit(5),
            supabase
              .from('bazzar_reviews')
              .select('*')
              .eq('product_id', prodData.id)
              .eq('status', 'published')
              .order('created_at', { ascending: false })
              .limit(10)
          ]);
          
          if (isMounted) {
            setRelated(relRes.data || []);
            setReviews(revRes.data || []);
          }
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProductData();
    return () => { isMounted = false; };
  }, [id]);

  return { product, related, reviews, loading, error };
}
