using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using WhOregonTrail.Models;

namespace WhOregonTrail.Game
{
    [System.Serializable]
    public class FortEvent
    {
        public string eventId;
        public string title;
        public string description;
        public string category;
        public List<string> requiredCharacters;
        public List<string> excludedCharacters;
        public float probability;
        public Dictionary<string, float> emotionalImpacts;
        public Dictionary<string, float> relationshipImpacts;
        public bool isPositive;
        public bool isSignificant;
        
        public FortEvent()
        {
            eventId = Guid.NewGuid().ToString();
            requiredCharacters = new List<string>();
            excludedCharacters = new List<string>();
            emotionalImpacts = new Dictionary<string, float>();
            relationshipImpacts = new Dictionary<string, float>();
            probability = 1.0f;
            isPositive = true;
            isSignificant = false;
        }
    }
    
    public class FortEventManager
    {
        private List<FortEvent> eventPool;
        private System.Random random;
        private CompanionMemorySystem memorySystem;
        
        public FortEventManager(CompanionMemorySystem memorySystem)
        {
            this.memorySystem = memorySystem;
            this.random = new System.Random();
            InitializeEventPool();
        }
        
        private void InitializeEventPool()
        {
            eventPool = new List<FortEvent>();
            
            // Add bonding events
            AddEvent(new FortEvent
            {
                title = "Shared Stories",
                description = "{character1} and {character2} spend the evening sharing stories from their past.",
                category = "bonding",
                emotionalImpacts = new Dictionary<string, float>
                {
                    { "trust", 5 },
                    { "loyalty", 5 },
                    { "stress", -3 }
                },
                relationshipImpacts = new Dictionary<string, float>
                {
                    { "friendship", 10 }
                },
                isPositive = true,
                probability = 0.8f
            });
            
            // Add conflict events
            AddEvent(new FortEvent
            {
                title = "Heated Argument",
                description = "{character1} and {character2} get into a heated argument about their next move.",
                category = "conflict",
                emotionalImpacts = new Dictionary<string, float>
                {
                    { "trust", -5 },
                    { "loyalty", -3 },
                    { "stress", 8 }
                },
                relationshipImpacts = new Dictionary<string, float>
                {
                    { "friendship", -8 }
                },
                isPositive = false,
                probability = 0.6f
            });
            
            // Add discovery events
            AddEvent(new FortEvent
            {
                title = "Hidden Talent",
                description = "{character1} discovers that {character2} has a hidden talent for {skill}.",
                category = "discovery",
                emotionalImpacts = new Dictionary<string, float>
                {
                    { "trust", 3 },
                    { "loyalty", 2 },
                    { "stress", -2 }
                },
                relationshipImpacts = new Dictionary<string, float>
                {
                    { "friendship", 5 }
                },
                isPositive = true,
                probability = 0.7f
            });
            
            // Add more events as needed...
        }
        
        private void AddEvent(FortEvent fortEvent)
        {
            eventPool.Add(fortEvent);
        }
        
