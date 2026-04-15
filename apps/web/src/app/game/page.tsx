'use client';
import { useEffect } from 'react';
import { useWebGameState } from '@/hooks/useWebGameState';
import WagonOpener from '@/scenes/WagonOpener';
import CharacterIntroductions from '@/scenes/CharacterIntroductions';
import SupplyShop from '@/scenes/SupplyShop';
import ConflictScene from '@/scenes/ConflictScene';
import PlanningMode from '@/scenes/PlanningMode';
import GatekeeperScene from '@/scenes/GatekeeperScene';
import CoachingScene from '@/scenes/CoachingScene';
import EntertainmentCircuitScene from '@/scenes/EntertainmentCircuitScene';
import MinigameInterruption from '@/scenes/MinigameInterruption';
import DelegationScene from '@/scenes/DelegationScene';
import ConsequenceSummary from '@/scenes/ConsequenceSummary';
import SceneTransition from '@/components/SceneTransition';
import SceneBridge from '@/components/SceneBridge';
import DebugHUD from '@/components/DebugHUD';
import AudioToggle from '@/components/AudioToggle';
import { useSceneRouter } from '@/hooks/useSceneRouter';
import { playAtmosphere } from '@/lib/audioAtmosphere';

export default function GamePage() {
  const { state, dispatch, isReady } = useWebGameState();
  const scene = useSceneRouter(state);

  useEffect(() => {
    if (isReady && state) {
      playAtmosphere(state.route?.type ?? null, scene);
    }
  }, [scene, isReady]);

  if (!isReady) {
    return (
      <div style={{
        color: 'var(--muted)',
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
      }}>
        LOADING...
      </div>
    );
  }

  const renderScene = () => {
    switch (scene) {
      case 'WAGON_OPENER':          return <WagonOpener state={state} dispatch={dispatch} />;
      case 'CHARACTER_INTRODUCTIONS': return <CharacterIntroductions state={state} dispatch={dispatch} />;
      case 'SUPPLY_SHOP':           return <SupplyShop state={state} dispatch={dispatch} />;
      case 'CONFLICT':              return <ConflictScene state={state} dispatch={dispatch} />;
      case 'PLANNING':              return <PlanningMode state={state} dispatch={dispatch} />;
      case 'COACHING':              return <CoachingScene state={state} dispatch={dispatch} />;
      case 'DELEGATION':            return <DelegationScene state={state} dispatch={dispatch} />;
      case 'GATEKEEPER':            return <GatekeeperScene state={state} dispatch={dispatch} />;
      case 'ENTERTAINMENT_CIRCUIT': return <EntertainmentCircuitScene state={state} dispatch={dispatch} />;
      case 'MINIGAME':              return <MinigameInterruption state={state} dispatch={dispatch} />;
      case 'SUMMARY':               return <ConsequenceSummary state={state} dispatch={dispatch} />;
      default:                      return <PlanningMode state={state} dispatch={dispatch} />;
    }
  };

  return (
    <>
      <SceneTransition sceneKey={scene}>
        <SceneBridge state={state} scene={scene} />
        {renderScene()}
      </SceneTransition>
      <DebugHUD state={state} scene={scene} />
      <AudioToggle scene={scene} routeType={state?.route?.type ?? null} />
    </>
  );
}
