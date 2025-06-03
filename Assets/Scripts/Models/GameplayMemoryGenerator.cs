using System;
using System.Collections.Generic;
using UnityEngine;

public class GameplayMemoryGenerator
{
    private static Dictionary<string, List<MemoryTemplate>> eventMemories = new Dictionary<string, List<MemoryTemplate>>();
    private static Dictionary<string, List<MemoryTemplate>> relationshipMemories = new Dictionary<string, List<MemoryTemplate>>();
    
    static GameplayMemoryGenerator()
    {
        InitializeEventMemories();
        InitializeRelationshipMemories();
    }
    
    private static void InitializeEventMemories()
    {
        // Mission Success Memories
        AddEventMemory("mission_success", new MemoryTemplate
        {
            title = "Triumphant Return",
            description = "Successfully completed a dangerous mission against all odds.",
            category = "achievement",
            emotionalImpact = new Dictionary<string, float>
            {
                { "confidence", 1.5f },
                { "pride", 1.2f },
                { "teamwork", 1.0f }
            },
            isSignificant = true
        });
        
        // Mission Failure Memories
        AddEventMemory("mission_failure", new MemoryTemplate
        {
            title = "Costly Mistake",
            description = "Failed to complete a mission, resulting in serious consequences.",
            category = "loss",
            emotionalImpact = new Dictionary<string, float>
            {
                { "guilt", 1.8f },
                { "shame", 1.5f },
                { "determination", 1.2f }
            },
            isSignificant = true
        });
        
        // Resource Crisis Memories
        AddEventMemory("resource_crisis", new MemoryTemplate
        {
            title = "Desperate Times",
            description = "Faced a severe shortage of essential resources.",
            category = "survival",
            emotionalImpact = new Dictionary<string, float>
            {
                { "resourcefulness", 1.5f },
                { "stress", 1.8f },
                { "adaptability", 1.2f }
            },
            isSignificant = true
        });
        
        // Natural Disaster Memories
        AddEventMemory("natural_disaster", new MemoryTemplate
        {
            title = "Nature's Wrath",
            description = "Survived a devastating natural disaster.",
            category = "survival",
            emotionalImpact = new Dictionary<string, float>
            {
                { "resilience", 1.8f },
                { "fear", 1.5f },
                { "gratitude", 1.2f }
            },
            isSignificant = true
        });
    }
    
    private static void InitializeRelationshipMemories()
    {
        // Trust Building Memories
        AddRelationshipMemory("trust_building", new MemoryTemplate
        {
            title = "A Leap of Faith",
            description = "Put my trust in {other} during a critical moment, and they didn't let me down.",
            category = "friendship",
            emotionalImpact = new Dictionary<string, float>
            {
                { "trust", 2.0f },
                { "loyalty", 1.5f },
                { "friendship", 1.8f }
            },
            isSignificant = true
        });
        
        // Betrayal Memories
        AddRelationshipMemory("betrayal", new MemoryTemplate
        {
            title = "Broken Trust",
            description = "Discovered that {other} had betrayed my trust for personal gain.",
            category = "betrayal",
            emotionalImpact = new Dictionary<string, float>
            {
                { "trust", -2.0f },
                { "anger", 1.8f },
                { "bitterness", 1.5f }
            },
            isSignificant = true
        });
        
        // Sacrifice Memories
        AddRelationshipMemory("sacrifice", new MemoryTemplate
        {
            title = "Selfless Act",
            description = "{other} risked their life to save mine during a dangerous situation.",
            category = "sacrifice",
            emotionalImpact = new Dictionary<string, float>
            {
                { "gratitude", 2.0f },
                { "loyalty", 1.8f },
                { "friendship", 1.5f }
            },
            isSignificant = true
        });
        
        // Conflict Memories
        AddRelationshipMemory("conflict", new MemoryTemplate
        {
            title = "Heated Dispute",
            description = "Had a serious argument with {other} that tested our relationship.",
            category = "conflict",
            emotionalImpact = new Dictionary<string, float>
            {
                { "tension", 1.5f },
                { "understanding", 1.2f },
                { "growth", 1.0f }
            },
            isSignificant = true
        });
    }
    
    private static void AddEventMemory(string eventType, MemoryTemplate memory)
    {
        if (!eventMemories.ContainsKey(eventType))
        {
            eventMemories[eventType] = new List<MemoryTemplate>();
        }
        eventMemories[eventType].Add(memory);
    }
    
    private static void AddRelationshipMemory(string relationshipType, MemoryTemplate memory)
    {
        if (!relationshipMemories.ContainsKey(relationshipType))
        {
            relationshipMemories[relationshipType] = new List<MemoryTemplate>();
        }
        relationshipMemories[relationshipType].Add(memory);
    }
    
    public static Memory GenerateEventMemory(string eventType, List<string> involvedCompanions, string location)
    {
        if (!eventMemories.ContainsKey(eventType) || eventMemories[eventType].Count == 0)
        {
            return null;
        }
        
        // Select a random memory template for this event type
        int index = UnityEngine.Random.Range(0, eventMemories[eventType].Count);
        var template = eventMemories[eventType][index];
        
        return CreateMemoryFromTemplate(template, involvedCompanions, location);
    }
    
    public static Memory GenerateRelationshipMemory(string relationshipType, string companionId, string otherCompanionId, string location)
    {
        if (!relationshipMemories.ContainsKey(relationshipType) || relationshipMemories[relationshipType].Count == 0)
        {
            return null;
        }
        
        // Select a random memory template for this relationship type
        int index = UnityEngine.Random.Range(0, relationshipMemories[relationshipType].Count);
        var template = relationshipMemories[relationshipType][index];
        
        List<string> involvedCompanions = new List<string> { companionId, otherCompanionId };
        return CreateMemoryFromTemplate(template, involvedCompanions, location);
    }
    
    private static Memory CreateMemoryFromTemplate(MemoryTemplate template, List<string> involvedCompanions, string location)
    {
        Memory memory = new Memory
        {
            memoryId = Guid.NewGuid().ToString(),
            title = template.title,
            description = template.description,
            timestamp = DateTime.Now,
            category = template.category,
            emotionalImpact = new Dictionary<string, float>(template.emotionalImpact),
            involvedCompanions = new List<string>(involvedCompanions),
            location = location,
            isSignificant = template.isSignificant,
            iconName = template.category
        };
        
        return memory;
    }
    
    public static List<Memory> GenerateMemoriesForEvent(string eventType, List<string> involvedCompanions, string location, int count)
    {
        List<Memory> memories = new List<Memory>();
        
        for (int i = 0; i < count; i++)
        {
            Memory memory = GenerateEventMemory(eventType, involvedCompanions, location);
            if (memory != null)
            {
                memories.Add(memory);
            }
        }
        
        return memories;
    }
    
    public static List<Memory> GenerateMemoriesForRelationship(string relationshipType, string companionId, string otherCompanionId, string location, int count)
    {
        List<Memory> memories = new List<Memory>();
        
        for (int i = 0; i < count; i++)
        {
            Memory memory = GenerateRelationshipMemory(relationshipType, companionId, otherCompanionId, location);
            if (memory != null)
            {
                memories.Add(memory);
            }
        }
        
        return memories;
    }
} 