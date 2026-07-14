import React from 'react';
import { Loader2, Trash2, ExternalLink, Link2, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

/**
 * Компонент отображения ссылок проекта.
 *
 * @component
 * @example
 * <Links
 *   projectId="123"
 *   links={linksArray}
 *   onRemove={removeLink}
 *   removingLinkId={removingLink}
 *   onAdd={() => setShowAddLink(true)}
 * />
 */
export const Links: React.FC<{
  projectId: string;
  links: { id: string; label: string; url: string }[];
  onRemove: (linkId: string) => void;
  removingLinkId?: string | null;
  onAdd: () => void;
}> = ({ projectId, links, onRemove, removingLinkId, onAdd }) => {
  const domainOf = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold tracking-tight">Ссылки</h3>
        <Button size="sm" variant="ghost" onClick={onAdd}>
          <Plus size={13} /> Добавить
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Link2 size={22} className="text-mute2" />
          <p className="text-[12.5px] text-mute">Ссылок пока нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(l => {
            const domain = domainOf(l.url);
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-black/[0.04] border border-line inline-flex items-center justify-center shrink-0 overflow-hidden">
                  {domain ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                      alt=""
                      width={16}
                      height={16}
                      onError={e => {(e.currentTarget as HTMLImageElement).style.display = 'none';}}
                    />
                  ) : (
                    <Link2 size={13} className="text-mute" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{l.label}</div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] text-mute hover:text-accent transition-colors inline-flex items-center gap-1 truncate max-w-full"
                    onClick={e => e.stopPropagation()}
                  >
                    {domain || l.url}
                    <ExternalLink size={10} />
                  </a>
                </div>
                <button
                  onClick={() => onRemove(l.id)}
                  disabled={removingLinkId === l.id}
                  aria-label={`Удалить ссылку ${l.label}`}
                  className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 text-mute hover:text-err transition-all inline-flex items-center justify-center disabled:opacity-40"
                >
                  {removingLinkId === l.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

