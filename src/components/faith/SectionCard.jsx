// A titled card wrapping one section of the Daily Meditation form. When
// `editable` is true the title is an inline-editable text input bound to a
// renameable section title (placeholder shows the default name); otherwise
// the title is fixed text.
export default function SectionCard({ title, editable, titleValue, onTitleChange, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-[#D6DAE3] bg-white">
      <div className="flex items-center gap-2 border-b border-[#D6DAE3] px-4 py-3">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-[#D9A404]" />}
        {editable ? (
          <input
            type="text"
            value={titleValue || ''}
            placeholder={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="flex-1 bg-transparent font-display text-base font-semibold text-[#1B2A4B] outline-none placeholder:text-[#9AA4B8]"
          />
        ) : (
          <h2 className="flex-1 font-display text-base font-semibold text-[#1B2A4B]">{title}</h2>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}