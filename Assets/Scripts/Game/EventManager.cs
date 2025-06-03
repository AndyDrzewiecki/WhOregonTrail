using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using System.Linq;

[System.Serializable]
public class GameEvent
{
    public string eventId;
    public string title;
    public string description;
    public List<EventChoice> choices;
    public float healthImpact;
    public float moraleImpact;
    public float relationshipImpact;
}

[System.Serializable]
public class EventChoice
{
    public string choiceText;
    public string outcome;
    public float healthModifier;
    public float moraleModifier;
    public float relationshipModifier;
}

public class EventManager : MonoBehaviour
{
    public static EventManager Instance { get; private set; }

    [Header("Event Settings")]
    public List<GameEvent> availableEvents = new List<GameEvent>();
    public List<GameEvent> activeEvents = new List<GameEvent>();
    public List<GameEvent> completedEvents = new List<GameEvent>();
    public float eventCheckInterval = 60f; // Check for events every minute
    public int maxActiveEvents = 3;
    public bool autoTriggerEvents = true;

    [Header("Event Generation")]
    public float randomEventChance = 0.3f;
    public float storyEventChance = 0.2f;
    public float characterEventChance = 0.25f;
    public float locationEventChance = 0.15f;
    public float resourceEventChance = 0.1f;

    private float lastEventCheck = 0f;
    private Dictionary<string, List<EventConsequence>> pendingConsequences = new Dictionary<string, List<EventConsequence>>();
    private Dictionary<string, float> consequenceTimers = new Dictionary<string, float>();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        LoadEvents();
        StartCoroutine(EventCheckRoutine());
    }

    private void Update()
    {
        ProcessPendingConsequences();
    }

    private void LoadEvents()
    {
        // TODO: Load events from JSON or database
        // For now, we'll create some sample events
        CreateSampleEvents();
    }

    private void CreateSampleEvents()
    {
        // Sample random event
        GameEvent randomEvent = new GameEvent
        {
            title = "Strange Noise",
            description = "You hear a strange noise in the distance. Do you investigate?",
            type = EventType.Random,
            probability = 0.7f,
            cooldown = 300f, // 5 minutes cooldown
            isRepeatable = true
        };

        EventChoice investigateChoice = new EventChoice
        {
            text = "Investigate the noise",
            probability = 0.8f
        };
        investigateChoice.consequences.Add("health", -10f);
        investigateChoice.consequences.Add("morale", 5f);
        investigateChoice.followUpEvents.Add("found_treasure");

        EventChoice ignoreChoice = new EventChoice
        {
            text = "Ignore it and continue",
            probability = 1.0f
        };
        ignoreChoice.consequences.Add("morale", -5f);

        randomEvent.choices.Add(investigateChoice);
        randomEvent.choices.Add(ignoreChoice);

        availableEvents.Add(randomEvent);

        // Sample character event
        GameEvent characterEvent = new GameEvent
        {
            title = "Character Conflict",
            description = "Two of your companions are arguing about the best route to take.",
            type = EventType.Character,
            probability = 0.6f,
            cooldown = 600f, // 10 minutes cooldown
            isRepeatable = true
        };

        EventChoice mediateChoice = new EventChoice
        {
            text = "Try to mediate the situation",
            probability = 0.7f
        };
        mediateChoice.consequences.Add("morale", 10f);
        mediateChoice.consequences.Add("relationship_1_2", 5f);

        EventChoice sideWithFirstChoice = new EventChoice
        {
            text = "Side with the first companion",
            probability = 0.8f
        };
        sideWithFirstChoice.consequences.Add("relationship_1_2", -10f);
        sideWithFirstChoice.consequences.Add("relationship_1_3", 5f);

        EventChoice sideWithSecondChoice = new EventChoice
        {
            text = "Side with the second companion",
            probability = 0.8f
        };
        sideWithSecondChoice.consequences.Add("relationship_1_2", -10f);
        sideWithSecondChoice.consequences.Add("relationship_2_3", 5f);

        characterEvent.choices.Add(mediateChoice);
        characterEvent.choices.Add(sideWithFirstChoice);
        characterEvent.choices.Add(sideWithSecondChoice);

        availableEvents.Add(characterEvent);
    }

    private IEnumerator EventCheckRoutine()
    {
        while (true)
        {
            if (autoTriggerEvents && GameManager.Instance.currentState == GameState.Playing)
            {
                CheckForEvents();
            }
            yield return new WaitForSeconds(eventCheckInterval);
        }
    }

    public void CheckForEvents()
    {
        float currentTime = Time.time;
        if (currentTime - lastEventCheck < eventCheckInterval)
            return;

        lastEventCheck = currentTime;

        // Get current game state
        List<string> activeCharacters = GetActiveCharacterIds();
        List<string> currentLocation = new List<string> { "current_location" }; // TODO: Get actual location
        Dictionary<string, int> inventory = GetInventory();

        // Check for events that can be triggered
        List<GameEvent> possibleEvents = availableEvents
            .Where(e => !activeEvents.Contains(e) && !completedEvents.Contains(e) && 
                   e.CanTrigger(currentTime, activeCharacters, currentLocation, inventory))
            .ToList();

        // Select events based on probability and type
        foreach (var eventType in Enum.GetValues(typeof(EventType)))
        {
            float chance = GetEventChanceForType((EventType)eventType);
            if (UnityEngine.Random.value < chance)
            {
                var typeEvents = possibleEvents.Where(e => e.type == (EventType)eventType).ToList();
                if (typeEvents.Count > 0)
                {
                    int randomIndex = UnityEngine.Random.Range(0, typeEvents.Count);
                    GameEvent selectedEvent = typeEvents[randomIndex];
                    TriggerEvent(selectedEvent);
                    possibleEvents.Remove(selectedEvent);
                }
            }
        }

        // If we still have room for more events, add some random ones
        while (activeEvents.Count < maxActiveEvents && possibleEvents.Count > 0)
        {
            if (UnityEngine.Random.value < randomEventChance)
            {
                int randomIndex = UnityEngine.Random.Range(0, possibleEvents.Count);
                GameEvent selectedEvent = possibleEvents[randomIndex];
                TriggerEvent(selectedEvent);
                possibleEvents.Remove(selectedEvent);
            }
            else
            {
                break;
            }
        }
    }

    private float GetEventChanceForType(EventType type)
    {
        switch (type)
        {
            case EventType.Random:
                return randomEventChance;
            case EventType.Story:
                return storyEventChance;
            case EventType.Character:
                return characterEventChance;
            case EventType.Location:
                return locationEventChance;
            case EventType.Resource:
                return resourceEventChance;
            default:
                return 0.1f;
        }
    }

    public void TriggerEvent(GameEvent gameEvent)
    {
        if (activeEvents.Count >= maxActiveEvents)
            return;

        gameEvent.Trigger(Time.time);
        activeEvents.Add(gameEvent);
        
        // Notify UI to display the event
        UIManager.Instance.ShowEvent(gameEvent);
    }

    public void MakeChoice(GameEvent gameEvent, EventChoice choice)
    {
        // Apply immediate consequences
        ApplyConsequences(choice.consequences);

        // Add follow-up events to available events
        foreach (string followUpEventId in choice.followUpEvents)
        {
            var followUpEvent = availableEvents.FirstOrDefault(e => e.id == followUpEventId);
            if (followUpEvent != null)
            {
                availableEvents.Add(followUpEvent);
            }
        }

        // Move event to completed list
        activeEvents.Remove(gameEvent);
        if (!gameEvent.isRepeatable || (gameEvent.maxOccurrences > 0 && gameEvent.currentOccurrences >= gameEvent.maxOccurrences))
        {
            completedEvents.Add(gameEvent);
        }
        else
        {
            availableEvents.Add(gameEvent);
        }

        // Notify UI to hide the event
        UIManager.Instance.HideEvent(gameEvent);
    }

    private void ApplyConsequences(Dictionary<string, float> consequences)
    {
        foreach (var consequence in consequences)
        {
            string[] parts = consequence.Key.Split('_');
            if (parts.Length >= 2)
            {
                string targetType = parts[0];
                string targetId = parts.Length > 2 ? parts[1] + "_" + parts[2] : parts[1];
                string attribute = parts.Length > 3 ? parts[3] : "value";

                switch (targetType)
                {
                    case "character":
                        ApplyCharacterConsequence(targetId, attribute, consequence.Value);
                        break;
                    case "resource":
                        ApplyResourceConsequence(attribute, consequence.Value);
                        break;
                    case "relationship":
                        ApplyRelationshipConsequence(targetId, consequence.Value);
                        break;
                    case "quest":
                        ApplyQuestConsequence(targetId, consequence.Value);
                        break;
                    default:
                        Debug.LogWarning("Unknown consequence target type: " + targetType);
                        break;
                }
            }
        }
    }

    private void ApplyCharacterConsequence(string characterId, string attribute, float value)
    {
        Character character = FindCharacterById(characterId);
        if (character == null)
            return;

        switch (attribute)
        {
            case "health":
                character.state.health = Mathf.Clamp(character.state.health + value, 0, 100);
                break;
            case "morale":
                character.state.morale = Mathf.Clamp(character.state.morale + value, 0, 100);
                break;
            case "energy":
                character.state.energy = Mathf.Clamp(character.state.energy + value, 0, 100);
                break;
            default:
                Debug.LogWarning("Unknown character attribute: " + attribute);
                break;
        }

        // Update UI
        UIManager.Instance.UpdateCharacterStats(character);
    }

    private void ApplyResourceConsequence(string resource, float value)
    {
        // TODO: Apply resource changes to the game state
        Debug.Log($"Resource {resource} changed by {value}");
    }

    private void ApplyRelationshipConsequence(string relationshipId, float value)
    {
        // TODO: Apply relationship changes between characters
        Debug.Log($"Relationship {relationshipId} changed by {value}");
    }

    private void ApplyQuestConsequence(string questId, float value)
    {
        // TODO: Apply quest progress or completion
        Debug.Log($"Quest {questId} progress changed by {value}");
    }

    private void ProcessPendingConsequences()
    {
        float currentTime = Time.time;
        List<string> completedConsequences = new List<string>();

        foreach (var timer in consequenceTimers)
        {
            if (currentTime >= timer.Value)
            {
                if (pendingConsequences.ContainsKey(timer.Key))
                {
                    foreach (var consequence in pendingConsequences[timer.Key])
                    {
                        // Apply the delayed consequence
                        Dictionary<string, float> consequenceDict = new Dictionary<string, float>
                        {
                            { consequence.attribute, consequence.value }
                        };
                        ApplyConsequences(consequenceDict);
                    }
                }
                completedConsequences.Add(timer.Key);
            }
        }

        // Remove completed consequences
        foreach (var id in completedConsequences)
        {
            pendingConsequences.Remove(id);
            consequenceTimers.Remove(id);
        }
    }

    private List<string> GetActiveCharacterIds()
    {
        // TODO: Get actual active character IDs from the game state
        return new List<string> { "char1", "char2", "char3" };
    }

    private Dictionary<string, int> GetInventory()
    {
        // TODO: Get actual inventory from the game state
        return new Dictionary<string, int>();
    }

    private Character FindCharacterById(string characterId)
    {
        // TODO: Find character by ID from the game state
        return null;
    }
} 