import { Sparkles } from 'lucide-react';

export default function MoodBadge({ mood }: { mood: string[] }) {
  if (mood.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Sparkles size={13} className="text-accent" />
      {mood.map((m) => (
        <span
          key={m}
          className="rounded-full border border-surface-border bg-surface-overlay px-2 py-0.5 text-[11px] font-medium text-content"
        >
          {m}
        </span>
      ))}
    </div>
  );
}
