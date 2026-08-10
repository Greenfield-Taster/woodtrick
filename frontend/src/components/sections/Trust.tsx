import { useReveal } from '../../lib/useReveal'

const FACTS = [
  { label: 'Ships from', value: 'US & EU', note: 'Pennsylvania and Poland' },
  { label: 'Free delivery', value: '$49 / €45', note: 'On every order above' },
  { label: 'Returns', value: '30 days', note: 'Opened boxes included' },
  { label: 'Missing a piece?', value: 'Recut free', note: 'Send us the design number' },
]

const NOTES = [
  {
    quote:
      'Bought it as a gift and did not manage to give it away. The box alone looks like it cost more than it did.',
    name: 'Marta',
    place: 'Kraków',
  },
  {
    quote:
      'I have built three now. The one detail I did not expect: you stop looking at the picture and start reading the shapes.',
    name: 'Dan',
    place: 'Portland',
  },
  {
    quote:
      'Turned a piece over on day two and realised there was a whole second design under my hands.',
    name: 'Elise',
    place: 'Lyon',
  },
]

export function Trust() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="border-t border-ink-line py-24 md:py-32">
      <div className="container-page">
        <div ref={ref} className="reveal">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="eyebrow">{fact.label}</dt>
                <dd className="mt-3 font-display text-3xl md:text-4xl">{fact.value}</dd>
                <dd className="mt-1.5 text-sm text-paper/45">{fact.note}</dd>
              </div>
            ))}
          </dl>

          <div className="rule-line my-16" />

          <ul className="grid gap-10 md:grid-cols-3 md:gap-12">
            {NOTES.map((note) => (
              <li key={note.name}>
                <p className="text-[17px] leading-relaxed text-paper/75">“{note.quote}”</p>
                <p className="mt-4 text-sm text-paper/40">
                  {note.name} · {note.place}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
