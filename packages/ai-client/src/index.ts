/**
 * @whoreagon-trail/ai-client
 *
 * All narrative generation flows through this module.
 * Model: claude-sonnet-4-20250514, max_tokens: 1000
 * Streaming: enabled via streamDialogue()
 */

import { getClient, MODEL, MAX_TOKENS } from './client';
import { systemPrompt as prologuePrompt } from './prompts/prologue';
import { systemPrompt as trailPrompt } from './prompts/trail';
import { systemPrompt as fortPrompt } from './prompts/fort';
import { systemPrompt as campfirePrompt } from './prompts/campfire';
import { systemPrompt as finalePrompt } from './prompts/finale';
import { systemPrompt as fortGatekeeperPrompt } from './prompts/fortGatekeeper';
import { systemPrompt as conflictMediatorPrompt } from './prompts/conflictMediator';
import { withRetry } from './retry';
import type { GameState } from '@whoreagon-trail/game-engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Message = {
  characterId: string;
  text: string;
  tone?: string;
};

export type EventOutcome = {
  result: 'success' | 'partial_success' | 'failure';
  description: string;
  resourceChanges?: Partial<{
    food: number;
    water: number;
    money: number;
    oxenHealth: number;
    wagonHealth: number;
    ammunition: number;
    medicine: number;
  }>;
  healthChanges?: Array<{ characterId: string; delta: number }>;
};

export type StressTag =
  | 'survival'
  | 'loss'
  | 'betrayal'
  | 'friendship'
  | 'sacrifice'
  | 'conflict'
  | 'discovery'
  | 'achievement';

export type AIResponse = {
  dialogue: Message[];
  relationshipDeltas: Record<string, number>;
  eventOutcome: EventOutcome;
  newFlags: string[];
  stressTag?: StressTag;
  relationshipLabel?: string;
};

export type PromptKey =
  | 'PROLOGUE'
  | 'TRAIL'
  | 'CAMPFIRE'
  | 'FORT'
  | 'FORT_GATEKEEPER'
  | 'CONFLICT_MEDIATOR'
  | 'FINALE';

/**
 * Trail events that can be resolved via resolveEvent().
 */
export type TrailEvent = {
  type: string;
  description: string;
  involvedCharacterIds?: string[];
};

// ── Prompt selection ──────────────────────────────────────────────────────────

