using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class BackgroundElement
{
    public string elementId;
    public string title;
    public string description;
    public Dictionary<string, float> emotionalModifiers;
    public List<string> traitModifiers;
    public List<string> relationshipModifiers;
    public string iconName;
    
    public BackgroundElement()
    {
        emotionalModifiers = new Dictionary<string, float>();
        traitModifiers = new List<string>();
        relationshipModifiers = new List<string>();
    }
}

[System.Serializable]
public class CompanionBackground
{
    public string backgroundId;
    public string backgroundName;
    public string description;
    public List<BackgroundElement> elements;
    public Dictionary<string, float> baseEmotionalModifiers;
    public List<string> startingTraits;
    public List<string> potentialTraits;
    public string iconName;
    
    public CompanionBackground()
    {
        elements = new List<BackgroundElement>();
        baseEmotionalModifiers = new Dictionary<string, float>();
        startingTraits = new List<string>();
        potentialTraits = new List<string>();
    }
}

public class CompanionBackgrounds
{
    private static Dictionary<string, CompanionBackground> backgrounds = new Dictionary<string, CompanionBackground>();
    
    static CompanionBackgrounds()
    {
        InitializeBackgrounds();
    }
    
    private static void InitializeBackgrounds()
    {
        // Frontier Family
        var frontierFamily = new CompanionBackground
        {
            backgroundId = "frontier_family",
            backgroundName = "Frontier Family",
            description = "Born and raised on the frontier, familiar with the challenges of wilderness life.",
            baseEmotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.9f },
                { "loyalty", 1.1f }
            },
            startingTraits = new List<string>
            {
                "resilient",
                "adaptable"
            },
            potentialTraits = new List<string>
            {
                "resourceful",
                "traditional",
                "loyal"
            },
            iconName = "frontier"
        };
        
        frontierFamily.elements.Add(new BackgroundElement
        {
            elementId = "frontier_skills",
            title = "Frontier Skills",
            description = "Learned essential survival skills from family at an early age.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.8f },
                { "morale", 1.1f }
            },
            traitModifiers = new List<string>
            {
                "resourceful",
                "adaptable"
            },
            relationshipModifiers = new List<string>
            {
                "Mentor-Student",
                "Parent-Child"
            },
            iconName = "skills"
        });
        
        frontierFamily.elements.Add(new BackgroundElement
        {
            elementId = "family_values",
            title = "Family Values",
            description = "Strong emphasis on loyalty, hard work, and self-reliance.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.2f },
                { "trust", 1.1f }
            },
            traitModifiers = new List<string>
            {
                "loyal",
                "pragmatic"
            },
            relationshipModifiers = new List<string>
            {
                "Close Friends",
                "Siblings"
            },
            iconName = "values"
        });
        
        backgrounds.Add("frontier_family", frontierFamily);
        
        // City Dweller
        var cityDweller = new CompanionBackground
        {
            backgroundId = "city_dweller",
            backgroundName = "City Dweller",
            description = "Accustomed to urban life, adapting to the challenges of the frontier.",
            baseEmotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.2f },
                { "adaptability", 0.9f }
            },
            startingTraits = new List<string>
            {
                "curious",
                "diplomatic"
            },
            potentialTraits = new List<string>
            {
                "pragmatic",
                "resourceful",
                "anxious"
            },
            iconName = "city"
        };
        
        cityDweller.elements.Add(new BackgroundElement
        {
            elementId = "urban_skills",
            title = "Urban Skills",
            description = "Skilled in negotiation, commerce, and social navigation.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.1f },
                { "loyalty", 0.9f }
            },
            traitModifiers = new List<string>
            {
                "diplomatic",
                "pragmatic"
            },
            relationshipModifiers = new List<string>
            {
                "Professional",
                "Close Friends"
            },
            iconName = "urban"
        });
        
        cityDweller.elements.Add(new BackgroundElement
        {
            elementId = "culture_shock",
            title = "Culture Shock",
            description = "Struggling to adapt to the unfamiliar frontier environment.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.3f },
                { "morale", 0.9f }
            },
            traitModifiers = new List<string>
            {
                "anxious",
                "adaptable"
            },
            relationshipModifiers = new List<string>
            {
                "Mentor-Student",
                "Rivals"
            },
            iconName = "shock"
        });
        
        backgrounds.Add("city_dweller", cityDweller);
        
        // Military Veteran
        var militaryVeteran = new CompanionBackground
        {
            backgroundId = "military_veteran",
            backgroundName = "Military Veteran",
            description = "Served in the military, bringing discipline and combat experience.",
            baseEmotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.2f },
                { "stress", 1.1f }
            },
            startingTraits = new List<string>
            {
                "leader",
                "disciplined"
            },
            potentialTraits = new List<string>
            {
                "loyal",
                "pragmatic",
                "callous"
            },
            iconName = "military"
        };
        
        militaryVeteran.elements.Add(new BackgroundElement
        {
            elementId = "combat_experience",
            title = "Combat Experience",
            description = "Trained in combat and tactical decision-making.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.9f },
                { "morale", 1.2f }
            },
            traitModifiers = new List<string>
            {
                "leader",
                "pragmatic"
            },
            relationshipModifiers = new List<string>
            {
                "Mentor-Student",
                "Professional"
            },
            iconName = "combat"
        });
        
        militaryVeteran.elements.Add(new BackgroundElement
        {
            elementId = "military_discipline",
            title = "Military Discipline",
            description = "Strong sense of duty, order, and following commands.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.3f },
                { "trust", 1.1f }
            },
            traitModifiers = new List<string>
            {
                "loyal",
                "disciplined"
            },
            relationshipModifiers = new List<string>
            {
                "Professional",
                "Mentor-Student"
            },
            iconName = "discipline"
        });
        
        backgrounds.Add("military_veteran", militaryVeteran);
        
        // Religious Missionary
        var religiousMissionary = new CompanionBackground
        {
            backgroundId = "religious_missionary",
            backgroundName = "Religious Missionary",
            description = "Dedicated to spreading faith and helping others on the frontier.",
            baseEmotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.1f },
                { "trust", 1.1f }
            },
            startingTraits = new List<string>
            {
                "empathetic",
                "optimistic"
            },
            potentialTraits = new List<string>
            {
                "loyal",
                "diplomatic",
                "traditional"
            },
            iconName = "religious"
        };
        
        religiousMissionary.elements.Add(new BackgroundElement
        {
            elementId = "spiritual_guidance",
            title = "Spiritual Guidance",
            description = "Provides comfort and guidance to others in difficult times.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.2f },
                { "morale", 1.1f }
            },
            traitModifiers = new List<string>
            {
                "empathetic",
                "diplomatic"
            },
            relationshipModifiers = new List<string>
            {
                "Mentor-Student",
                "Close Friends"
            },
            iconName = "spiritual"
        });
        
        religiousMissionary.elements.Add(new BackgroundElement
        {
            elementId = "faith_testing",
            title = "Faith Testing",
            description = "Struggles with maintaining faith in the face of frontier hardships.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.2f },
                { "morale", 0.9f }
            },
            traitModifiers = new List<string>
            {
                "resilient",
                "optimistic"
            },
            relationshipModifiers = new List<string>
            {
                "Close Friends",
                "Mentor-Student"
            },
            iconName = "faith"
        });
        
        backgrounds.Add("religious_missionary", religiousMissionary);
        
        // Criminal on the Run
        var criminalOnTheRun = new CompanionBackground
        {
            backgroundId = "criminal_on_the_run",
            backgroundName = "Criminal on the Run",
            description = "Fleeing from past crimes, seeking redemption or escape on the frontier.",
            baseEmotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 0.7f },
                { "loyalty", 0.8f },
                { "stress", 1.3f }
            },
            startingTraits = new List<string>
            {
                "opportunistic",
                "adaptable"
            },
            potentialTraits = new List<string>
            {
                "pragmatic",
                "resourceful",
                "loyal"
            },
            iconName = "criminal"
        };
        
        criminalOnTheRun.elements.Add(new BackgroundElement
        {
            elementId = "criminal_past",
            title = "Criminal Past",
            description = "Haunted by past actions and constantly watching for pursuers.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 1.4f },
                { "trust", 0.6f }
            },
            traitModifiers = new List<string>
            {
                "anxious",
                "opportunistic"
            },
            relationshipModifiers = new List<string>
            {
                "Scapegoat",
                "Rivals"
            },
            iconName = "past"
        });
        
        criminalOnTheRun.elements.Add(new BackgroundElement
        {
            elementId = "redemption_seek",
            title = "Seeking Redemption",
            description = "Genuinely trying to change and make amends for past wrongs.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "loyalty", 1.2f },
                { "trust", 1.1f }
            },
            traitModifiers = new List<string>
            {
                "loyal",
                "resilient"
            },
            relationshipModifiers = new List<string>
            {
                "Close Friends",
                "Mentor-Student"
            },
            iconName = "redemption"
        });
        
        backgrounds.Add("criminal_on_the_run", criminalOnTheRun);
        
        // Native Guide
        var nativeGuide = new CompanionBackground
        {
            backgroundId = "native_guide",
            backgroundName = "Native Guide",
            description = "Indigenous person with deep knowledge of the land and survival skills.",
            baseEmotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.8f },
                { "adaptability", 1.2f }
            },
            startingTraits = new List<string>
            {
                "resourceful",
                "adaptable"
            },
            potentialTraits = new List<string>
            {
                "traditional",
                "loyal",
                "diplomatic"
            },
            iconName = "native"
        };
        
        nativeGuide.elements.Add(new BackgroundElement
        {
            elementId = "land_knowledge",
            title = "Land Knowledge",
            description = "Intimate understanding of the terrain, plants, and wildlife.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "stress", 0.7f },
                { "morale", 1.1f }
            },
            traitModifiers = new List<string>
            {
                "resourceful",
                "observant"
            },
            relationshipModifiers = new List<string>
            {
                "Mentor-Student",
                "Professional"
            },
            iconName = "knowledge"
        });
        
        nativeGuide.elements.Add(new BackgroundElement
        {
            elementId = "cultural_barrier",
            title = "Cultural Barrier",
            description = "Faces prejudice and misunderstanding from settlers.",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 0.8f },
                { "stress", 1.2f }
            },
            traitModifiers = new List<string>
            {
                "diplomatic",
                "resilient"
            },
            relationshipModifiers = new List<string>
            {
                "Scapegoat",
                "Professional"
            },
            iconName = "barrier"
        });
        
        backgrounds.Add("native_guide", nativeGuide);
    }
    
    private static void AddBackground(CompanionBackground background)
    {
        backgrounds[background.backgroundId] = background;
    }
    
    public static CompanionBackground GetBackground(string backgroundId)
    {
        if (backgrounds.TryGetValue(backgroundId, out var background))
        {
            return background;
        }
        return null;
    }
    
    public static List<CompanionBackground> GetAllBackgrounds()
    {
        return new List<CompanionBackground>(backgrounds.Values);
    }
    
    public static Dictionary<string, float> GetCombinedEmotionalModifiers(string backgroundId)
    {
        Dictionary<string, float> combinedModifiers = new Dictionary<string, float>();
        
        if (backgrounds.TryGetValue(backgroundId, out var background))
        {
            // Start with base modifiers
            foreach (var modifier in background.baseEmotionalModifiers)
            {
                combinedModifiers[modifier.Key] = modifier.Value;
            }
            
            // Add modifiers from each element
            foreach (var element in background.elements)
            {
                foreach (var modifier in element.emotionalModifiers)
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
    
    public static List<string> GetStartingTraits(string backgroundId)
    {
        if (backgrounds.TryGetValue(backgroundId, out var background))
        {
            return background.startingTraits;
        }
        return new List<string>();
    }
    
    public static List<string> GetPotentialTraits(string backgroundId)
    {
        if (backgrounds.TryGetValue(backgroundId, out var background))
        {
            return background.potentialTraits;
        }
        return new List<string>();
    }
    
    public static List<string> GetRelationshipModifiers(string backgroundId)
    {
        List<string> relationshipModifiers = new List<string>();
        
        if (backgrounds.TryGetValue(backgroundId, out var background))
        {
            foreach (var element in background.elements)
            {
                foreach (var modifier in element.relationshipModifiers)
                {
                    if (!relationshipModifiers.Contains(modifier))
                    {
                        relationshipModifiers.Add(modifier);
                    }
                }
            }
        }
        
        return relationshipModifiers;
    }
    
    public static CompanionBackground GetRandomBackground(System.Random random)
    {
        List<CompanionBackground> allBackgrounds = new List<CompanionBackground>(backgrounds.Values);
        int index = random.Next(allBackgrounds.Count);
        return allBackgrounds[index];
    }
} 