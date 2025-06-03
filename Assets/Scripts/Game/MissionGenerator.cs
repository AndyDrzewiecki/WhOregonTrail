using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using WhOregonTrail.Models;

namespace WhOregonTrail.Game
{
    [System.Serializable]
    public class MissionTemplate
    {
        public string missionId;
        public string title;
        public string description;
        public string category;
        public float baseDifficulty;
        public int requiredCompanions;
        public List<string> requiredSkills;
        public List<string> excludedSkills;
        public Dictionary<string, float> emotionalImpacts;
        public Dictionary<string, float> relationshipImpacts;
        public bool isSecret;
        public string factionId;
        
        public MissionTemplate()
        {
            missionId = Guid.NewGuid().ToString();
            requiredSkills = new List<string>();
            excludedSkills = new List<string>();
            emotionalImpacts = new Dictionary<string, float>();
            relationshipImpacts = new Dictionary<string, float>();
            baseDifficulty = 0.5f;
            requiredCompanions = 1;
            isSecret = false;
        }
    }
    
    public class MissionGenerator
    {
        private List<MissionTemplate> missionTemplates;
        private CompanionMemorySystem memorySystem;
        private FactionReputationManager reputationManager;
        private FatigueSystem fatigueSystem;
        private System.Random random;
        
        public MissionGenerator(CompanionMemorySystem memorySystem, FactionReputationManager reputationManager, FatigueSystem fatigueSystem)
        {
            this.memorySystem = memorySystem;
            this.reputationManager = reputationManager;
            this.fatigueSystem = fatigueSystem;
            this.random = new System.Random();
            InitializeMissionTemplates();
        }
        
        private void InitializeMissionTemplates()
        {
            missionTemplates = new List<MissionTemplate>();
            
            // Add standard mission templates
            AddMissionTemplate(new MissionTemplate
            {
                title = "Supply Run",
                description = "Deliver supplies to a remote outpost.",
                category = "logistics",
                baseDifficulty = 0.4f,
                requiredCompanions = 2,
                requiredSkills = new List<string> { "navigation", "strength" },
                emotionalImpacts = new Dictionary<string, float>
                {
                    { "trust", 3 },
                    { "loyalty", 2 },
                    { "stress", 5 }
                },
                relationshipImpacts = new Dictionary<string, float>
                {
                    { "friendship", 5 }
                }
            });
            
            AddMissionTemplate(new MissionTemplate
            {
                title = "Information Gathering",
                description = "Gather intelligence about suspicious activities.",
                category = "espionage",
                baseDifficulty = 0.6f,
                requiredCompanions = 1,
                requiredSkills = new List<string> { "stealth", "perception" },
                emotionalImpacts = new Dictionary<string, float>
                {
                    { "trust", 5 },
                    { "loyalty", 3 },
                    { "stress", 8 }
                },
                relationshipImpacts = new Dictionary<string, float>
                {
                    { "friendship", 3 }
                },
                isSecret = true
            });
            
            AddMissionTemplate(new MissionTemplate
            {
                title = "Rescue Operation",
                description = "Rescue a stranded traveler in dangerous territory.",
                category = "rescue",
                baseDifficulty = 0.7f,
                requiredCompanions = 3,
                requiredSkills = new List<string> { "medicine", "strength", "navigation" },
                emotionalImpacts = new Dictionary<string, float>
                {
                    { "trust", 8 },
                    { "loyalty", 10 },
                    { "stress", 12 }
                },
                relationshipImpacts = new Dictionary<string, float>
                {
                    { "friendship", 15 }
                }
            });
            
            // Add more mission templates as needed...
        }
        
        private void AddMissionTemplate(MissionTemplate template)
        {
            missionTemplates.Add(template);
        }
        
