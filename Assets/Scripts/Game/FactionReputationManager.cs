using System;
using System.Collections.Generic;
using UnityEngine;
using WhOregonTrail.Models;

namespace WhOregonTrail.Game
{
    [System.Serializable]
    public class FactionReputation
    {
        public string factionId;
        public string factionName;
        public float reputationScore;
        public float suspicionLevel;
        public Dictionary<string, int> memoryLog;
        public List<string> knownSecrets;
        public bool isHostile;
        
        public FactionReputation(string id, string name)
        {
            factionId = id;
            factionName = name;
            reputationScore = 50f; // Neutral starting point
            suspicionLevel = 0f;
            memoryLog = new Dictionary<string, int>();
            knownSecrets = new List<string>();
            isHostile = false;
        }
        
        public void AddReputation(float amount)
        {
            reputationScore = Mathf.Clamp(reputationScore + amount, 0f, 100f);
            UpdateHostileStatus();
        }
        
        public void AddSuspicion(float amount)
        {
            suspicionLevel = Mathf.Clamp(suspicionLevel + amount, 0f, 100f);
            UpdateHostileStatus();
        }
        
        public void LogMemory(string memoryId, int impact)
        {
            if (!memoryLog.ContainsKey(memoryId))
            {
                memoryLog[memoryId] = 0;
            }
            
            memoryLog[memoryId] += impact;
            
            // Update reputation based on memory impact
            AddReputation(impact * 0.5f);
            
            // Update suspicion based on negative memories
            if (impact < 0)
            {
                AddSuspicion(Math.Abs(impact) * 0.3f);
            }
        }
        
        public void AddKnownSecret(string secretId)
        {
            if (!knownSecrets.Contains(secretId))
            {
                knownSecrets.Add(secretId);
                AddSuspicion(10f); // Discovering a secret increases suspicion
            }
        }
        
        private void UpdateHostileStatus()
        {
            // A faction becomes hostile if suspicion is high or reputation is very low
            isHostile = suspicionLevel > 70f || reputationScore < 20f;
        }
        
        public string GetReputationDescription()
        {
            if (isHostile)
                return "Hostile";
            else if (reputationScore >= 80f)
                return "Trusted Ally";
            else if (reputationScore >= 60f)
                return "Friendly";
            else if (reputationScore >= 40f)
                return "Neutral";
            else if (reputationScore >= 20f)
                return "Suspicious";
            else
                return "Distrusted";
        }
        
        public float GetMissionAvailabilityModifier()
        {
            if (isHostile)
                return 0.2f; // Only 20% of missions available
            else if (reputationScore >= 80f)
                return 1.5f; // 50% more missions available
            else if (reputationScore >= 60f)
                return 1.2f; // 20% more missions available
            else if (reputationScore >= 40f)
                return 1.0f; // Normal mission availability
            else if (reputationScore >= 20f)
                return 0.7f; // 30% fewer missions available
            else
                return 0.5f; // 50% fewer missions available
        }
        
        public float GetMissionSuccessModifier()
        {
            if (isHostile)
                return 0.5f; // 50% success rate penalty
            else if (reputationScore >= 80f)
                return 1.2f; // 20% success rate bonus
            else if (reputationScore >= 60f)
                return 1.1f; // 10% success rate bonus
            else if (reputationScore >= 40f)
                return 1.0f; // No modifier
            else if (reputationScore >= 20f)
                return 0.9f; // 10% success rate penalty
            else
                return 0.8f; // 20% success rate penalty
        }
    }
    
    public class FactionReputationManager
    {
        private Dictionary<string, FactionReputation> factionReputations;
        private CompanionMemorySystem memorySystem;
        
        public FactionReputationManager(CompanionMemorySystem memorySystem)
        {
            this.memorySystem = memorySystem;
            this.factionReputations = new Dictionary<string, FactionReputation>();
            InitializeFactions();
        }
        
