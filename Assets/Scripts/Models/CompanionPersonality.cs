using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class PersonalityTrait
{
    public string traitId;
    public string traitName;
    public string description;
    public Dictionary<string, float> emotionalModifiers;
    public List<string> compatibleTraits;
    public List<string> incompatibleTraits;
    public string iconName;
    
    public PersonalityTrait()
    {
        emotionalModifiers = new Dictionary<string, float>();
        compatibleTraits = new List<string>();
        incompatibleTraits = new List<string>();
    }
}

public class CompanionPersonality
{
    private static Dictionary<string, PersonalityTrait> traits = new Dictionary<string, PersonalityTrait>();
    
    static CompanionPersonality()
    {
        InitializeTraits();
    }
    
    private static void InitializeTraits()
    {
        // Positive Traits
        AddTrait(new PersonalityTrait
        {
            traitId = "optimistic",
            traitName = "Optimistic",
            description = "Sees the bright side of situations, even in difficult times.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.8f },
                { "morale", 1.2f }
            },
            compatibleTraits = new List<string>
            {
                "resilient",
                "empathetic",
                "leader"
            },
            incompatibleTraits = new List<string>
            {
                "pessimistic",
                "cynical"
            },
            iconName = "optimistic"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "resilient",
            traitName = "Resilient",
            description = "Bounces back quickly from setbacks and challenges.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.7f },
                { "loyalty", 1.1f }
            },
            compatibleTraits = new List<string>
            {
                "optimistic",
                "determined",
                "adaptable"
            },
            incompatibleTraits = new List<string>
            {
                "fragile",
                "anxious"
            },
            iconName = "resilient"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "empathetic",
            traitName = "Empathetic",
            description = "Deeply understands and shares the feelings of others.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.2f },
                { "stress", 1.1f }
            },
            compatibleTraits = new List<string>
            {
                "optimistic",
                "loyal",
                "diplomatic"
            },
            incompatibleTraits = new List<string>
            {
                "callous",
                "selfish"
            },
            iconName = "empathetic"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "leader",
            traitName = "Natural Leader",
            description = "Inspiring and capable of guiding others through challenges.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.2f },
                { "morale", 1.1f }
            },
            compatibleTraits = new List<string>
            {
                "optimistic",
                "resilient",
                "diplomatic"
            },
            incompatibleTraits = new List<string>
            {
                "submissive",
                "rebellious"
            },
            iconName = "leader"
        });
        
        // Neutral Traits
        AddTrait(new PersonalityTrait
        {
            traitId = "adaptable",
            traitName = "Adaptable",
            description = "Quickly adjusts to new situations and environments.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.9f },
                { "trust", 1.0f }
            },
            compatibleTraits = new List<string>
            {
                "resilient",
                "curious",
                "pragmatic"
            },
            incompatibleTraits = new List<string>
            {
                "rigid",
                "traditional"
            },
            iconName = "adaptable"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "pragmatic",
            traitName = "Pragmatic",
            description = "Practical and focused on what works rather than ideals.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.9f },
                { "loyalty", 0.9f }
            },
            compatibleTraits = new List<string>
            {
                "adaptable",
                "resourceful",
                "analytical"
            },
            incompatibleTraits = new List<string>
            {
                "idealistic",
                "impulsive"
            },
            iconName = "pragmatic"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "curious",
            traitName = "Curious",
            description = "Eager to learn and explore new things.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.0f },
                { "trust", 1.1f }
            },
            compatibleTraits = new List<string>
            {
                "adaptable",
                "optimistic",
                "analytical"
            },
            incompatibleTraits = new List<string>
            {
                "cautious",
                "traditional"
            },
            iconName = "curious"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "diplomatic",
            traitName = "Diplomatic",
            description = "Skilled at resolving conflicts and finding common ground.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.1f },
                { "stress", 0.9f }
            },
            compatibleTraits = new List<string>
            {
                "empathetic",
                "leader",
                "analytical"
            },
            incompatibleTraits = new List<string>
            {
                "confrontational",
                "impulsive"
            },
            iconName = "diplomatic"
        });
        
        // Negative Traits
        AddTrait(new PersonalityTrait
        {
            traitId = "pessimistic",
            traitName = "Pessimistic",
            description = "Tends to expect the worst outcomes in situations.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.3f },
                { "morale", 0.8f }
            },
            compatibleTraits = new List<string>
            {
                "cautious",
                "analytical",
                "prepared"
            },
            incompatibleTraits = new List<string>
            {
                "optimistic",
                "impulsive"
            },
            iconName = "pessimistic"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "anxious",
            traitName = "Anxious",
            description = "Easily worried and stressed by uncertainty.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.4f },
                { "trust", 0.8f }
            },
            compatibleTraits = new List<string>
            {
                "cautious",
                "prepared",
                "analytical"
            },
            incompatibleTraits = new List<string>
            {
                "resilient",
                "impulsive"
            },
            iconName = "anxious"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "callous",
            traitName = "Callous",
            description = "Insensitive to the feelings and needs of others.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 0.7f },
                { "loyalty", 0.8f }
            },
            compatibleTraits = new List<string>
            {
                "pragmatic",
                "selfish",
                "ruthless"
            },
            incompatibleTraits = new List<string>
            {
                "empathetic",
                "loyal"
            },
            iconName = "callous"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "impulsive",
            traitName = "Impulsive",
            description = "Acts quickly without considering consequences.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.2f },
                { "trust", 0.9f }
            },
            compatibleTraits = new List<string>
            {
                "adaptable",
                "resourceful",
                "brave"
            },
            incompatibleTraits = new List<string>
            {
                "cautious",
                "analytical"
            },
            iconName = "impulsive"
        });
        
        // Special Traits
        AddTrait(new PersonalityTrait
        {
            traitId = "superstitious",
            traitName = "Superstitious",
            description = "Believes in omens, signs, and supernatural influences.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.2f },
                { "trust", 0.9f }
            },
            compatibleTraits = new List<string>
            {
                "cautious",
                "traditional",
                "observant"
            },
            incompatibleTraits = new List<string>
            {
                "skeptical",
                "analytical"
            },
            iconName = "superstitious"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "gambler",
            traitName = "Gambler",
            description = "Willing to take risks for potentially greater rewards.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.1f },
                { "morale", 1.1f }
            },
            compatibleTraits = new List<string>
            {
                "optimistic",
                "impulsive",
                "resourceful"
            },
            incompatibleTraits = new List<string>
            {
                "cautious",
                "pessimistic"
            },
            iconName = "gambler"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "loyal",
            traitName = "Loyal",
            description = "Unwavering in commitment to friends and allies.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.3f },
                { "trust", 1.1f }
            },
            compatibleTraits = new List<string>
            {
                "empathetic",
                "resilient",
                "brave"
            },
            incompatibleTraits = new List<string>
            {
                "selfish",
                "opportunistic"
            },
            iconName = "loyal"
        });
        
        AddTrait(new PersonalityTrait
        {
            traitId = "opportunistic",
            traitName = "Opportunistic",
            description = "Takes advantage of situations for personal gain.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 0.7f },
                { "trust", 0.8f }
            },
            compatibleTraits = new List<string>
            {
                "pragmatic",
                "resourceful",
                "selfish"
            },
            incompatibleTraits = new List<string>
            {
                "loyal",
                "empathetic"
            },
            iconName = "opportunistic"
        });
    }
    
    private static void AddTrait(PersonalityTrait trait)
    {
        traits[trait.traitId] = trait;
    }
    
    public static PersonalityTrait GetTrait(string traitId)
    {
        if (traits.TryGetValue(traitId, out var trait))
        {
            return trait;
        }
        return null;
    }
    
    public static List<PersonalityTrait> GetAllTraits()
    {
        return new List<PersonalityTrait>(traits.Values);
    }
    
    public static List<string> GetCompatibleTraits(string traitId)
    {
        if (traits.TryGetValue(traitId, out var trait))
        {
            return trait.compatibleTraits;
        }
        return new List<string>();
    }
    
    public static List<string> GetIncompatibleTraits(string traitId)
    {
        if (traits.TryGetValue(traitId, out var trait))
        {
            return trait.incompatibleTraits;
        }
        return new List<string>();
    }
    
    public static bool AreTraitsCompatible(string traitA, string traitB)
    {
        if (!traits.ContainsKey(traitA) || !traits.ContainsKey(traitB))
        {
            return true; // Default to compatible if trait not found
        }
        
        return traits[traitA].compatibleTraits.Contains(traitB) || 
               traits[traitB].compatibleTraits.Contains(traitA);
    }
    
    public static bool AreTraitsIncompatible(string traitA, string traitB)
    {
        if (!traits.ContainsKey(traitA) || !traits.ContainsKey(traitB))
        {
            return false; // Default to not incompatible if trait not found
        }
        
        return traits[traitA].incompatibleTraits.Contains(traitB) || 
               traits[traitB].incompatibleTraits.Contains(traitA);
    }
    
    public static Dictionary<string, float> GetCombinedEmotionalModifiers(List<string> traitIds)
    {
        Dictionary<string, float> combinedModifiers = new Dictionary<string, float>();
        
        foreach (string traitId in traitIds)
        {
            if (traits.TryGetValue(traitId, out var trait))
            {
                foreach (var modifier in trait.emotionalModifiers)
                {
                    if (!combinedModifiers.ContainsKey(modifier.Key))
                    {
                        combinedModifiers[modifier.Key] = 1.0f;
                    }
                    
                    combinedModifiers[modifier.Key] *= modifier.Value;
                }
            }
        }
        
        return combinedModifiers;
    }
    
    public static List<string> GetRandomTraitCombination(System.Random random, int count)
    {
        List<string> allTraitIds = new List<string>(traits.Keys);
        List<string> selectedTraits = new List<string>();
        
        // Shuffle the traits
        for (int i = allTraitIds.Count - 1; i > 0; i--)
        {
            int j = random.Next(i + 1);
            string temp = allTraitIds[i];
            allTraitIds[i] = allTraitIds[j];
            allTraitIds[j] = temp;
        }
        
        // Select traits ensuring compatibility
        for (int i = 0; i < allTraitIds.Count && selectedTraits.Count < count; i++)
        {
            string candidateTrait = allTraitIds[i];
            bool isCompatible = true;
            
            // Check compatibility with already selected traits
            foreach (string selectedTrait in selectedTraits)
            {
                if (AreTraitsIncompatible(candidateTrait, selectedTrait))
                {
                    isCompatible = false;
                    break;
                }
            }
            
            if (isCompatible)
            {
                selectedTraits.Add(candidateTrait);
            }
        }
        
        return selectedTraits;
    }
} 