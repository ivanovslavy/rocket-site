import { MISSION } from '../copy'
import { TrustStrip } from './TrustStrip'

/** Inner content for the Mission block — rendered inside the planet panel. */
export function MissionContent() {
  return (
    <div className="text-center">
      <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-rocket-cyan">
        {MISSION.title}
      </p>
      <h2 className="mt-2 font-display text-3xl font-extrabold text-white heading-glow sm:text-4xl">
        {MISSION.tagline}
      </h2>
      <div className="mt-6 space-y-4 text-left">
        {MISSION.paragraphs.map((p, i) => (
          <p
            key={i}
            className={`leading-relaxed text-white/90 ${
              i === MISSION.paragraphs.length - 1
                ? 'text-center font-display text-lg font-bold text-rocket-yellow'
                : 'text-base'
            }`}
          >
            {p}
          </p>
        ))}
      </div>
      <div className="mt-6">
        <TrustStrip />
      </div>
    </div>
  )
}
