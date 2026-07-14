import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { User2 } from 'lucide-react';

/**
 * Компонент отображения команды проекта.
 *
 * @component
 * @example
 * <Team
 *   projectId="123"
 *   members={membersArray}
 *   onRemove={removeMember}
 *   removingMemberId={removingMember}
 *   onAdd={() => setShowAddMember(true)}
 * />
 */
export const Team: React.FC<{
  projectId: string;
  members: { id: string; full_name: string; position?: string | null }[];
  onRemove: (userId: string) => void;
  removingMemberId?: string | null;
  onAdd?: () => void;
}> = ({ projectId, members, onRemove, removingMemberId, onAdd }) => {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold tracking-tight">Команда</h3>
        {onAdd && (
          <Button size="sm" variant="ghost" onClick={onAdd}>
            <Plus size={13} /> Добавить
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <User2 size={22} className="text-mute2" />
          <p className="text-[12.5px] text-mute">Участников пока нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] transition-colors group"
            >
              <Avatar initials={m.full_name.charAt(0)} color="blue" size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{m.full_name}</div>
                {m.position && (
                  <div className="text-[11.5px] text-mute truncate">{m.position}</div>
                )}
              </div>
              <Tag tone="mute">Member</Tag>
              <button
                onClick={() => onRemove(m.id)}
                disabled={removingMemberId === m.id}
                aria-label={`Удалить ${m.full_name}`}
                className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 text-mute hover:text-err transition-all inline-flex items-center justify-center disabled:opacity-40"
              >
                {removingMemberId === m.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

