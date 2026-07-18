import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { useI18n } from '../hooks/useI18n';

export function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const authenticate = async () => {
      const udid = searchParams.get('udid');
      const model = searchParams.get('model');

      if (udid) {
        localStorage.setItem('apple_udid', udid);
        if (model) {
          localStorage.setItem('apple_device_model', model);
        }
        
        // Check if user exists in Supabase
        const { data, error } = await supabase.from('bazzar_users').select('udid').eq('udid', udid).maybeSingle();
        
        // If not found, create a basic profile
        if (!data && !error) {
          await supabase.from('bazzar_users').insert([{
            udid,
            status: 'thinking',
            created_at: new Date().toISOString()
          }]);
          trackEvent('registrations');
          
          // Capture source and create CRM lead
          const pendingOrderStr = localStorage.getItem('pending_shop_order');
          const pendingGGSelLegacyCRM = localStorage.getItem('pending_ggsel_order'); // fallback for CRM source detection
          const storedSource = localStorage.getItem('bazzar_source');
          let leadSource = storedSource || 'Сайт';
          
          if (pendingOrderStr) {
            try {
              const parsed = JSON.parse(pendingOrderStr);
              leadSource = parsed.shop === 'digiseller' ? 'Digiseller' : 'GGsel';
            } catch (e) {}
          } else if (pendingGGSelLegacyCRM) {
            leadSource = 'GGsel';
          }

          try {
            await fetch('/api/crm/lead', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                udid, 
                deviceModel: model,
                source: leadSource 
              })
            });
          } catch (e) {
            console.error('Failed to create CRM lead', e);
          }
        }

        // Link pending shop order if exists
        const pendingOrder = localStorage.getItem('pending_shop_order');
        const pendingGGSelLegacy = localStorage.getItem('pending_ggsel_order'); // Legacy fallback — no longer written but may exist from older sessions
        
        let pendingCodeToLink = null;
        let pendingShopToLink = 'ggsel';
        
        if (pendingOrder) {
          try {
            const parsed = JSON.parse(pendingOrder);
            pendingCodeToLink = parsed.code;
            pendingShopToLink = parsed.shop;
          } catch (e) {}
        } else if (pendingGGSelLegacy) {
          pendingCodeToLink = pendingGGSelLegacy;
        }

        if (pendingCodeToLink) {
          try {
            const linkRes = await fetch(`https://connect-4va6.vercel.app/api/shop/${pendingShopToLink}/link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uniquecode: pendingCodeToLink, udid })
            });
            const linkData = await linkRes.json().catch(() => ({ success: false }));
            if (linkRes.ok && linkData.success !== false) {
              localStorage.removeItem('pending_shop_order');
              localStorage.removeItem('pending_ggsel_order');
              navigate('/cabinet', { replace: true });
              return;
            } else {
              console.error('Link API returned error:', linkData);
              // Don't remove pending order — user can retry from cabinet
            }
          } catch (e) {
            console.error('Failed to link order', e);
          }
        }
        
        // Redirect to personal cabinet
        navigate('/cabinet', { replace: true });
      } else {
        // If no UDID, redirect back home
        navigate('/', { replace: true });
      }
    };
    
    authenticate();
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid var(--hair-strong)', borderTopColor: 'var(--violet)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
          {t('auth.title')}
        </h1>
        <p style={{ color: 'var(--text-2)' }}>{t('auth.subtitle')}</p>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
