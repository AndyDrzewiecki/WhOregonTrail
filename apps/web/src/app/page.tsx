'use client';
import { useRouter } from 'next/navigation';
import { useSaveSlots, type SlotInfo } from '@/hooks/useSaveSlots';
import type { SlotId } from '@whoreagon-trail/game-engine';
import styles from './page.module.css';

function formatSavedAt(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function routeLabel(rt: string | null): string {
  if (!rt) return '';
  const map: Record<string, string> = {
    fort_route: 'Fort Road',
    wilderness_route: 'Wilderness',
    entertainment_circuit: 'The Circuit',
  };
  return map[rt] ?? rt;
}

function SlotCard({
  slotId,
  info,
  onLoad,
  onNew,
  onDelete,
}: {
  slotId: SlotId;
  info: SlotInfo;
  onLoad: (id: SlotId) => void;
  onNew: (id: SlotId) => void;
  onDelete: (id: SlotId) => void;
}) {
  const label = `Slot ${slotId + 1}`;

  if (!info) {
    return (
      <div className={styles.slotCard + ' ' + styles.slotEmpty}>
        <span className={styles.slotLabel}>{label}</span>
        <span className={styles.slotEmpty_text}>— empty —</span>
        <button className={styles.slotBtn} onClick={() => onNew(slotId)}>
          New Game
        </button>
      </div>
    );
  }

  return (
    <div className={styles.slotCard}>
      <div className={styles.slotHeader}>
        <span className={styles.slotLabel}>{label}</span>
        <span className={styles.slotDate}>{formatSavedAt(info.savedAt)}</span>
      </div>
      <div className={styles.slotMeta}>
        <span className={styles.slotDay}>Day {info.day}</span>
        <span className={styles.slotDot}>&middot;</span>
        <span className={styles.slotLocation}>{info.locationName}</span>
        {info.routeType && (
          <>
            <span className={styles.slotDot}>&middot;</span>
            <span className={styles.slotRoute}>{routeLabel(info.routeType)}</span>
          </>
        )}
      </div>
      {info.partyNames.length > 0 && (
        <div className={styles.slotParty}>
          {info.partyNames.join(', ')}
        </div>
      )}
      <div className={styles.slotActions}>
        <button className={styles.slotBtn} onClick={() => onLoad(slotId)}>
          Continue &rarr;
        </button>
        <button
          className={styles.slotBtn + ' ' + styles.slotBtnDanger}
          onClick={() => onDelete(slotId)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { slots, isLoading, load, startNew, remove } = useSaveSlots();

  const hasAnySave = slots.some(Boolean);

  const handleLoad = async (slotId: SlotId) => {
    await load(slotId);
    router.push('/game');
  };

  const handleNew = async (slotId: SlotId) => {
    await startNew(slotId);
    router.push('/game');
  };

  const handleDelete = async (slotId: SlotId) => {
    await remove(slotId);
  };

  return (
    <main className={styles.landing}>
      <div className={styles.dust}>
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className={styles.particle} style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 15}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      <div className={styles.center}>
        <h1 className={styles.title}>WHOREAGON TRAIL</h1>
        <p className={styles.subtitle}>Independence, Missouri. 1848.</p>
        <p className={styles.tagline}>A burlesque troupe&apos;s passage west.</p>
        <p className={styles.premise}>
          Comedy. Frontier. Twelve people who shouldn&apos;t be in the same wagon.
        </p>

        {!hasAnySave && !isLoading && (
          <button className={styles.startButton} onClick={() => handleNew(0)}>
            Begin the Journey
          </button>
        )}

        {(hasAnySave || isLoading) && (
          <div className={styles.slotsSection}>
            <p className={styles.slotsHeading}>
              {isLoading ? 'Loading saves...' : 'Choose your wagon'}
            </p>
            {!isLoading && (
              <div className={styles.slotsGrid}>
                {(slots as SlotInfo[]).map((info, i) => (
                  <SlotCard
                    key={i}
                    slotId={i as SlotId}
                    info={info}
                    onLoad={handleLoad}
                    onNew={handleNew}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <p className={styles.note}>Requires Anthropic API key &middot; Text + optional voice input.</p>
      </div>

      <div className={styles.vignette} />
    </main>
  );
}
