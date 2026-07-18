import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trackEvent } from '../lib/analytics';

import { ShieldAlert, Lock, ShieldCheck, LifeBuoy } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

export function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uniquecode = searchParams.get('uniquecode');
  const { t } = useI18n();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<{ item_name: string, uniquecode: string, status: string } | null>(null);

  useEffect(() => {
    if (!uniquecode) {
      setError(t('success.error.noCode'));
      setLoading(false);
      return;
    }

    const checkOrder = async () => {
      let retries = 10;
      while (retries > 0) {
        try {
          // Запрос к бэкенду Connect для верификации
          let res = await fetch(`https://connect-4va6.vercel.app/api/shop/ggsel/verify?uniquecode=${uniquecode}&format=json`, {
            headers: { 'Accept': 'application/json' }
          });
          let data = await res.json();
          let shop = 'ggsel';

          // Если в GGSel заказ не найден (или вернул ошибку, но API ответил 200), пробуем Digiseller
          if (!res.ok || !data.success) {
            res = await fetch(`https://connect-4va6.vercel.app/api/shop/digiseller/verify?uniquecode=${uniquecode}&format=json`, {
              headers: { 'Accept': 'application/json' }
            });
            data = await res.json();
            shop = 'digiseller';
          }

          if (res.ok && data.success) {
            setOrder(data);
            
            // Проверяем, есть ли уже UDID
            const existingUdid = localStorage.getItem('apple_udid');
            if (existingUdid) {
              // Если есть, сразу привязываем заказ
              const linkRes = await fetch(`https://connect-4va6.vercel.app/api/shop/${shop}/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniquecode, udid: existingUdid })
              });
              const linkData = await linkRes.json();
              
              if (linkRes.ok && linkData.success) {
                // Заказ привязан, перенаправляем в кабинет
                navigate('/cabinet', { replace: true });
                return;
              } else {
                // Привязка не удалась — сохраняем заказ для повторной попытки
                localStorage.setItem('pending_shop_order', JSON.stringify({ code: uniquecode, shop }));
                setError(linkData.error || t('success.error.link'));
                setLoading(false);
                return;
              }
            } else {
              // Если UDID нет, сохраняем код заказа в памяти для привязки после получения UDID
              localStorage.setItem('pending_shop_order', JSON.stringify({ code: uniquecode, shop }));
              setLoading(false);
              return;
            }
          }
          
          // Если заказ еще не найден, ждем 3 секунды и пробуем снова
          retries--;
          if (retries === 0) {
            setError(data.error || t('success.error.verify'));
            setLoading(false);
          } else {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (err) {
          retries--;
          if (retries === 0) {
            setError(t('success.error.network'));
            setLoading(false);
          } else {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
    };

    checkOrder();
  }, [uniquecode, navigate]);

  const handleGetUdid = () => {
    trackEvent('add_to_cart');
    window.location.href = '/api/udid/generate';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
        <div style={{ marginBottom: 24, width: 40, height: 40, border: '4px solid var(--surface-2)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: 8 }}>{t('success.loading.title')}</h1>
        <p style={{ color: 'var(--text-2)' }}>{t('success.loading.subtitle')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '0 16px' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(248, 113, 113, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg style={{ width: 32, height: 32, color: 'var(--red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: 12 }}>{t('success.error.title')}</h1>
        <p style={{ color: 'var(--text-2)', maxWidth: 400, marginBottom: 32 }}>{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          {t('success.error.back')}
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 480, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}
    >
      <div style={{ width: 80, height: 80, background: 'rgba(163, 230, 53, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg style={{ width: 40, height: 40, color: 'var(--lime)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: 12 }}>
        {t('success.thanks')}
      </h1>
      <p style={{ color: 'var(--text-2)', marginBottom: 32, fontSize: '1.1rem' }}>
        {t('success.paid')}
      </p>

      <div className="card" style={{ padding: 24, marginBottom: 32, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{t('success.product')}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{order?.item_name || t('success.defaultItem')}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{t('success.orderNum')}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1rem', background: 'var(--bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--hair)', wordBreak: 'break-all' }}>
            {order?.uniquecode}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{t('success.bind.title')}</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-2)' }}>
          {t('success.bind.text')}
        </p>
        
        {/* Предупреждение о защите устройства */}
        <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', marginTop: 8 }}>
          <ShieldAlert size={24} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>{t('success.sdp.title')}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
              {t('success.sdp.text1')} <b>{t('success.sdp.text2')}</b> {t('success.sdp.text3')}
            </div>
          </div>
        </div>

        {/* Пошаговая инструкция */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--hair-strong)', borderRadius: 12, padding: '16px', marginTop: 8, textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 20, height: 20, background: 'var(--text)', color: 'var(--bg)', borderRadius: '50%', fontSize: '0.75rem' }}>i</span>
            {t('success.steps.title')}
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>{t('success.step1a')} <b>{t('success.step1b')}</b> {t('success.step1c')}</li>
            <li>{t('success.step2a')} <b>{t('success.step2b')}</b>.</li>
            <li>{t('success.step3a')} <b>{t('success.step3b')}</b> {t('success.step3c')}</li>
            <li>{t('success.step4a')} <b>{t('success.step4b')}</b> {t('success.step4c')} <b>{t('success.step4d')}</b> {t('success.step4e')}</li>
            <li>{t('success.step5')}</li>
          </ol>
        </div>

        <button 
          onClick={handleGetUdid}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8, padding: '16px 24px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <Lock size={18} />
          {t('success.getUdid')}
        </button>

        {/* Блок FAQ */}
        <div style={{ marginTop: 24, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <ShieldCheck size={20} style={{ color: 'var(--lime)' }} />
              <div style={{ fontWeight: 700 }}>{t('success.faq1.title')}</div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', paddingLeft: 32 }}>
              {t('success.faq1.text1')} <b>{t('success.faq1.text2')}</b> {t('success.faq1.text3')}
            </div>
          </div>

          <div className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <LifeBuoy size={20} style={{ color: 'var(--cyan)' }} />
              <div style={{ fontWeight: 700 }}>{t('success.faq2.title')}</div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', paddingLeft: 32 }}>
              {t('success.faq2.text1')} <br/>
              {t('success.faq2.text2')} <a href="https://t.me/SUPPORT_TG" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', textDecoration: 'underline' }}>{t('success.faq2.link')}</a>, {t('success.faq2.text3')}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
