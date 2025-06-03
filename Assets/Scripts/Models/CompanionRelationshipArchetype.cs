using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class RelationshipArchetype
{
    public string archetypeName;
    public string description;
    public Dictionary<string, float> emotionalModifiers;
    public List<string> specialInteractions;
    public string iconName;
    
    public RelationshipArchetype()
    {
        emotionalModifiers = new Dictionary<string, float>();
        specialInteractions = new List<string>();
    }
}

public class CompanionRelationshipArchetypes
{
    private static Dictionary<string, RelationshipArchetype> archetypes = new Dictionary<string, RelationshipArchetype>();
    
    static CompanionRelationshipArchetypes()
    {
        InitializeArchetypes();
    }
    
    private static void InitializeArchetypes()
    {
        // Mentor-Student
        var mentorStudent = new RelationshipArchetype
        {
            archetypeName = "Mentor-Student",
            description = "One companion guides and teaches the other, creating a bond of respect and growth.",
            iconName = "mentor",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.2f },
                { "loyalty", 1.1f },
                { "stress", 0.9f }
            },
            specialInteractions = new List<string>
            {
                "skill_teaching",
                "advice_seeking",
                "pride_in_achievement"
            }
        };
        archetypes.Add("Mentor-Student", mentorStudent);
        
        // Rivals
        var rivals = new RelationshipArchetype
        {
            archetypeName = "Rivals",
            description = "Companions compete with each other, driving each other to improve but creating tension.",
            iconName = "rival",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 0.8f },
                { "loyalty", 0.9f },
                { "stress", 1.3f }
            },
            specialInteractions = new List<string>
            {
                "friendly_competition",
                "oneupmanship",
                "reluctant_respect"
            }
        };
        archetypes.Add("Rivals", rivals);
        
        // Close Friends
        var closeFriends = new RelationshipArchetype
        {
            archetypeName = "Close Friends",
            description = "Companions share a deep bond of friendship, supporting each other through challenges.",
            iconName = "friends",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.3f },
                { "loyalty", 1.2f },
                { "stress", 0.8f }
            },
            specialInteractions = new List<string>
            {
                "shared_jokes",
                "emotional_support",
                "loyalty_tests"
            }
        };
        archetypes.Add("Close Friends", closeFriends);
        
        // Crush
        var crush = new RelationshipArchetype
        {
            archetypeName = "Crush",
            description = "One companion has romantic feelings for the other, creating both excitement and anxiety.",
            iconName = "crush",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.1f },
                { "loyalty", 1.0f },
                { "stress", 1.2f }
            },
            specialInteractions = new List<string>
            {
                "awkward_moments",
                "subtle_flirting",
                "jealousy"
            }
        };
        archetypes.Add("Crush", crush);
        
        // Parent-Child
        var parentChild = new RelationshipArchetype
        {
            archetypeName = "Parent-Child",
            description = "One companion takes on a protective, nurturing role toward the other.",
            iconName = "parent",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.2f },
                { "loyalty", 1.3f },
                { "stress", 0.9f }
            },
            specialInteractions = new List<string>
            {
                "protection",
                "guidance",
                "rebellion"
            }
        };
        archetypes.Add("Parent-Child", parentChild);
        
        // Scapegoat
        var scapegoat = new RelationshipArchetype
        {
            archetypeName = "Scapegoat",
            description = "One companion unfairly blames the other for problems, creating resentment.",
            iconName = "scapegoat",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 0.7f },
                { "loyalty", 0.6f },
                { "stress", 1.4f }
            },
            specialInteractions = new List<string>
            {
                "blame_shifting",
                "defensive_reactions",
                "confrontation"
            }
        };
        archetypes.Add("Scapegoat", scapegoat);
        
        // Siblings
        var siblings = new RelationshipArchetype
        {
            archetypeName = "Siblings",
            description = "Companions share a familial bond, with both affection and occasional conflict.",
            iconName = "siblings",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.1f },
                { "loyalty", 1.2f },
                { "stress", 1.1f }
            },
            specialInteractions = new List<string>
            {
                "sibling_rivalry",
                "protective_instinct",
                "shared_memories"
            }
        };
        archetypes.Add("Siblings", siblings);
        
        // Professional
        var professional = new RelationshipArchetype
        {
            archetypeName = "Professional",
            description = "Companions maintain a strictly professional relationship, focusing on efficiency.",
            iconName = "professional",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.0f },
                { "loyalty", 1.0f },
                { "stress", 1.0f }
            },
            specialInteractions = new List<string>
            {
                "efficiency_focus",
                "clear_boundaries",
                "task_delegation"
            }
        };
        archetypes.Add("Professional", professional);
    }
    
    public static RelationshipArchetype GetArchetype(string archetypeName)
    {
        if (archetypes.TryGetValue(archetypeName, out var archetype))
        {
            return archetype;
        }
        
        // Return a default archetype if the requested one doesn't exist
        return new RelationshipArchetype
        {
            archetypeName = "Unknown",
            description = "An undefined relationship type.",
            iconName = "unknown",
            emotionalModifiers = new Dictionary<string, float>
            {
                { "trust", 1.0f },
                { "loyalty", 1.0f },
                { "stress", 1.0f }
            },
            specialInteractions = new List<string>()
        };
    }
    
    public static List<string> GetAllArchetypeNames()
    {
        return new List<string>(archetypes.Keys);
    }
    
    public static string DetermineArchetype(string companionAId, string companionBId, Dictionary<string, CompanionMemory> companionMemories)
    {
        // This is a simplified version - in a real implementation, you would use more complex logic
        // based on companion traits, past interactions, and other factors
        
        if (!companionMemories.ContainsKey(companionAId) || !companionMemories.ContainsKey(companionBId))
        {
            return "Professional"; // Default
        }
        
        var companionA = companionMemories[companionAId];
        var companionB = companionMemories[companionBId];
        
        // Check for age differences that might suggest mentor-student or parent-child
        int ageDifference = Mathf.Abs(companionA.emotionalState.age - companionB.emotionalState.age);
        
        if (ageDifference > 15)
        {
            if (companionA.emotionalState.age > companionB.emotionalState.age)
            {
                return "Mentor-Student";
            }
            else
            {
                return "Parent-Child";
            }
        }
        
        // Check for relationship score to determine friendship level
        float relationshipScore = companionA.GetRelationshipScore(companionBId);
        
        if (relationshipScore > 80)
        {
            return "Close Friends";
        }
        else if (relationshipScore < 30)
        {
            // Check for negative interactions that might suggest scapegoat or rival
            var recentMemories = companionA.GetRecentMemories(5);
            bool hasNegativeInteractions = recentMemories.Exists(m => 
                m.emotionalChanges.Any(change => 
                    change.type == "trust" && change.value < -5 && 
                    m.relatedCompanion == companionBId));
            
            if (hasNegativeInteractions)
            {
                return "Scapegoat";
            }
            else
            {
                return "Rivals";
            }
        }
        
        // Default to professional if no other archetype is determined
        return "Professional";
    }
} 