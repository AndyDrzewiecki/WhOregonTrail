using System;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;

[System.Serializable]
public class EmotionalState
{
    public int trust; // 0-100
    public int loyalty; // 0-100
    public int stress; // 0-100
    public int morale; // 0-100
    public int rashImmunity; // 0-100
    public List<string> traits;
    public string bio;
    public string role;
}

[System.Serializable]
public class MemoryEntry
{
    public int day;
    public string missionId;
    public string missionType;
    public string outcome;
    public int trustChange;
    public int loyaltyChange;
    public int stressChange;
    public int rashExposure;
    public string description;
    public DateTime timestamp;
    public List<string> tags;
    public float emotionalImpact;
    public bool isHidden;
    public DateTime lastReferenced;
    
    public MemoryEntry()
    {
        tags = new List<string>();
        emotionalImpact = 0.5f; // Default impact
        isHidden = false;
        lastReferenced = DateTime.Now;
    }
    
    public void AddTag(string tag)
    {
        if (!tags.Contains(tag))
        {
            tags.Add(tag);
        }
    }
    
    public void ReferenceMemory()
    {
        lastReferenced = DateTime.Now;
        // Reinforce memory by increasing its impact slightly
        emotionalImpact = Mathf.Min(emotionalImpact + 0.1f, 1.0f);
    }
    
    public bool ShouldDecay(int daysThreshold)
    {
        if (emotionalImpact > 0.7f) return false; // High impact memories don't decay
        
        TimeSpan timeSinceLastReferenced = DateTime.Now - lastReferenced;
        return timeSinceLastReferenced.TotalDays > daysThreshold;
    }
}

[System.Serializable]
public class Memory
{
    public string memoryId;
    public string title;
    public string description;
    public DateTime timestamp;
    public string category;
    public Dictionary<string, float> emotionalImpact;
    public List<string> involvedCompanions;
    public string location;
    public bool isSignificant;
    public string iconName;
    
    public Memory()
    {
        emotionalImpact = new Dictionary<string, float>();
        involvedCompanions = new List<string>();
    }
}

[System.Serializable]
public class MemoryCategory
{
    public string categoryId;
    public string categoryName;
    public string description;
    public float emotionalWeight;
    public List<string> relatedTraits;
    public string iconName;
    
    public MemoryCategory()
    {
        relatedTraits = new List<string>();
    }
}

public class CompanionMemorySystem
{
    private static Dictionary<string, MemoryCategory> categories = new Dictionary<string, MemoryCategory>();
    
    static CompanionMemorySystem()
    {
        InitializeCategories();
    }
    
