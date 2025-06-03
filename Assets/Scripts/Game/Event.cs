using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class GameEvent
{
    public string id;
    public string title;
    public string description;
    public EventType type;
    public List<EventChoice> choices;
    public Dictionary<string, float> requirements;
    public Dictionary<string, float> consequences;
    public bool isCompleted;
    public float probability = 1.0f;
    public float cooldown = 0f;
    public float lastTriggered = 0f;
    public List<string> triggerEvents;
    public List<string> blockingEvents;
    public List<string> requiredCharacters;
    public List<string> requiredLocations;
    public List<string> requiredItems;
    public bool isRepeatable = true;
    public int maxOccurrences = -1;
    public int currentOccurrences = 0;
    public string eventImage;
    public string eventSound;
    public string eventAnimation;

    public GameEvent()
    {
        id = Guid.NewGuid().ToString();
        choices = new List<EventChoice>();
        requirements = new Dictionary<string, float>();
        consequences = new Dictionary<string, float>();
        triggerEvents = new List<string>();
        blockingEvents = new List<string>();
        requiredCharacters = new List<string>();
        requiredLocations = new List<string>();
        requiredItems = new List<string>();
        isCompleted = false;
    }

    public bool CanTrigger(float currentTime, List<string> activeCharacters, List<string> currentLocation, Dictionary<string, int> inventory)
    {
        // Check cooldown
        if (cooldown > 0 && currentTime - lastTriggered < cooldown)
            return false;

        // Check if event has reached its maximum occurrences
        if (maxOccurrences > 0 && currentOccurrences >= maxOccurrences)
            return false;

        // Check required characters
        foreach (string characterId in requiredCharacters)
        {
            if (!activeCharacters.Contains(characterId))
                return false;
        }

        // Check required locations
        if (requiredLocations.Count > 0 && !requiredLocations.Contains(currentLocation[0]))
            return false;

        // Check required items
        foreach (string itemId in requiredItems)
        {
            if (!inventory.ContainsKey(itemId) || inventory[itemId] <= 0)
                return false;
        }

        // Check probability
        if (UnityEngine.Random.value > probability)
            return false;

        return true;
    }

    public void Trigger(float currentTime)
    {
        lastTriggered = currentTime;
        currentOccurrences++;
    }
}

[Serializable]
public class EventChoice
{
    public string id;
    public string text;
    public Dictionary<string, float> requirements;
    public Dictionary<string, float> consequences;
    public List<string> followUpEvents;
    public float probability = 1.0f;
    public string choiceImage;
    public string choiceSound;
    public string choiceAnimation;
    public bool isHidden = false;
    public string hiddenRequirement;
    public float hiddenRequirementValue;

    public EventChoice()
    {
        id = Guid.NewGuid().ToString();
        requirements = new Dictionary<string, float>();
        consequences = new Dictionary<string, float>();
        followUpEvents = new List<string>();
    }

    public bool IsAvailable(Character character, Dictionary<string, float> gameState)
    {
        if (isHidden)
        {
            if (string.IsNullOrEmpty(hiddenRequirement))
                return false;

            if (!gameState.ContainsKey(hiddenRequirement) || 
                gameState[hiddenRequirement] < hiddenRequirementValue)
                return false;
        }

        foreach (var requirement in requirements)
        {
            if (!gameState.ContainsKey(requirement.Key) || 
                gameState[requirement.Key] < requirement.Value)
                return false;
        }

        return true;
    }
}

public enum EventType
{
    Random,
    Story,
    Character,
    Location,
    Resource,
    Relationship,
    Quest,
    Achievement,
    Combat,
    Exploration,
    Social,
    Survival,
    Historical
}

[Serializable]
public class EventConsequence
{
    public string targetId;
    public string attribute;
    public float value;
    public ConsequenceType type;
    public string message;
    public bool isImmediate = true;
    public float delay = 0f;
    public float duration = 0f;
    public bool isPermanent = false;
}

public enum ConsequenceType
{
    Add,
    Subtract,
    Set,
    Multiply,
    Divide,
    AddRelationship,
    RemoveRelationship,
    AddItem,
    RemoveItem,
    UnlockAbility,
    LockAbility,
    TriggerEvent,
    CompleteQuest,
    FailQuest,
    AddAchievement,
    AddTrait,
    RemoveTrait
} 