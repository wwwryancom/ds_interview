/**
 * Minimal renderer: splits text on ``` fenced code blocks and renders code in a
 * monospace block, prose as paragraphs. Good enough for sample answers (not full markdown).
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/```/g);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        const isCode = i % 2 === 1;
        if (isCode) {
          const body = part.replace(/^[a-zA-Z]+\n/, ""); // drop the language hint line
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-2xl bg-ink/90 p-4 font-mono text-xs leading-6 text-rose-50"
            >
              <code>{body.trim()}</code>
            </pre>
          );
        }
        return part
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .map((p, j) => (
            <p key={`${i}-${j}`} className="rubric-copy whitespace-pre-wrap">
              {p.trim()}
            </p>
          ));
      })}
    </div>
  );
}