    private static void InitializeCategories()
    {
        // Survival Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "survival",
            categoryName = "Survival",
            description = "Memories of life-threatening situations and close calls.",
            emotionalWeight = 1.5f,
            relatedTraits = new List<string>
            {
                "resilient",
                "brave",
                "resourceful"
            },
            iconName = "survival"
        });
        
        // Loss Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "loss",
            categoryName = "Loss",
            description = "Memories of losing loved ones or important possessions.",
            emotionalWeight = 2.0f,
            relatedTraits = new List<string>
            {
                "resilient",
                "empathetic",
                "loyal"
            },
            iconName = "loss"
        });
        
        // Achievement Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "achievement",
            categoryName = "Achievement",
            description = "Memories of personal accomplishments and successes.",
            emotionalWeight = 1.2f,
            relatedTraits = new List<string>
            {
                "leader",
                "determined",
                "optimistic"
            },
            iconName = "achievement"
        });
        
        // Betrayal Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "betrayal",
            categoryName = "Betrayal",
            description = "Memories of being betrayed or betraying others.",
            emotionalWeight = 2.5f,
            relatedTraits = new List<string>
            {
                "loyal",
                "opportunistic",
                "callous"
            },
            iconName = "betrayal"
        });
        
        // Friendship Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "friendship",
            categoryName = "Friendship",
            description = "Memories of forming bonds and helping others.",
            emotionalWeight = 1.3f,
            relatedTraits = new List<string>
            {
                "empathetic",
                "loyal",
                "diplomatic"
            },
            iconName = "friendship"
        });
        
        // Conflict Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "conflict",
            categoryName = "Conflict",
            description = "Memories of arguments, fights, or disagreements.",
            emotionalWeight = 1.4f,
            relatedTraits = new List<string>
            {
                "diplomatic",
                "confrontational",
                "resilient"
            },
            iconName = "conflict"
        });
        
        // Discovery Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "discovery",
            categoryName = "Discovery",
            description = "Memories of learning new things or exploring new places.",
            emotionalWeight = 1.1f,
            relatedTraits = new List<string>
            {
                "curious",
                "adaptable",
                "optimistic"
            },
            iconName = "discovery"
        });
        
        // Sacrifice Memories
        AddCategory(new MemoryCategory
        {
            categoryId = "sacrifice",
            categoryName = "Sacrifice",
            description = "Memories of giving up something important for others.",
            emotionalWeight = 1.8f,
            relatedTraits = new List<string>
            {
                "loyal",
                "empathetic",
                "selfless"
            },
            iconName = "sacrifice"
        });
    }
    
    private static void AddCategory(MemoryCategory category)
    {
        categories[category.categoryId] = category;
    }
    
    public static MemoryCategory GetCategory(string categoryId)
    {
        if (categories.TryGetValue(categoryId, out var category))
        {
            return category;
        }
        return null;
    }
    
    public static List<MemoryCategory> GetAllCategories()
    {
        return new List<MemoryCategory>(categories.Values);
    }
    
    public static float GetEmotionalWeight(string categoryId)
    {
        if (categories.TryGetValue(categoryId, out var category))
        {
            return category.emotionalWeight;
        }
        return 1.0f;
    }
    
    public static List<string> GetRelatedTraits(string categoryId)
    {
        if (categories.TryGetValue(categoryId, out var category))
        {
            return category.relatedTraits;
        }
        return new List<string>();
    }
    
    public static Dictionary<string, float> CalculateMemoryImpact(Memory memory, List<string> companionTraits)
    {
        Dictionary<string, float> impact = new Dictionary<string, float>();
        
        // Start with the base emotional impact of the memory
        foreach (var emotional in memory.emotionalImpact)
        {
            impact[emotional.Key] = emotional.Value;
        }
        
        // Apply category weight
        float categoryWeight = GetEmotionalWeight(memory.category);
        foreach (var emotional in impact.Keys.ToList())
        {
            impact[emotional] *= categoryWeight;
        }
        
        // Apply trait modifiers
        List<string> relatedTraits = GetRelatedTraits(memory.category);
        foreach (var trait in companionTraits)
        {
            if (relatedTraits.Contains(trait))
            {
                // Traits related to the memory category amplify the impact
                foreach (var emotional in impact.Keys.ToList())
                {
                    impact[emotional] *= 1.2f;
                }
            }
        }
        
        // Apply significance modifier
        if (memory.isSignificant)
        {
            foreach (var emotional in impact.Keys.ToList())
            {
                impact[emotional] *= 1.5f;
            }
        }
        
        return impact;
    }
    
    public static Memory CreateMemory(string title, string description, string category, Dictionary<string, float> emotionalImpact, List<string> involvedCompanions, string location, bool isSignificant = false)
    {
        Memory memory = new Memory
        {
            memoryId = Guid.NewGuid().ToString(),
            title = title,
            description = description,
            timestamp = DateTime.Now,
            category = category,
            emotionalImpact = emotionalImpact,
            involvedCompanions = involvedCompanions,
            location = location,
            isSignificant = isSignificant,
            iconName = GetCategory(category)?.iconName ?? "default"
        };
        
        return memory;
    }
    
    public static string FormatMemoryDescription(Memory memory, string companionName)
    {
        string description = memory.description;
        
        // Replace placeholders with actual names
        foreach (var companion in memory.involvedCompanions)
        {
            if (companion != companionName)
            {
                description = description.Replace("{other}", companion);
            }
        }
        
        return description;
    }
    
    public static List<Memory> FilterMemoriesByCompanion(List<Memory> memories, string companionId)
    {
        return memories.Where(m => m.involvedCompanions.Contains(companionId)).ToList();
    }
    
    public static List<Memory> FilterMemoriesByCategory(List<Memory> memories, string category)
    {
        return memories.Where(m => m.category == category).ToList();
    }
    
    public static List<Memory> FilterSignificantMemories(List<Memory> memories)
    {
        return memories.Where(m => m.isSignificant).ToList();
    }
    
    public static List<Memory> GetRecentMemories(List<Memory> memories, int days)
    {
        DateTime cutoff = DateTime.Now.AddDays(-days);
        return memories.Where(m => m.timestamp >= cutoff).ToList();
    }
    
    public static Dictionary<string, float> GetCombinedMemoryImpact(List<Memory> memories, List<string> companionTraits)
    {
        Dictionary<string, float> combinedImpact = new Dictionary<string, float>();
        
        foreach (var memory in memories)
        {
            Dictionary<string, float> memoryImpact = CalculateMemoryImpact(memory, companionTraits);
            
            foreach (var emotional in memoryImpact)
            {
                if (!combinedImpact.ContainsKey(emotional.Key))
                {
                    combinedImpact[emotional.Key] = 0;
                }
                
                combinedImpact[emotional.Key] += emotional.Value;
            }
        }
        
        return combinedImpact;
    }
    
    public static string GetMemorySummary(List<Memory> memories)
    {
        if (memories.Count == 0)
        {
            return "No memories to recall.";
        }
        
        Dictionary<string, int> categoryCounts = new Dictionary<string, int>();
        foreach (var memory in memories)
        {
            if (!categoryCounts.ContainsKey(memory.category))
            {
                categoryCounts[memory.category] = 0;
            }
            
            categoryCounts[memory.category]++;
        }
        
        string summary = "Memory Summary:\n";
        foreach (var category in categoryCounts)
        {
            MemoryCategory memoryCategory = GetCategory(category.Key);
            summary += $"- {memoryCategory.categoryName}: {category.Value} memories\n";
        }
        
        int significantCount = memories.Count(m => m.isSignificant);
        summary += $"\nSignificant memories: {significantCount}";
        
        return summary;
    }
}

