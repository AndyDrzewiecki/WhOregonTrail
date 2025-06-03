using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class DialogueTemplate
{
    public string id;
    public string type;
    public string title;
    public string description;
    public List<DialogueOption> options;
    public List<DialogueConsequence> consequences;
}

[System.Serializable]
public class DialogueOption
{
    public string text;
    public string response;
    public List<DialogueConsequence> consequences;
}

[System.Serializable]
public class DialogueConsequence
{
    public string type; // "trust", "loyalty", "stress", "relationship"
    public string target; // "player", "companion_a", "companion_b", "both"
    public int value;
    public string description;
}

public class CompanionDialogueTemplates
{
    private static List<DialogueTemplate> templates = new List<DialogueTemplate>();
    
    static CompanionDialogueTemplates()
    {
        InitializeTemplates();
    }
    
    private static void InitializeTemplates()
    {
        // BONDING TEMPLATES
        templates.Add(new DialogueTemplate
        {
            id = "bonding_shared_experience",
            type = "bonding",
            title = "Shared Experience",
            description = "{companion_a} and {companion_b} reminisce about a past mission.",
            options = new List<DialogueOption>
            {
                new DialogueOption
                {
                    text = "Join the conversation",
                    response = "You join in, sharing your own memories of that mission.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "both",
                            value = 5,
                            description = "Both companions appreciate your involvement."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = 10,
                            description = "The shared experience strengthens their bond."
                        }
                    }
                },
                new DialogueOption
                {
                    text = "Leave them to talk",
                    response = "You decide to give them some privacy.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = 15,
                            description = "The private conversation deepens their connection."
                        }
                    }
                }
            }
        });
        
        // GOSSIP TEMPLATES
        templates.Add(new DialogueTemplate
        {
            id = "gossip_mission_rumors",
            type = "gossip",
            title = "Mission Rumors",
            description = "{companion_a} shares some rumors about an upcoming mission with {companion_b}.",
            options = new List<DialogueOption>
            {
                new DialogueOption
                {
                    text = "Interrupt the conversation",
                    response = "You step in to clarify the situation.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "player",
                            value = 5,
                            description = "Your transparency earns their respect."
                        },
                        new DialogueConsequence
                        {
                            type = "loyalty",
                            target = "both",
                            value = 3,
                            description = "Both companions appreciate your honesty."
                        }
                    }
                },
                new DialogueOption
                {
                    text = "Listen in",
                    response = "You eavesdrop on their conversation.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "stress",
                            target = "both",
                            value = 5,
                            description = "The rumors cause some anxiety."
                        }
                    }
                }
            }
        });
        
        // CONFLICT TEMPLATES
        templates.Add(new DialogueTemplate
        {
            id = "conflict_past_mistake",
            type = "conflict",
            title = "Past Mistake",
            description = "{companion_a} confronts {companion_b} about a mistake from a previous mission.",
            options = new List<DialogueOption>
            {
                new DialogueOption
                {
                    text = "Mediate the situation",
                    response = "You step in to help resolve the conflict.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "player",
                            value = 10,
                            description = "Your mediation skills earn their respect."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = -5,
                            description = "The underlying tension remains."
                        }
                    }
                },
                new DialogueOption
                {
                    text = "Take {companion_a}'s side",
                    response = "You agree that the mistake was significant.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "companion_a",
                            value = 5,
                            description = "{companion_a} appreciates your support."
                        },
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "companion_b",
                            value = -10,
                            description = "{companion_b} feels betrayed."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = -15,
                            description = "The conflict deepens their rift."
                        }
                    }
                },
                new DialogueOption
                {
                    text = "Take {companion_b}'s side",
                    response = "You defend {companion_b}'s actions.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "companion_b",
                            value = 5,
                            description = "{companion_b} appreciates your support."
                        },
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "companion_a",
                            value = -10,
                            description = "{companion_a} feels betrayed."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = -15,
                            description = "The conflict deepens their rift."
                        }
                    }
                }
            }
        });
        
        // SUPPORT TEMPLATES
        templates.Add(new DialogueTemplate
        {
            id = "support_emotional_stress",
            type = "support",
            title = "Emotional Support",
            description = "{companion_a} notices that {companion_b} seems stressed and offers support.",
            options = new List<DialogueOption>
            {
                new DialogueOption
                {
                    text = "Join the conversation",
                    response = "You offer your own support and advice.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "stress",
                            target = "companion_b",
                            value = -10,
                            description = "The combined support helps reduce stress."
                        },
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "player",
                            value = 5,
                            description = "Your support is appreciated."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = 10,
                            description = "The supportive interaction strengthens their bond."
                        }
                    }
                },
                new DialogueOption
                {
                    text = "Leave them to talk",
                    response = "You decide to give them some privacy.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "stress",
                            target = "companion_b",
                            value = -5,
                            description = "The private conversation helps a little."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = 15,
                            description = "The private moment deepens their connection."
                        }
                    }
                }
            }
        });
        
        // SECRETS TEMPLATES
        templates.Add(new DialogueTemplate
        {
            id = "secrets_personal_revelation",
            type = "secrets",
            title = "Personal Revelation",
            description = "{companion_a} shares a personal secret with {companion_b}.",
            options = new List<DialogueOption>
            {
                new DialogueOption
                {
                    text = "Respect their privacy",
                    response = "You decide not to interfere with their private moment.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = 20,
                            description = "The shared secret creates a strong bond."
                        }
                    }
                },
                new DialogueOption
                {
                    text = "Join the conversation",
                    response = "You approach and share your own related experience.",
                    consequences = new List<DialogueConsequence>
                    {
                        new DialogueConsequence
                        {
                            type = "trust",
                            target = "both",
                            value = 10,
                            description = "Your openness earns their trust."
                        },
                        new DialogueConsequence
                        {
                            type = "relationship",
                            target = "both",
                            value = 15,
                            description = "The shared experience creates a bond."
                        }
                    }
                }
            }
        });
    }
    
    public static DialogueTemplate GetRandomTemplate(string type = null)
    {
        List<DialogueTemplate> filteredTemplates = type != null 
            ? templates.FindAll(t => t.type == type) 
            : templates;
            
        if (filteredTemplates.Count == 0)
            return null;
            
        return filteredTemplates[UnityEngine.Random.Range(0, filteredTemplates.Count)];
    }
    
    public static DialogueTemplate GetTemplateById(string id)
    {
        return templates.Find(t => t.id == id);
    }
    
    public static List<DialogueTemplate> GetTemplatesByType(string type)
    {
        return templates.FindAll(t => t.type == type);
    }
    
    public static string FormatTemplate(DialogueTemplate template, string companionA, string companionB)
    {
        string description = template.description
            .Replace("{companion_a}", companionA)
            .Replace("{companion_b}", companionB);
            
        return description;
    }
} 