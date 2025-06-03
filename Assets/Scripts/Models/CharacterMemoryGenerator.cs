using System;
using System.Collections.Generic;
using UnityEngine;

public class CharacterMemoryGenerator
{
    private static Dictionary<string, List<MemoryTemplate>> backgroundMemories = new Dictionary<string, List<MemoryTemplate>>();
    private static Dictionary<string, List<MemoryTemplate>> traitMemories = new Dictionary<string, List<MemoryTemplate>>();
    
    static CharacterMemoryGenerator()
    {
        InitializeBackgroundMemories();
        InitializeTraitMemories();
    }
    
    private static void InitializeBackgroundMemories()
    {
        // Frontier Family Memories
        AddBackgroundMemory("frontier_family", new MemoryTemplate
        {
            title = "The Great Storm",
            description = "Survived a devastating storm that destroyed our family's cabin. Had to rebuild everything from scratch.",
            category = "survival",
            emotionalImpact = new Dictionary<string, float>
            {
                { "resilience", 1.5f },
                { "family_bond", 2.0f },
                { "independence", 1.2f }
            },
            requiredTraits = new List<string> { "resilient" },
            isSignificant = true
        });
        
        // Military Veteran Memories
        AddBackgroundMemory("military_veteran", new MemoryTemplate
        {
            title = "The Last Battle",
            description = "Lost many comrades in a fierce battle. The guilt of survival haunts me to this day.",
            category = "loss",
            emotionalImpact = new Dictionary<string, float>
            {
                { "guilt", 2.0f },
                { "loyalty", 1.5f },
                { "trauma", 1.8f }
            },
            requiredTraits = new List<string> { "loyal" },
            isSignificant = true
        });
        
        // Religious Missionary Memories
        AddBackgroundMemory("religious_missionary", new MemoryTemplate
        {
            title = "The Conversion",
            description = "Successfully converted a whole village to my faith. The joy of bringing salvation to others.",
            category = "achievement",
            emotionalImpact = new Dictionary<string, float>
            {
                { "faith", 2.0f },
                { "purpose", 1.5f },
                { "confidence", 1.2f }
            },
            requiredTraits = new List<string> { "charismatic" },
            isSignificant = true
        });
        
        // Native Guide Memories
        AddBackgroundMemory("native_guide", new MemoryTemplate
        {
            title = "The Sacred Ceremony",
            description = "Participated in an ancient tribal ceremony. The connection to my ancestors was overwhelming.",
            category = "discovery",
            emotionalImpact = new Dictionary<string, float>
            {
                { "cultural_identity", 2.0f },
                { "spirituality", 1.5f },
                { "pride", 1.2f }
            },
            requiredTraits = new List<string> { "spiritual" },
            isSignificant = true
        });
        
        // City Dweller Memories
        AddBackgroundMemory("city_dweller", new MemoryTemplate
        {
            title = "The Great Fire",
            description = "Lost everything in a city fire. Started over with nothing but the clothes on my back.",
            category = "loss",
            emotionalImpact = new Dictionary<string, float>
            {
                { "resilience", 1.5f },
                { "adaptability", 1.8f },
                { "materialism", -1.0f }
            },
            requiredTraits = new List<string> { "adaptable" },
            isSignificant = true
        });
        
        // Criminal on the Run Memories
        AddBackgroundMemory("criminal_on_the_run", new MemoryTemplate
        {
            title = "The Betrayal",
            description = "Betrayed by my closest friend who turned me in for the reward money.",
            category = "betrayal",
            emotionalImpact = new Dictionary<string, float>
            {
                { "trust", -2.0f },
                { "paranoia", 1.8f },
                { "revenge", 1.5f }
            },
            requiredTraits = new List<string> { "opportunistic" },
            isSignificant = true
        });
    }
    
