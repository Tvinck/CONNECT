// components/projects/EditProjectModal.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectFull } from '@/components/projects/ProjectDetail';
import { EMOJI_OPTIONS, COLOR_OPTIONS, FIELD, SELECT, LABEL } from '@/components/projects/ProjectDetail';

export function EditProjectModal({ project, onClose, onSaved }: {
  project: ProjectFull;
  onClose: () => void;
  onSaved: (p: ProjectFull) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(project.name);
  const [emoji, setEmoji] = useState(project.emoji ?? '🚀');
  const [color, setColor] = useState(project.color);
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [description, setDescription] = useState(project.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim()) { setError('Укажите название'); return; }
    setSaving(true); setError('');
    const { data, error: dbErr } = await supabase
      .from('projects')
      .update({ name: name.trim(), emoji, color, status, progress, description: description.trim() || null })
      .eq('id', project.id)
      .select('id, name, slug, emoji, color, status, progress, description, created_at')
      .single();
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    if (data) onSaved(data as ProjectFull);
    onClose();
  };

  return (
    <Modal title="Редактировать проект" onClose={onClose} footer={(
      <>
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
        <Button className="flex-1" onClick={save} disabled={saving}>
          {saving && <Loader2 size={15} className="animate-spin" />} Сохранить
        </Button>
      </>
    )}>
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Название *</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Иконка</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map((em: string) => (
              <button key={em} onClick={() => setEmoji(em)} type="button"
                className={`w-9 h-9 rounded-xl text-lg inline-flex items-center justify-center border transition-all ${
                  emoji === em ? 'border-accent bg-accent/15' : 'border-line hover:border-line2 bg-white/[0.02]'
                }`}
              >{em}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>Цвет</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c: string) => (
              <button key={c} onClick={() => setColor(c)} type="button"
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#151829]' : ''}`}
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Статус</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className={SELECT}>
              <option value="planning">Планирование</option>
              <option value="dev">В разработке</option>
              <option value="active">Активный</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Прогресс %</label>
            <input type="number" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className={FIELD} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="О проекте…" className={FIELD} />
        </div>
        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  );
}
