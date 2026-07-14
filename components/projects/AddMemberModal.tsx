// components/projects/AddMemberModal.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectMemberRow } from '@/components/projects/ProjectDetail';
import type { UserOption } from '@/components/projects/ProjectDetail';

export function AddMemberModal({
  projectId,
  allUsers,
  existing,
  onClose,
  onAdded,
}: {
  projectId: string;
  allUsers: UserOption[];
  existing: ProjectMemberRow[];
  onClose: () => void;
  onAdded: (m: ProjectMemberRow) => void;
}) {
  const supabase = createClient();
  const available = allUsers.filter(u => !existing.some(m => m.user.id === u.id));
  const [userId, setUserId] = useState(available[0]?.id ?? '');
  const [role, setRole] = useState<'lead' | 'member'>('member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const add = async () => {
    if (!userId) { setError('Выберите сотрудника'); return; }
    setSaving(true); setError('');
    const { error: dbErr } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role })
      .select();
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    const picked = allUsers.find(u => u.id === userId)!;
    onAdded({ role, user: { id: picked.id, full_name: picked.full_name, role: '', position: null, status: 'offline' } });
    onClose();
  };

  return (
    <Modal title="Добавить участника" onClose={onClose} maxWidth="max-w-[400px]" footer={(
      <>
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
        <Button className="flex-1" onClick={add} disabled={saving || available.length === 0}>
          {saving && <Loader2 size={15} className="animate-spin" />} Добавить
        </Button>
      </>
    )}>
      {available.length === 0 ? (
        <p className="text-[13px] text-mute py-2">Все сотрудники уже добавлены в проект.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={"block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2"}>Сотрудник</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} className={"w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] transition-all"}>
              {available.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={"block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2"}>Роль в проекте</label>
            <select value={role} onChange={e => setRole(e.target.value as 'lead' | 'member')} className={"w-full h-10 px-3 rounded-xl bg-bg border border-line focus:border-accent/60 outline-none text-[13px] transition-all"}>
              <option value="member">Участник</option>
              <option value="lead">Лидер</option>
            </select>
          </div>
        </div>
      )}
    </Modal>
  );
}