    private static void InitializeTraitMemories()
    {
        // Brave Trait Memories
        AddTraitMemory("brave", new MemoryTemplate
        {
            title = "The Bear Attack",
            description = "Faced down a charging bear to protect others. The adrenaline still courses through my veins.",
            category = "survival",
            emotionalImpact = new Dictionary<string, float>
            {
                { "courage", 1.8f },
                { "confidence", 1.5f },
                { "heroism", 1.2f }
            },
            isSignificant = true
        });
        
        // Loyal Trait Memories
        AddTraitMemory("loyal", new MemoryTemplate
        {
            title = "The Promise",
            description = "Kept a dying friend's promise to deliver a message to their family, no matter the cost.",
            category = "friendship",
            emotionalImpact = new Dictionary<string, float>
            {
                { "loyalty", 2.0f },
                { "honor", 1.5f },
                { "trust", 1.2f }
            },
            isSignificant = true
        });
        
        // Empathetic Trait Memories
        AddTraitMemory("empathetic", new MemoryTemplate
        {
            title = "The Orphan",
            description = "Took in an orphaned child and raised them as my own, despite having nothing myself.",
            category = "sacrifice",
            emotionalImpact = new Dictionary<string, float>
            {
                { "compassion", 2.0f },
                { "responsibility", 1.5f },
                { "love", 1.8f }
            },
            isSignificant = true
        });
    }
    
    private static void AddBackgroundMemory(string background, MemoryTemplate memory)
    {
        if (!backgroundMemories.ContainsKey(background))
        {
            backgroundMemories[background] = new List<MemoryTemplate>();
        }
        backgroundMemories[background].Add(memory);
    }
    
    private static void AddTraitMemory(string trait, MemoryTemplate memory)
    {
        if (!traitMemories.ContainsKey(trait))
        {
            traitMemories[trait] = new List<MemoryTemplate>();
        }
        traitMemories[trait].Add(memory);
    }
    
    public static List<Memory> GenerateCharacterMemories(string background, List<string> traits, int count)
    {
        List<Memory> memories = new List<Memory>();
        List<MemoryTemplate> availableMemories = new List<MemoryTemplate>();
        
        // Add background memories
        if (backgroundMemories.ContainsKey(background))
        {
            availableMemories.AddRange(backgroundMemories[background]);
        }
        
        // Add trait memories
        foreach (var trait in traits)
        {
            if (traitMemories.ContainsKey(trait))
            {
                availableMemories.AddRange(traitMemories[trait]);
            }
        }
        
        // Shuffle and select memories
        availableMemories.Shuffle();
        count = Mathf.Min(count, availableMemories.Count);
        
        for (int i = 0; i < count; i++)
        {
            var template = availableMemories[i];
            if (HasRequiredTraits(template, traits))
            {
                memories.Add(CreateMemoryFromTemplate(template));
            }
        }
        
        return memories;
    }
    
    private static bool HasRequiredTraits(MemoryTemplate template, List<string> traits)
    {
        if (template.requiredTraits == null || template.requiredTraits.Count == 0)
        {
            return true;
        }
        
        return template.requiredTraits.Exists(trait => traits.Contains(trait));
    }
    
    private static Memory CreateMemoryFromTemplate(MemoryTemplate template)
    {
        return new Memory
        {
            memoryId = Guid.NewGuid().ToString(),
            title = template.title,
            description = template.description,
            timestamp = DateTime.Now.AddDays(-UnityEngine.Random.Range(365, 3650)), // 1-10 years ago
            category = template.category,
            emotionalImpact = new Dictionary<string, float>(template.emotionalImpact),
            involvedCompanions = new List<string>(),
            location = "Various",
            isSignificant = template.isSignificant,
            iconName = template.category
        };
    }
}

[System.Serializable]
public class MemoryTemplate
{
    public string title;
    public string description;
    public string category;
    public Dictionary<string, float> emotionalImpact;
    public List<string> requiredTraits;
    public bool isSignificant;
}

public static class ListExtensions
{
    public static void Shuffle<T>(this List<T> list)
    {
        int n = list.Count;
        while (n > 1)
        {
            n--;
            int k = UnityEngine.Random.Range(0, n + 1);
            T value = list[k];
            list[k] = list[n];
            list[n] = value;
        }
    }
} 