        public List<MissionTemplate> GenerateAvailableMissions(string factionId, List<string> availableCompanions)
        {
            if (availableCompanions == null || availableCompanions.Count == 0)
            {
                Debug.LogWarning("No companions available for mission generation.");
                return new List<MissionTemplate>();
            }
            
            // Check if faction is hostile
            if (reputationManager.IsFactionHostile(factionId))
            {
                Debug.LogWarning($"Cannot generate missions for hostile faction: {factionId}");
                return new List<MissionTemplate>();
            }
            
            // Get reputation modifier for mission availability
            float availabilityModifier = reputationManager.GetMissionAvailabilityModifier(factionId);
            
            // Filter templates based on available companions and skills
            var possibleMissions = missionTemplates.Where(template => 
                template.requiredCompanions <= availableCompanions.Count &&
                IsTemplateCompatibleWithCompanions(template, availableCompanions)
            ).ToList();
            
            // Apply memory-based modifiers to mission probabilities
            var weightedMissions = possibleMissions.Select(template => 
            {
                float weight = 1.0f;
                
                // Check for memory-based modifiers
                foreach (var companion in availableCompanions)
                {
                    // Get recent memories
                    var recentMemories = memorySystem.GetRecentMemories(companion, 5);
                    
                    // Check for betrayal memories that might exclude certain missions
                    bool hasRecentBetrayal = recentMemories.Any(m => m.category == "betrayal");
                    if (hasRecentBetrayal && template.category == "espionage")
                    {
                        weight *= 0.3f; // Significantly reduce probability of espionage missions after betrayal
                    }
                    
                    // Check for friendship memories that might favor certain missions
                    bool hasRecentFriendship = recentMemories.Any(m => m.category == "friendship");
                    if (hasRecentFriendship && template.category == "rescue")
                    {
                        weight *= 1.5f; // Increase probability of rescue missions after friendship events
                    }
                    
                    // Check for fatigue
                    if (fatigueSystem.IsExhausted(companion))
                    {
                        weight *= 0.5f; // Reduce probability of missions for exhausted companions
                    }
                }
                
                // Apply faction reputation modifier
                weight *= availabilityModifier;
                
                return new { Template = template, Weight = weight };
            }).ToList();
            
            // Normalize weights
            float totalWeight = weightedMissions.Sum(m => m.Weight);
            var normalizedMissions = weightedMissions.Select(m => 
                new { Template = m.Template, Weight = m.Weight / totalWeight }
            ).ToList();
            
            // Select missions based on weights
            List<MissionTemplate> selectedMissions = new List<MissionTemplate>();
            int maxMissions = Mathf.Min(5, Mathf.RoundToInt(5 * availabilityModifier)); // Base 5 missions, modified by reputation
            
            for (int i = 0; i < maxMissions; i++)
            {
                float randomValue = (float)random.NextDouble();
                float cumulativeWeight = 0f;
                
                foreach (var weightedMission in normalizedMissions)
                {
                    cumulativeWeight += weightedMission.Weight;
                    if (randomValue <= cumulativeWeight)
                    {
                        selectedMissions.Add(weightedMission.Template);
                        break;
                    }
                }
            }
            
            // Add memory-triggered mission variants
            var memoryTriggeredMissions = GenerateMemoryTriggeredMissions(factionId, availableCompanions);
            selectedMissions.AddRange(memoryTriggeredMissions);
            
            return selectedMissions;
        }
        
        private bool IsTemplateCompatibleWithCompanions(MissionTemplate template, List<string> companions)
        {
            // Check if companions have required skills
            // This is a simplified check - in a real implementation, you would check actual companion skills
            return true;
        }
        
        private List<MissionTemplate> GenerateMemoryTriggeredMissions(string factionId, List<string> availableCompanions)
        {
            List<MissionTemplate> triggeredMissions = new List<MissionTemplate>();
            
            foreach (var companion in availableCompanions)
            {
                // Get significant memories
                var significantMemories = memorySystem.GetRecentMemories(companion, 10)
                    .Where(m => m.isSignificant)
                    .ToList();
                
                foreach (var memory in significantMemories)
                {
                    // Check for memories that might trigger special missions
                    if (memory.category == "betrayal")
                    {
                        // Create a revenge mission
                        var revengeMission = new MissionTemplate
                        {
                            title = "Personal Vendetta",
                            description = $"{companion} has a personal lead on a coded mission related to past betrayals.",
                            category = "personal",
                            baseDifficulty = 0.8f,
                            requiredCompanions = 1,
                            emotionalImpacts = new Dictionary<string, float>
                            {
                                { "trust", 10 },
                                { "loyalty", 15 },
                                { "stress", 15 }
                            },
                            relationshipImpacts = new Dictionary<string, float>
                            {
                                { "friendship", 20 }
                            },
                            isSecret = true
                        };
                        
                        triggeredMissions.Add(revengeMission);
                    }
                    else if (memory.category == "friendship")
                    {
                        // Create a loyalty mission
                        var loyaltyMission = new MissionTemplate
                        {
                            title = "Repay a Debt",
                            description = $"{companion} wants to repay a debt of honor from a past friendship.",
                            category = "loyalty",
                            baseDifficulty = 0.7f,
                            requiredCompanions = 2,
                            emotionalImpacts = new Dictionary<string, float>
                            {
                                { "trust", 8 },
                                { "loyalty", 12 },
                                { "stress", 10 }
                            },
                            relationshipImpacts = new Dictionary<string, float>
                            {
                                { "friendship", 15 }
                            }
                        };
                        
                        triggeredMissions.Add(loyaltyMission);
                    }
                }
            }
            
            return triggeredMissions;
        }
        