[System.Serializable]
public class CompanionMemory
{
    public string companionId;
    public string companionName;
    public EmotionalState emotionalState;
    public List<MemoryEntry> memoryLog;
    public Dictionary<string, int> relationshipScores; // Key: other companion ID, Value: relationship score (-100 to 100)
    public List<Memory> significantMemories; // Store significant memories separately for quick access

    public CompanionMemory(string id, string name, string role, string bio, List<string> traits)
    {
        companionId = id;
        companionName = name;
        emotionalState = new EmotionalState
        {
            trust = 50,
            loyalty = 50,
            stress = 30,
            morale = 70,
            rashImmunity = 0,
            traits = traits,
            bio = bio,
            role = role
        };
        memoryLog = new List<MemoryEntry>();
        relationshipScores = new Dictionary<string, int>();
        significantMemories = new List<Memory>();
    }

    public void AddMemoryEntry(MemoryEntry entry)
    {
        // Update emotional state
        emotionalState.trust = Mathf.Clamp(emotionalState.trust + entry.trustChange, 0, 100);
        emotionalState.loyalty = Mathf.Clamp(emotionalState.loyalty + entry.loyaltyChange, 0, 100);
        emotionalState.stress = Mathf.Clamp(emotionalState.stress + entry.stressChange, 0, 100);
        
        // Update rash immunity based on exposure
        if (entry.rashExposure > 0)
        {
            emotionalState.rashImmunity = Mathf.Clamp(emotionalState.rashImmunity + entry.rashExposure, 0, 100);
        }
        
        // Add to memory log
        entry.timestamp = DateTime.Now;
        memoryLog.Add(entry);

        // Save memories after adding new entry
        SaveMemories();
    }

