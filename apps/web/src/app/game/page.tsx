'use client';
import { useEffect, useState, useCallback } from 'react';
import { useWebGameState } from '@/hooks/useWebGameState';
import { useAutoSaveToSlot } from '@/hooks/useSaveSlots';
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
import FortSupplyScene from '@/scenes/FortSupplyScene';
import ConsequenceSummary from '@/scenes/ConsequenceSummary';
import VictoryScene from '@/scenes/VictoryScene';
import SceneTransition from '@/components/SceneTransition';
import SceneBridge from '@/components/SceneBridge';
import DebugHUD from '@/components/DebugHUD';
import AudioToggle from '@/components/AudioToggle';
import { useSceneRouter } from '@/hooks/useSceneRouter';
import { playAtmosphere } from '@/lib/audioAtmosphere';

export default function GamePage() {
  const { state, dispatch, isReady } = useWebGameState();
  const scene = useSceneRouter(state);
  const { saveNow } = useAutoSaveToSlot(state);
  const [saveFlash, setSaveFlash] = useState(false);

  // Play atmosphere when scene or route changes
  useEffect(() => {
    if (isReady && state) {
      playAtmosphere(state.route?.type ?? null, scene);
    }
  }, [scene, isReady]);

  // Auto-save to active slot when state changes (debounced via phase changes)
  useEffect(() => {
    if (!isReady || !state) return;
    saveNow();
  }, [state?.phase, state?.day, state?.location, isReady]);

  const handleManualSave = useCallback(async () => {
    await saveNow();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, [saveNow]);

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
      case 'FORT_SUPPLY':           return <FortSupplyScene state={state} dispatch={dispatch} />;
      case 'GATEKEEPER':            return <GatekeeperScene state={state} dispatch={dispatch} />;
      case 'ENTERTAINMENT_CIRCUIT': return <EntertainmentCircuitScene state={state} dispatch={dispatch} />;
      case 'MINIGAME':              return <MinigameInterruption state={state} dispatch={dispatch} />;
      case 'SUMMARY':               return <ConsequenceSummary state={state} dispatch={dispatch} />;
      case 'VICTORY':               return <VictoryScene state={state} dispatch={dispatch} />;
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

      {/* Save Game button — only when there's an active run */}
      {state && state.runId && state.phase !== 'END' && (
        <button
          onClick={handleManualSave}
          aria-label="Save game to slot"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            background: 'transparent',
            border: '1px solid var(--muted)',
            color: saveFlash ? 'var(--gold)' : 'var(--muted)',
            borderColor: saveFlash ? 'var(--gold)' : 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            padding: '4px 8px',
            cursor: 'pointer',
            opacity: saveFlash ? 0.9 : 0.5,
            zIndex: 100,
            transition: 'color 300ms, border-color 300ms, opacity 300ms',
            letterSpacing: '0.05em',
          }}
        >
          {saveFlash ? '✓ saved' : '↓ save'}
        </button>
      )}
    </>
  );
}