        public FortEvent GenerateDailyEvent(List<string> availableCharacters)
        {
            if (availableCharacters == null || availableCharacters.Count < 2)
            {
                return null;
            }
            
            // Filter events based on available characters
            var possibleEvents = eventPool.Where(e => 
                e.requiredCharacters.Count == 0 || 
                e.requiredCharacters.All(c => availableCharacters.Contains(c)) &&
                e.excludedCharacters.Count == 0 || 
                !e.excludedCharacters.Any(c => availableCharacters.Contains(c))
            ).ToList();
            
            if (possibleEvents.Count == 0)
            {
                return null;
            }
            
            // Apply memory-based modifiers to event probabilities
            var weightedEvents = possibleEvents.Select(e => 
            {
                float weight = e.probability;
                
                // Check for memory-based modifiers
                foreach (var char1 in availableCharacters)
                {
                    foreach (var char2 in availableCharacters.Where(c => c != char1))
                    {
                        // Get relationship between characters
                        var relationship = memorySystem.GetRelationshipDescription(char1, char2);
                        
                        // Adjust probability based on relationship
                        if (e.isPositive)
                        {
                            if (relationship.Contains("Friend") || relationship.Contains("Close"))
                            {
                                weight *= 1.2f;
                            }
                            else if (relationship.Contains("Enemy") || relationship.Contains("Rival"))
                            {
                                weight *= 0.5f;
                            }
                        }
                        else // Negative events
                        {
                            if (relationship.Contains("Enemy") || relationship.Contains("Rival"))
                            {
                                weight *= 1.3f;
                            }
                            else if (relationship.Contains("Friend") || relationship.Contains("Close"))
                            {
                                weight *= 0.7f;
                            }
                        }
                        
                        // Check for recent memories that might influence event probability
                        var recentMemories = memorySystem.GetRecentMemories(char1, 5);
                        foreach (var memory in recentMemories)
                        {
                            if (memory.involvedCompanions.Contains(char2))
                            {
                                if (memory.category == "betrayal" && e.category == "conflict")
                                {
                                    weight *= 1.5f;
                                }
                                else if (memory.category == "friendship" && e.category == "bonding")
                                {
                                    weight *= 1.3f;
                                }
                            }
                        }
                    }
                }
                
                return new { Event = e, Weight = weight };
            }).ToList();
            
            // Normalize weights
            float totalWeight = weightedEvents.Sum(e => e.Weight);
            var normalizedEvents = weightedEvents.Select(e => 
                new { Event = e.Event, Weight = e.Weight / totalWeight }
            ).ToList();
            
            // Select event based on weights
            float randomValue = (float)random.NextDouble();
            float cumulativeWeight = 0f;
            
            foreach (var weightedEvent in normalizedEvents)
            {
                cumulativeWeight += weightedEvent.Weight;
                if (randomValue <= cumulativeWeight)
                {
                    var selectedEvent = weightedEvent.Event;
                    
                    // Select random characters for the event
                    var shuffledChars = availableCharacters.OrderBy(x => random.Next()).ToList();
                    selectedEvent.requiredCharacters = new List<string> { shuffledChars[0], shuffledChars[1] };
                    
                    // Format description with character names
                    selectedEvent.description = selectedEvent.description
                        .Replace("{character1}", shuffledChars[0])
                        .Replace("{character2}", shuffledChars[1]);
                    
                    return selectedEvent;
                }
            }
            
            // Fallback to first event if something goes wrong
            return possibleEvents[0];
        }
        
        public void ApplyEventImpacts(FortEvent fortEvent)
        {
            if (fortEvent == null || fortEvent.requiredCharacters.Count < 2)
            {
                return;
            }
            
            string char1 = fortEvent.requiredCharacters[0];
            string char2 = fortEvent.requiredCharacters[1];
            
            // Apply emotional impacts
            foreach (var impact in fortEvent.emotionalImpacts)
            {
                // Apply to both characters
                // Note: In a real implementation, you would call methods on your character/emotional state system
                Debug.Log($"Applying emotional impact {impact.Key}: {impact.Value} to {char1} and {char2}");
            }
            
            // Apply relationship impacts
            foreach (var impact in fortEvent.relationshipImpacts)
            {
                // Update relationship between characters
                // Note: In a real implementation, you would call methods on your relationship system
                Debug.Log($"Applying relationship impact {impact.Key}: {impact.Value} between {char1} and {char2}");
            }
            
            // Create memory from event
            var memory = new Memory
            {
                memoryId = Guid.NewGuid().ToString(),
                title = fortEvent.title,
                description = fortEvent.description,
                timestamp = DateTime.Now,
                category = fortEvent.category,
                emotionalImpact = new Dictionary<string, float>
                {
                    { "trust", fortEvent.emotionalImpacts.ContainsKey("trust") ? fortEvent.emotionalImpacts["trust"] : 0 },
                    { "loyalty", fortEvent.emotionalImpacts.ContainsKey("loyalty") ? fortEvent.emotionalImpacts["loyalty"] : 0 },
                    { "stress", fortEvent.emotionalImpacts.ContainsKey("stress") ? fortEvent.emotionalImpacts["stress"] : 0 }
                },
                involvedCompanions = new List<string> { char1, char2 },
                location = "Fort",
                isSignificant = fortEvent.isSignificant
            };
            
            // Add memory to both characters
            // Note: In a real implementation, you would call methods on your memory system
            Debug.Log($"Creating memory for {char1} and {char2}: {memory.title}");
        }
    }
} 