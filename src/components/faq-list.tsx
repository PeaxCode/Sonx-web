export interface FaqItem {
  question: string;
  answer: string;
}

/** Expandable questions with FAQPage structured data, so search engines can show the answers. */
export function FaqList({ items, title, id }: { items: FaqItem[]; title: string; id: string }) {
  return (
    <section aria-labelledby={id} className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
      <h2 id={id} className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">{title}</h2>
      <div className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden="true"
                className="relative size-4 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-fog after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-fog after:transition-transform group-open:after:rotate-90" />
            </summary>
            <p className="mt-3 max-w-2xl text-sm text-fog">{item.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </section>
  );
}
