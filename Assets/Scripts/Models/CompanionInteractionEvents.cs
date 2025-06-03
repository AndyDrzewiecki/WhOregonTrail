using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class InteractionEvent
{
    public string eventId;
    public string title;
    public string description;
    public string archetypeRequirement;
    public List<string> requiredTraits;
    public Dictionary<string, float> emotionalChanges;
    public List<string> possibleResponses;
    public string iconName;
    public bool isUnique;
    public int cooldownDays;
    
    public InteractionEvent()
    {
        requiredTraits = new List<string>();
        emotionalChanges = new Dictionary<string, float>();
        possibleResponses = new List<string>();
    }
}

public class CompanionInteractionEvents
{
    private static Dictionary<string, InteractionEvent> events = new Dictionary<string, InteractionEvent>();
    
    static CompanionInteractionEvents()
    {
        InitializeEvents();
    }
    
    private static void InitializeEvents()
    {
        // Mentor-Student Events
        AddEvent(new InteractionEvent
        {
            eventId = "mentor_teaching_moment",
            title = "Teaching Moment",
            description = "{mentor} takes time to teach {student} a valuable skill.",
            archetypeRequirement = "Mentor-Student",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 5 },
                { "loyalty", 3 },
                { "stress", -2 }
            },
            possibleResponses = new List<string>
            {
                "The lesson goes well, strengthening their bond.",
                "Despite some frustration, progress is made.",
                "A breakthrough moment creates lasting respect."
            },
            iconName = "teaching",
            isUnique = false,
            cooldownDays = 3
        });
        
        // Rival Events
        AddEvent(new InteractionEvent
        {
            eventId = "rival_competition",
            title = "Friendly Competition",
            description = "{rival1} and {rival2} engage in a competitive activity.",
            archetypeRequirement = "Rivals",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 2 },
                { "loyalty", 1 },
                { "stress", 3 }
            },
            possibleResponses = new List<string>
            {
                "The competition brings out their best, earning mutual respect.",
                "A close match leaves both eager for a rematch.",
                "The rivalry intensifies, but with a hint of admiration."
            },
            iconName = "competition",
            isUnique = false,
            cooldownDays = 2
        });
        
        // Close Friends Events
        AddEvent(new InteractionEvent
        {
            eventId = "friends_heart_to_heart",
            title = "Heart to Heart",
            description = "{friend1} and {friend2} share a meaningful conversation.",
            archetypeRequirement = "Close Friends",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 4 },
                { "loyalty", 3 },
                { "stress", -3 }
            },
            possibleResponses = new List<string>
            {
                "Their deep conversation strengthens their friendship.",
                "Shared experiences create a stronger bond.",
                "A moment of vulnerability leads to greater trust."
            },
            iconName = "conversation",
            isUnique = false,
            cooldownDays = 4
        });
        
        // Crush Events
        AddEvent(new InteractionEvent
        {
            eventId = "crush_awkward_moment",
            title = "Awkward Moment",
            description = "{crush1} and {crush2} share an unexpectedly intimate moment.",
            archetypeRequirement = "Crush",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 2 },
                { "loyalty", 1 },
                { "stress", 4 }
            },
            possibleResponses = new List<string>
            {
                "The awkwardness somehow brings them closer.",
                "A moment of bravery leads to a meaningful connection.",
                "The tension creates both anxiety and excitement."
            },
            iconName = "awkward",
            isUnique = false,
            cooldownDays = 5
        });
        
        // Parent-Child Events
        AddEvent(new InteractionEvent
        {
            eventId = "parent_child_guidance",
            title = "Parental Guidance",
            description = "{parent} offers advice to {child} during a difficult situation.",
            archetypeRequirement = "Parent-Child",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 3 },
                { "loyalty", 2 },
                { "stress", -2 }
            },
            possibleResponses = new List<string>
            {
                "The guidance is well-received and appreciated.",
                "A moment of rebellion leads to eventual understanding.",
                "The advice proves valuable in a challenging situation."
            },
            iconName = "guidance",
            isUnique = false,
            cooldownDays = 3
        });
        
        // Scapegoat Events
        AddEvent(new InteractionEvent
        {
            eventId = "scapegoat_confrontation",
            title = "Tension Boils Over",
            description = "The strained relationship between {accuser} and {scapegoat} reaches a breaking point.",
            archetypeRequirement = "Scapegoat",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", -3 },
                { "loyalty", -2 },
                { "stress", 5 }
            },
            possibleResponses = new List<string>
            {
                "A heated argument reveals deeper issues.",
                "The confrontation leads to unexpected understanding.",
                "The tension continues to build between them."
            },
            iconName = "confrontation",
            isUnique = false,
            cooldownDays = 4
        });
        
        // Sibling Events
        AddEvent(new InteractionEvent
        {
            eventId = "siblings_shared_memory",
            title = "Shared Memory",
            description = "{sibling1} and {sibling2} reminisce about past experiences.",
            archetypeRequirement = "Siblings",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 2 },
                { "loyalty", 2 },
                { "stress", -1 }
            },
            possibleResponses = new List<string>
            {
                "Old memories bring them closer together.",
                "A moment of nostalgia leads to renewed connection.",
                "Shared experiences strengthen their bond."
            },
            iconName = "memory",
            isUnique = false,
            cooldownDays = 3
        });
        
        // Professional Events
        AddEvent(new InteractionEvent
        {
            eventId = "professional_efficiency",
            title = "Efficient Collaboration",
            description = "{professional1} and {professional2} work together on a task.",
            archetypeRequirement = "Professional",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 1 },
                { "loyalty", 1 },
                { "stress", 0 }
            },
            possibleResponses = new List<string>
            {
                "Their professional approach leads to success.",
                "Clear communication ensures smooth cooperation.",
                "Efficiency and respect mark their interaction."
            },
            iconName = "efficiency",
            isUnique = false,
            cooldownDays = 2
        });
        
        // Special Events (Unique, one-time events)
        AddEvent(new InteractionEvent
        {
            eventId = "life_saving_moment",
            title = "Life-Saving Moment",
            description = "{hero} saves {companion} from a dangerous situation.",
            archetypeRequirement = "Any",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", 10 },
                { "loyalty", 8 },
                { "stress", -5 }
            },
            possibleResponses = new List<string>
            {
                "The act creates an unbreakable bond between them.",
                "Gratitude and respect mark their relationship forever.",
                "A debt of honor is formed between them."
            },
            iconName = "heroic",
            isUnique = true,
            cooldownDays = 0
        });
        
        AddEvent(new InteractionEvent
        {
            eventId = "betrayal_revelation",
            title = "Betrayal Revealed",
            description = "{betrayer}'s actions have harmed {victim}, creating deep wounds.",
            archetypeRequirement = "Any",
            emotionalChanges = new Dictionary<string, float>
            {
                { "trust", -15 },
                { "loyalty", -10 },
                { "stress", 10 }
            },
            possibleResponses = new List<string>
            {
                "The betrayal creates lasting damage to their relationship.",
                "Forgiveness seems impossible after such a violation.",
                "The trust between them is shattered."
            },
            iconName = "betrayal",
            isUnique = true,
            cooldownDays = 0
        });
    }
    
    private static void AddEvent(InteractionEvent interactionEvent)
    {
        events[interactionEvent.eventId] = interactionEvent;
    }
    
    public static InteractionEvent GetEvent(string eventId)
    {
        if (events.TryGetValue(eventId, out var interactionEvent))
        {
            return interactionEvent;
        }
        return null;
    }
    
    public static List<InteractionEvent> GetEventsForArchetype(string archetypeName)
    {
        List<InteractionEvent> archetypeEvents = new List<InteractionEvent>();
        
        foreach (var evt in events.Values)
        {
            if (evt.archetypeRequirement == archetypeName || evt.archetypeRequirement == "Any")
            {
                archetypeEvents.Add(evt);
            }
        }
        
        return archetypeEvents;
    }
    
    public static InteractionEvent GetRandomEventForArchetype(string archetypeName, System.Random random)
    {
        var availableEvents = GetEventsForArchetype(archetypeName);
        
        if (availableEvents.Count == 0)
        {
            return null;
        }
        
        int index = random.Next(availableEvents.Count);
        return availableEvents[index];
    }
    
    public static string FormatEventDescription(InteractionEvent evt, string companionA, string companionB)
    {
        string description = evt.description;
        
        // Replace placeholders with actual names
        description = description.Replace("{mentor}", companionA);
        description = description.Replace("{student}", companionB);
        description = description.Replace("{rival1}", companionA);
        description = description.Replace("{rival2}", companionB);
        description = description.Replace("{friend1}", companionA);
        description = description.Replace("{friend2}", companionB);
        description = description.Replace("{crush1}", companionA);
        description = description.Replace("{crush2}", companionB);
        description = description.Replace("{parent}", companionA);
        description = description.Replace("{child}", companionB);
        description = description.Replace("{accuser}", companionA);
        description = description.Replace("{scapegoat}", companionB);
        description = description.Replace("{sibling1}", companionA);
        description = description.Replace("{sibling2}", companionB);
        description = description.Replace("{professional1}", companionA);
        description = description.Replace("{professional2}", companionB);
        description = description.Replace("{hero}", companionA);
        description = description.Replace("{companion}", companionB);
        description = description.Replace("{betrayer}", companionA);
        description = description.Replace("{victim}", companionB);
        
        return description;
    }
    
    public static string GetRandomResponse(InteractionEvent evt, System.Random random)
    {
        if (evt.possibleResponses.Count == 0)
        {
            return "";
        }
        
        int index = random.Next(evt.possibleResponses.Count);
        return evt.possibleResponses[index];
    }
} 