    public void AddSignificantMemory(Memory memory)
    {
        significantMemories.Add(memory);
        SaveMemories();
    }

    public void UpdateRelationship(string otherCompanionId, int change)
    {
        if (!relationshipScores.ContainsKey(otherCompanionId))
        {
            relationshipScores[otherCompanionId] = 0;
        }
        
        relationshipScores[otherCompanionId] = Mathf.Clamp(relationshipScores[otherCompanionId] + change, -100, 100);
        SaveMemories();
    }

    public void SaveMemories()
    {
        MemoryPersistenceManager.Instance.SaveCharacterMemories(companionId, this);
    }

    public static CompanionMemory LoadMemories(string characterId)
    {
        return MemoryPersistenceManager.Instance.LoadCharacterMemories(characterId);
    }

    public List<Memory> GetRecentMemories(int count)
    {
        return memoryLog
            .OrderByDescending(m => m.timestamp)
            .Take(count)
            .Select(m => new Memory
            {
                memoryId = Guid.NewGuid().ToString(),
                title = m.missionType,
                description = m.description,
                timestamp = m.timestamp,
                category = DetermineMemoryCategory(m),
                emotionalImpact = new Dictionary<string, float>
                {
                    { "trust", m.trustChange },
                    { "loyalty", m.loyaltyChange },
                    { "stress", m.stressChange }
                },
                involvedCompanions = new List<string> { companionId },
                location = "Various",
                isSignificant = false
            })
            .ToList();
    }

    private string DetermineMemoryCategory(MemoryEntry entry)
    {
        // Determine category based on emotional changes and mission type
        if (entry.trustChange > 10 || entry.loyaltyChange > 10)
            return "friendship";
        if (entry.trustChange < -10 || entry.loyaltyChange < -10)
            return "betrayal";
        if (entry.stressChange > 15)
            return "survival";
        if (entry.missionType.Contains("success", StringComparison.OrdinalIgnoreCase))
            return "achievement";
        if (entry.missionType.Contains("failure", StringComparison.OrdinalIgnoreCase))
            return "loss";
        return "general";
    }

    public string GetRelationshipDescription(string otherCompanionId)
    {
        if (!relationshipScores.ContainsKey(otherCompanionId))
            return "Stranger";
            
        int score = relationshipScores[otherCompanionId];
        if (score >= 80) return "Close Friend";
        if (score >= 60) return "Friend";
        if (score >= 40) return "Acquaintance";
        if (score >= 20) return "Neutral";
        if (score >= 0) return "Distant";
        if (score >= -20) return "Unfriendly";
        if (score >= -40) return "Rival";
        if (score >= -60) return "Enemy";
        return "Mortal Enemy";
    }

    public string GetEmotionalStateDescription()
    {
        string state = "";
        
        // Trust level
        if (emotionalState.trust >= 80)
            state += "Very Trusting, ";
        else if (emotionalState.trust >= 50)
            state += "Trusting, ";
        else if (emotionalState.trust >= 20)
            state += "Cautious, ";
        else
            state += "Distrustful, ";
        
        // Loyalty level
        if (emotionalState.loyalty >= 80)
            state += "Extremely Loyal, ";
        else if (emotionalState.loyalty >= 50)
            state += "Loyal, ";
        else if (emotionalState.loyalty >= 20)
            state += "Fairly Loyal, ";
        else
            state += "Disloyal, ";
        
        // Stress level
        if (emotionalState.stress >= 80)
            state += "Extremely Stressed";
        else if (emotionalState.stress >= 50)
            state += "Stressed";
        else if (emotionalState.stress >= 20)
            state += "Slightly Stressed";
        else
            state += "Calm";
        
        return state;
    }
} 