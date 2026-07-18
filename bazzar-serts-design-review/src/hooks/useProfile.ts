import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export interface OrderItem {
  id: string;
  title: string;
  date: string;
  sum: number;
  status: 'done' | 'progress';
  emoji: string;
  grad: string;
  ipaUrl: string | null;
  productId?: string;
  approval_comment?: string;
}

/**
 * Хук для получения профиля текущего пользователя и его заказов.
 */
export function useProfile() {
  const [udid, setUdid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUdid = localStorage.getItem('apple_udid');
    setUdid(currentUdid);
    
    if (!currentUdid) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    async function fetchProfile() {
      try {
        const { data: userData, error } = await supabase
          .from('bazzar_users')
          .select('*')
          .eq('udid', currentUdid)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
          console.error("Profile error:", error);
        }

        // Fetch apple_certificates for manual registrations
        const { data: certsData } = await supabase
          .from('apple_certificates')
          .select('*')
          .eq('udid', currentUdid);

        if (isMounted) {
          if (userData) {
            setProfile(userData);
          } else if (certsData && certsData.length > 0) {
            // User exists in apple_certificates but not in bazzar_users
            setProfile({
              udid: currentUdid,
              status: certsData[0].crm_status === 'approved' ? 'bought' : 'pending',
              plan: certsData[0].plan_id,
              last_purchase: certsData[0].created_at
            } as UserProfile);
          }
          
          let allOrders: OrderItem[] = [];

          // 1. Preload product data for any UUIDs (either in certs or userData.plan)
          const uuidsToFetch = new Set<string>();
          if (certsData) {
            certsData.forEach(cert => {
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cert.plan_id)) {
                uuidsToFetch.add(cert.plan_id);
              }
            });
          }
          if (userData && userData.plan && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userData.plan)) {
             uuidsToFetch.add(userData.plan);
          }

          const productMap: Record<string, { title: string, ipa_url: string | null }> = {};
          if (uuidsToFetch.size > 0) {
            const { data: prods } = await supabase
              .from('bazzar_products')
              .select('id, title, ipa_url')
              .in('id', Array.from(uuidsToFetch));
            if (prods) {
              prods.forEach(p => productMap[p.id] = p);
            }
          }

          // 2. Add apple_certificates
          if (certsData && certsData.length > 0) {
            for (const cert of certsData) {
              let displayTitle = cert.plan_id || 'Сертификат Apple';
              if (productMap[cert.plan_id]) {
                 displayTitle = productMap[cert.plan_id].title;
              } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cert.plan_id)) {
                 displayTitle = 'Сертификат Apple ESign';
              }

              allOrders.push({
                id: 'CERT-' + cert.id.substring(0, 5).toUpperCase(),
                title: displayTitle,
                date: new Date(cert.created_at).toLocaleDateString('ru-RU'),
                sum: cert.sale_price || 0,
                status: cert.crm_status === 'approved' ? 'done' : 'progress',
                emoji: '📃',
                grad: 'linear-gradient(135deg,#10b981,#1db954)',
                ipaUrl: null,
                approval_comment: cert.approval_comment
              });
            }
          }

          // 3. Generate an order object from user profile ONLY if no certificates exist (fallback)
          if (userData && userData.plan && (!certsData || certsData.length === 0)) {
            let displayTitle = userData.plan;
            let ipaUrl = null;
            let prodId = undefined;

            if (productMap[userData.plan]) {
                displayTitle = productMap[userData.plan].title;
                ipaUrl = productMap[userData.plan].ipa_url;
                prodId = userData.plan;
            } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userData.plan)) {
                displayTitle = 'Сертификат Apple ESign';
            } else {
              // fetch product by title if not uuid
              const { data: prod } = await supabase
                .from('bazzar_products')
                .select('id, ipa_url')
                .eq('title', userData.plan)
                .maybeSingle();
              if (prod) {
                ipaUrl = prod.ipa_url;
                prodId = prod.id;
              }
            }

            allOrders.push({
              id: 'BZ-' + userData.udid.substring(userData.udid.length - 5).toUpperCase(),
              title: displayTitle,
              date: userData.last_purchase ? new Date(userData.last_purchase).toLocaleDateString('ru-RU') : 'Недавно',
              sum: displayTitle.includes('VIP') ? 1500 : (displayTitle.includes('1 Год') || displayTitle.includes('Apple') ? 800 : 0),
              status: userData.status === 'bought' ? 'done' : 'progress',
              emoji: displayTitle.includes('Developer') ? '📃' : (displayTitle.includes('VIP') ? '👑' : '⚡'),
              grad: 'linear-gradient(135deg,#10b981,#1db954)',
              ipaUrl,
              productId: prodId
            });
          }

          setOrders(allOrders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const logout = () => {
    localStorage.removeItem('apple_udid');
    localStorage.removeItem('apple_device_model');
    localStorage.removeItem('pending_shop_order');
    localStorage.removeItem('pending_ggsel_order');
    localStorage.removeItem('bazzar_source');
    localStorage.removeItem('bazzar_contact');
    localStorage.removeItem('bazzar_promo');
    localStorage.removeItem('last_visit_date');
    setUdid(null);
    setProfile(null);
    setOrders([]);
  };

  return { udid, profile, orders, loading, logout };
}
