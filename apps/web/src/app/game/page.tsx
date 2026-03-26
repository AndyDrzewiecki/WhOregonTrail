'use client';
import { useWebGameState } from '@/hooks/useWebGameState';
import WagonOpener from '@/scenes/WagonOpener';
import CharacterIntroductions from '@/scenes/CharacterIntroductions';
import ConflictScene from '@/scenes/ConflictScene';
import PlanningMode from '@/scenes/PlanningMode';
import GatekeeperScene from '@/scenes/GatekeeperScene';
import MinigameInterruption from '@/scenes/MinigameInterruption';
import ConsequenceSummary from '@/scenes/ConsequenceSummary';
import { useSceneRouter } from '@/hooks/useSceneRouter';

export default function GamePage() {
  const { state, dispatch, isReady } = useWebGameState();
  const scene = useSceneRouter(state);

  if (!isReady) {
    return <div style={{ color: 'var(--muted)', padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  switch (scene) {
    case 'WAGON_OPENER': return <WagonOpener state={state} dispatch={dispatch} />;
    case 'CHARACTER_INTRODUCTIONS': return <CharacterIntroductions state={state} dispatch={dispatch} />;
    case 'CONFLICT': return <ConflictScene state={state} dispatch={dispatch} />;
    case 'PLANNING': return <PlanningMode state={state} dispatch={dispatch} />;
    case 'GATEKEEPER': return <GatekeeperScene state={state} dispatch={dispatch} />;
    case 'MINIGAME': return <MinigameInterruption state={state} dispatch={dispatch} />;
    case 'SUMMARY': return <ConsequenceSummary state={state} dispatch={dispatch} />;
    default: return <PlanningMode state={state} dispatch={dispatch} />;
  }
}