function getSystemPrompt(phase: string): string {
  switch (phase) {
    case 'PROLOGUE':
      return prologuePrompt;
    case 'TRAIL':
      return trailPrompt;
    case 'FORT':
      return fortPrompt;
    case 'FORT_GATEKEEPER':
      return fortGatekeeperPrompt;
    case 'CONFLICT_MEDIATOR':
      return conflictMediatorPrompt;
    case 'CAMPFIRE':
      return campfirePrompt;
    case 'FINALE':
      return finalePrompt;
    default:
      // Campfire / fallback
      return campfirePrompt;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSafeFallback(): AIResponse {
  return {
    dialogue: [],
    relationshipDeltas: {},
    eventOutcome: {
      result: 'partial_success',
      description: 'The moment passes without resolution.',
    },
    newFlags: [],
  };
}

function parseAIResponse(raw: string): AIResponse {
  // Strip accidental markdown fences
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn('[ai-client] Failed to parse response as JSON, returning fallback');
    return buildSafeFallback();
  }

  const p = parsed as Record<string, unknown>;

  // Validate minimal structure, fallback on bad data
  if (!Array.isArray(p.dialogue)) {
    console.warn('[ai-client] Response missing "dialogue" array, returning fallback');
    return buildSafeFallback();
  }

  return {
    dialogue: p.dialogue as Message[],
    relationshipDeltas: (p.relationshipDeltas as Record<string, number>) ?? {},
    eventOutcome: (p.eventOutcome as EventOutcome) ?? {
      result: 'partial_success',
      description: 'Outcome unclear.',
    },
    newFlags: (p.newFlags as string[]) ?? [],
    stressTag: p.stressTag as StressTag | undefined,
    relationshipLabel: p.relationshipLabel as string | undefined,
  };
}

function buildSocialPressure(h: GameState['hiddenState']): string[] {
  const labels: string[] = [];
  if (h.resentment > 50) labels.push('HIGH internal resentment toward leadership');
  else if (h.resentment > 25) labels.push('moderate resentment building');
  if (h.protection > 70) labels.push('troupe feels genuinely protected');
  if (h.stigmaPressure > 60) labels.push('HIGH stigma — reputation precedes the wagon');
  else if (h.stigmaPressure > 35) labels.push('moderate stigma pressure — word is spreading');
  if (h.boundaryStrain > 50) labels.push('HIGH boundary strain — someone is being pushed past their limits');
  else if (h.boundaryStrain > 25) labels.push('elevated boundary strain');
  if (h.obedience < 30) labels.push('LOW obedience — leadership is being questioned');
  if (h.indebtedness > 50) labels.push('HIGH indebtedness — the wagon owes someone');
  return labels;
}

function gameStateToUserMessage(gameState: GameState, extra: string): string {
  const party = gameState.party
    .filter((m) => m.isAlive)
    .map((m) => ({
      id: m.id,
      name: m.name,
      health: m.health,
      personality: (m as Record<string, unknown>).personality,
      voice: (m as Record<string, unknown>).voice,
      moralCode: (m as Record<string, unknown>).moralCode,
      performanceTrait: (m as Record<string, unknown>).performanceTrait,
    }));

  const playerRelationships: Record<string, number> = {};
  const playerId = gameState.party[0]?.id;
  if (playerId && gameState.relationshipMatrix[playerId]) {
    for (const [id, score] of Object.entries(gameState.relationshipMatrix[playerId])) {
      playerRelationships[id] = score;
    }
  }

  const recentEvents = gameState.eventHistory.slice(-5);

  const roleAssignmentFlag = gameState.flags.find((f) => f.startsWith('ROLE_ASSIGNMENT:'));
  const roleAssignment = roleAssignmentFlag
    ? roleAssignmentFlag.slice('ROLE_ASSIGNMENT:'.length)
    : undefined;

  const summary = {
    day: gameState.day,
    location: gameState.location,
    phase: gameState.phase,
    route: gameState.route?.type ?? null,
    resources: gameState.resources,
    party,
    playerRelationships,
    recentEvents,
    flags: gameState.flags,
    socialPressure: buildSocialPressure(gameState.hiddenState),
    ...(roleAssignment !== undefined ? { roleAssignment } : {}),
  };

  return `GAME STATE:\n${JSON.stringify(summary, null, 2)}\n\n${extra}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate character dialogue for a scene.
 * Uses the phase-specific system prompt based on the current game state.
 */
export async function generateDialogue(
  gameState: GameState,
  playerInput: string,
  promptKey?: string
): Promise<AIResponse> {
  return withRetry(async () => {
    const client = getClient();

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: getSystemPrompt(promptKey ?? gameState.phase),
      messages: [
        {
          role: 'user',
          content: gameStateToUserMessage(gameState, `PLAYER INPUT: ${playerInput}`),
        },
      ],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    return parseAIResponse(raw);
  });
}

/**
 * Resolve a trail event — returns full narrative outcome including
 * relationship changes, resource changes, and new flags.
 */
export async function resolveEvent(
  gameState: GameState,
  event: TrailEvent,
  playerChoice: string,
  promptKey?: string
): Promise<AIResponse> {
  return withRetry(async () => {
    const client = getClient();

    const extra = [
      `EVENT TYPE: ${event.type}`,
      `EVENT DESCRIPTION: ${event.description}`,
      event.involvedCharacterIds
        ? `INVOLVED CHARACTERS: ${event.involvedCharacterIds.join(', ')}`
        : '',
      `PLAYER CHOICE: ${playerChoice}`,
    ]
      .filter(Boolean)
      .join('\n');

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: getSystemPrompt(promptKey ?? gameState.phase),
      messages: [
        {
          role: 'user',
          content: gameStateToUserMessage(gameState, extra),
        },
      ],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    return parseAIResponse(raw);
  });
}

/**
 * Generate the end-of-run epilogue.
 * Uses the finale system prompt and a larger token budget.
 */
export async function generateEpilogue(
  gameState: GameState
): Promise<AIResponse> {
  return withRetry(async () => {
    const client = getClient();

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000, // Epilogue needs more tokens
      system: getSystemPrompt('FINALE'),
      messages: [
        {
          role: 'user',
          content: gameStateToUserMessage(
            gameState,
            'Generate the epilogue for this run. One fate card per surviving character, then the run summary.'
          ),
        },
      ],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    return parseAIResponse(raw);
  });
}

/**
 * Streaming variant of generateDialogue.
 * Calls onChunk for each text delta as it arrives from the model.
 * Returns the final parsed AIResponse when the stream completes.
 */
export async function streamDialogue(
  gameState: GameState,
  playerInput: string,
  onChunk: (text: string) => void,
  promptKey?: string
): Promise<AIResponse> {
  return withRetry(async () => {
    const client = getClient();

    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: getSystemPrompt(promptKey ?? gameState.phase),
      messages: [
        {
          role: 'user',
          content: gameStateToUserMessage(gameState, `PLAYER INPUT: ${playerInput}`),
        },
      ],
    });

    let accumulated = '';

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        accumulated += event.delta.text;
        onChunk(event.delta.text);
      }
    }

    return parseAIResponse(accumulated);
  });
}