        public float CalculateMissionSuccessChance(MissionTemplate mission, List<string> assignedCompanions)
        {
            if (assignedCompanions == null || assignedCompanions.Count < mission.requiredCompanions)
            {
                return 0f; // Not enough companions
            }
            
            // Start with base difficulty
            float successChance = 1.0f - mission.baseDifficulty;
            
            // Apply companion modifiers
            foreach (var companion in assignedCompanions)
            {
                // Apply fatigue modifier
                float fatigueModifier = fatigueSystem.GetMissionSuccessModifier(companion);
                successChance *= fatigueModifier;
                
                // Apply reputation modifier if faction is specified
                if (!string.IsNullOrEmpty(mission.factionId))
                {
                    float reputationModifier = reputationManager.GetMissionSuccessModifier(mission.factionId);
                    successChance *= reputationModifier;
                }
                
                // Apply memory-based modifiers
                var recentMemories = memorySystem.GetRecentMemories(companion, 5);
                
                // Check for relevant memories
                bool hasRelevantMemory = recentMemories.Any(m => m.category == mission.category);
                if (hasRelevantMemory)
                {
                    successChance *= 1.2f; // 20% bonus for having relevant experience
                }
                
                // Check for negative memories that might impact success
                bool hasNegativeMemory = recentMemories.Any(m => m.category == "betrayal" || m.category == "loss");
                if (hasNegativeMemory && mission.category == "espionage")
                {
                    successChance *= 0.8f; // 20% penalty for espionage missions after betrayal/loss
                }
            }
            
            // Clamp final chance
            return Mathf.Clamp01(successChance);
        }
        
        public Dictionary<string, float> CalculateEmotionalImpacts(MissionTemplate mission, List<string> assignedCompanions, bool success)
        {
            Dictionary<string, float> impacts = new Dictionary<string, float>();
            
            // Start with base impacts
            foreach (var impact in mission.emotionalImpacts)
            {
                impacts[impact.Key] = impact.Value;
            }
            
            // Apply success/failure modifier
            float successModifier = success ? 1.0f : -1.5f;
            foreach (var key in impacts.Keys.ToList())
            {
                impacts[key] *= successModifier;
            }
            
            // Apply companion-specific modifiers
            foreach (var companion in assignedCompanions)
            {
                // Apply fatigue stress modifier
                float stressModifier = fatigueSystem.GetStressModifier(companion);
                if (impacts.ContainsKey("stress"))
                {
                    impacts["stress"] *= stressModifier;
                }
                
                // Apply memory-based modifiers
                var recentMemories = memorySystem.GetRecentMemories(companion, 5);
                
                // Check for relevant memories
                bool hasRelevantMemory = recentMemories.Any(m => m.category == mission.category);
                if (hasRelevantMemory)
                {
                    // Reduce stress impact for experienced companions
                    if (impacts.ContainsKey("stress"))
                    {
                        impacts["stress"] *= 0.8f;
                    }
                }
            }
            
            return impacts;
        }
        
        public Dictionary<string, float> CalculateRelationshipImpacts(MissionTemplate mission, List<string> assignedCompanions, bool success)
        {
            Dictionary<string, float> impacts = new Dictionary<string, float>();
            
            // Start with base impacts
            foreach (var impact in mission.relationshipImpacts)
            {
                impacts[impact.Key] = impact.Value;
            }
            
            // Apply success/failure modifier
            float successModifier = success ? 1.0f : -1.5f;
            foreach (var key in impacts.Keys.ToList())
            {
                impacts[key] *= successModifier;
            }
            
            // Apply companion-specific modifiers
            foreach (var companion in assignedCompanions)
            {
                foreach (var otherCompanion in assignedCompanions.Where(c => c != companion))
                {
                    // Get relationship between companions
                    var relationship = memorySystem.GetRelationshipDescription(companion, otherCompanion);
                    
                    // Adjust impact based on existing relationship
                    if (relationship.Contains("Friend") || relationship.Contains("Close"))
                    {
                        // Smaller changes for already friendly companions
                        foreach (var key in impacts.Keys.ToList())
                        {
                            impacts[key] *= 0.8f;
                        }
                    }
                    else if (relationship.Contains("Enemy") || relationship.Contains("Rival"))
                    {
                        // Larger changes for unfriendly companions
                        foreach (var key in impacts.Keys.ToList())
                        {
                            impacts[key] *= 1.2f;
                        }
                    }
                }
            }
            
            return impacts;
        }
    }
} 