        private void InitializeFactions()
        {
            // Add default factions
            AddFaction("fort_independence", "Fort Independence");
            AddFaction("fort_kearny", "Fort Kearny");
            AddFaction("fort_laramie", "Fort Laramie");
            AddFaction("fort_bridger", "Fort Bridger");
            AddFaction("fort_hall", "Fort Hall");
            AddFaction("fort_boise", "Fort Boise");
            AddFaction("fort_walla_walla", "Fort Walla Walla");
            AddFaction("fort_vancouver", "Fort Vancouver");
            
            // Add special factions
            AddFaction("mormon_trail", "Mormon Trail Settlers");
            AddFaction("gold_rush", "Gold Rush Prospectors");
            AddFaction("indigenous", "Indigenous Tribes");
            AddFaction("military", "Military Command");
            AddFaction("merchants", "Merchant Guild");
        }
        
        public void AddFaction(string factionId, string factionName)
        {
            if (!factionReputations.ContainsKey(factionId))
            {
                factionReputations[factionId] = new FactionReputation(factionId, factionName);
            }
        }
        
        public FactionReputation GetFactionReputation(string factionId)
        {
            if (factionReputations.TryGetValue(factionId, out var reputation))
            {
                return reputation;
            }
            
            Debug.LogWarning($"Faction {factionId} not found in reputation manager.");
            return null;
        }
        
        public void UpdateReputationFromMission(string factionId, string missionId, bool success, float difficulty)
        {
            if (!factionReputations.ContainsKey(factionId))
            {
                Debug.LogWarning($"Cannot update reputation for unknown faction: {factionId}");
                return;
            }
            
            var reputation = factionReputations[factionId];
            
            // Base reputation change from mission success/failure
            float baseChange = success ? 5f : -10f;
            
            // Scale by mission difficulty
            baseChange *= difficulty;
            
            // Apply reputation change
            reputation.AddReputation(baseChange);
            
            // Log the memory
            int memoryImpact = success ? 5 : -10;
            reputation.LogMemory(missionId, memoryImpact);
            
            // Increase suspicion on failure
            if (!success)
            {
                reputation.AddSuspicion(difficulty * 5f);
            }
            
            Debug.Log($"Updated reputation for {factionId}: {baseChange:F1} (Success: {success}, Difficulty: {difficulty:F1})");
        }
        
        public void UpdateReputationFromEvent(string factionId, string eventId, bool positive)
        {
            if (!factionReputations.ContainsKey(factionId))
            {
                Debug.LogWarning($"Cannot update reputation for unknown faction: {factionId}");
                return;
            }
            
            var reputation = factionReputations[factionId];
            
            // Smaller reputation changes for events compared to missions
            float change = positive ? 2f : -5f;
            
            reputation.AddReputation(change);
            reputation.LogMemory(eventId, positive ? 2 : -5);
            
            Debug.Log($"Updated reputation for {factionId} from event: {change:F1} (Positive: {positive})");
        }
        
        public void DiscoverSecret(string factionId, string secretId)
        {
            if (!factionReputations.ContainsKey(factionId))
            {
                Debug.LogWarning($"Cannot add secret for unknown faction: {factionId}");
                return;
            }
            
            var reputation = factionReputations[factionId];
            reputation.AddKnownSecret(secretId);
            
            Debug.Log($"Discovered secret {secretId} for faction {factionId}");
        }
        
        public bool IsFactionHostile(string factionId)
        {
            if (factionReputations.TryGetValue(factionId, out var reputation))
            {
                return reputation.isHostile;
            }
            
            return false;
        }
        
        public float GetMissionAvailabilityModifier(string factionId)
        {
            if (factionReputations.TryGetValue(factionId, out var reputation))
            {
                return reputation.GetMissionAvailabilityModifier();
            }
            
            return 1.0f; // Default to normal availability
        }
        
        public float GetMissionSuccessModifier(string factionId)
        {
            if (factionReputations.TryGetValue(factionId, out var reputation))
            {
                return reputation.GetMissionSuccessModifier();
            }
            
            return 1.0f; // Default to no modifier
        }
        
        public List<string> GetAvailableFactions()
        {
            return new List<string>(factionReputations.Keys);
        }
        
        public Dictionary<string, float> GetAllReputationScores()
        {
            Dictionary<string, float> scores = new Dictionary<string, float>();
            
            foreach (var faction in factionReputations)
            {
                scores[faction.Key] = faction.Value.reputationScore;
            }
            
            return scores;
        }
        
        public void SaveReputationData()
        {
            // TODO: Implement persistence
        }
        
        public void LoadReputationData()
        {
            // TODO: Implement loading
        }
    }
} 