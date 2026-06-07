// components/projects/AddLinkModal.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectLinkRow } from '@/components/projects/ProjectDetail';
import { FIELD, LABEL } from '@/components/projects/ProjectDetail';

export function AddLinkModal({
  projectId,
  onClose,
  onAdded,
}: {
  projectId: string;
  onClose: () => void;
  onAdded: (l: ProjectLinkRow) => void;
}) {
  const supabase = createClient();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const add = async () => {
    if (!label.trim()) { setError('Укажите название ссылки'); return; }
    if (!url.trim()) { setError('Укажите URL'); return; }
    const normalized = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    setSaving(true); setError('');
    const { data, error: dbErr } = await supabase
      .from('project_links')
      .insert({ project_id: projectId, label: label.trim(), url: normalized })
      .select('id, label, url')
      .single();
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    if (data) onAdded(data as ProjectLinkRow);
    onClose();
  };

  return (
    <Modal title="Добавить ссылку" onClose={onClose} maxWidth="max-w-[400px]" footer={(
      <>
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
        <Button className="flex-1" onClick={add} disabled={saving}>
          {saving && <Loader2 size={15} className="animate-spin" />} Добавить
        </Button>
      </>
    )}>
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Название</label>
          <input value={label} onChange={e => setLabel(e.target.value)} autoFocus className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" type="url" className={FIELD} />
        </div>
        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  );
}
