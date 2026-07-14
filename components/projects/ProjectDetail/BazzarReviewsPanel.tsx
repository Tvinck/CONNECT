'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Star, Search, CheckCircle2, XCircle, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { getBazzarReviews, updateReviewStatus, deleteReview } from '@/app/actions/bazzar';

export function BazzarReviewsPanel() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const res = await getBazzarReviews();
    if (res.success && res.data) {
      setReviews(res.data);
    }
    setLoading(false);
  };

  const filteredReviews = reviews.filter(r => 
    r.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : 0;

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateReviewStatus(id, newStatus);
    if (res.success) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteReview(id);
    if (res.success) {
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  const getStars = (count: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} size={14} className={i < count ? 'text-amber-400 fill-amber-400' : 'text-mute/30'} />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight">Отзывы покупателей</h2>
          <p className="text-mute text-[13px] mt-1">Модерация и просмотр отзывов о товарах.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageSquare className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Всего отзывов
          </div>
          <div className="text-[28px] font-bold text-foreground">
            {reviews.length}
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <Star className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            Средняя оценка
          </div>
          <div className="text-[28px] font-bold text-amber-400 flex items-baseline gap-2">
            {avgRating.toFixed(1)} <span className="text-[14px] text-mute font-normal">/ 5.0</span>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-accent" />
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-mute font-semibold uppercase tracking-[0.05em] mb-3">
            На модерации
          </div>
          <div className="text-[28px] font-bold text-accent">
            {reviews.filter(r => r.status === 'pending').length}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-tight">Лента отзывов</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute" />
            <input 
              type="text" 
              placeholder="Поиск по тексту или автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-line rounded-lg py-1.5 pl-9 pr-3 text-[12.5px] text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-black/[0.02] dark:bg-white/[0.01] text-mute border-b border-line text-[11px] uppercase tracking-[0.05em]">
              <tr>
                <th className="py-3 px-4 font-semibold w-[250px]">Автор и Товар</th>
                <th className="py-3 px-4 font-semibold">Оценка</th>
                <th className="py-3 px-4 font-semibold">Отзыв</th>
                <th className="py-3 px-4 font-semibold">Статус</th>
                <th className="py-3 px-3 font-semibold text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-mute mx-auto" /></td>
                </tr>
              ) : filteredReviews.map(review => (
                <tr key={review.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.015] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground">{review.author}</span>
                      <span className="text-[11px] text-mute">{review.product}</span>
                      <span className="text-[10px] text-mute/60">{review.date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-0.5">
                      {getStars(review.rating)}
                    </div>
                  </td>
                  <td className="py-4 px-4 max-w-[300px]">
                    <p className="text-[12.5px] text-foreground leading-relaxed break-words">
                      "{review.text}"
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    {review.status === 'published' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-ok/10 text-ok border border-ok/20">
                        Опубликован
                      </span>
                    ) : review.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-err/10 text-err border border-err/20">
                        Отклонен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                        Ожидает
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {review.status !== 'published' && (
                        <button 
                          onClick={() => handleStatusChange(review.id, 'published')}
                          className="p-1.5 text-mute hover:text-ok hover:bg-ok/10 rounded-lg transition-colors"
                          title="Одобрить"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(review.id, 'rejected')}
                          className="p-1.5 text-mute hover:text-err hover:bg-err/10 rounded-lg transition-colors"
                          title="Отклонить"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(review.id)}
                        className="p-1.5 text-mute hover:text-err hover:bg-err/10 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={5}><EmptyState icon={MessageSquare} title="Отзывы не найдены" description="Отзывы пользователей появятся здесь." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
