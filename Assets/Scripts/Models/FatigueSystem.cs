using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhOregonTrail.Models
{
    [System.Serializable]
    public class FatigueData
    {
        public float currentFatigue;
        public float maxFatigue;
        public float recoveryRate;
        public float fatigueThreshold;
        public bool isExhausted;
        
        public FatigueData()
        {
            currentFatigue = 0f;
            maxFatigue = 100f;
            recoveryRate = 10f; // Fatigue recovered per day
            fatigueThreshold = 80f; // Threshold for exhaustion effects
            isExhausted = false;
        }
        
        public void AddFatigue(float amount)
        {
            currentFatigue = Mathf.Min(currentFatigue + amount, maxFatigue);
            isExhausted = currentFatigue >= fatigueThreshold;
        }
        
        public void RecoverFatigue(float amount)
        {
            currentFatigue = Mathf.Max(currentFatigue - amount, 0f);
            isExhausted = currentFatigue >= fatigueThreshold;
        }
        
        public float GetFatiguePercentage()
        {
            return currentFatigue / maxFatigue;
        }
        
        public bool IsExhausted()
        {
            return isExhausted;
        }
    }
    
    public class FatigueSystem
    {
        private Dictionary<string, FatigueData> characterFatigue = new Dictionary<string, FatigueData>();
        
        public void InitializeCharacter(string characterId)
        {
            if (!characterFatigue.ContainsKey(characterId))
            {
                characterFatigue[characterId] = new FatigueData();
            }
        }
        
        public void AddFatigueFromMission(string characterId, float missionDifficulty)
        {
            if (!characterFatigue.ContainsKey(characterId))
            {
                InitializeCharacter(characterId);
            }
            
            // Base fatigue from mission difficulty (0-1)
            float baseFatigue = missionDifficulty * 30f;
            
            // Add some randomness
            float randomFactor = UnityEngine.Random.Range(0.8f, 1.2f);
            
            // Calculate final fatigue
            float finalFatigue = baseFatigue * randomFactor;
            
            characterFatigue[characterId].AddFatigue(finalFatigue);
        }
        
        public void RecoverFatigueDaily(string characterId)
        {
            if (characterFatigue.ContainsKey(characterId))
            {
                characterFatigue[characterId].RecoverFatigue(characterFatigue[characterId].recoveryRate);
            }
        }
        
        public float GetFatiguePercentage(string characterId)
        {
            if (characterFatigue.ContainsKey(characterId))
            {
                return characterFatigue[characterId].GetFatiguePercentage();
            }
            return 0f;
        }
        
        public bool IsExhausted(string characterId)
        {
            if (characterFatigue.ContainsKey(characterId))
            {
                return characterFatigue[characterId].IsExhausted();
            }
            return false;
        }
        
        public float GetMissionSuccessModifier(string characterId)
        {
            if (!characterFatigue.ContainsKey(characterId))
            {
                return 1.0f;
            }
            
            float fatiguePercentage = characterFatigue[characterId].GetFatiguePercentage();
            
            // No penalty until 50% fatigue
            if (fatiguePercentage < 0.5f)
            {
                return 1.0f;
            }
            
            // Linear penalty from 50% to 100% fatigue
            float penalty = (fatiguePercentage - 0.5f) * 2.0f;
            
            // Cap the penalty at -50% success
            return Mathf.Max(0.5f, 1.0f - penalty);
        }
        
        public float GetStressModifier(string characterId)
        {
            if (!characterFatigue.ContainsKey(characterId))
            {
                return 1.0f;
            }
            
            float fatiguePercentage = characterFatigue[characterId].GetFatiguePercentage();
            
            // No stress increase until 70% fatigue
            if (fatiguePercentage < 0.7f)
            {
                return 1.0f;
            }
            
            // Linear stress increase from 70% to 100% fatigue
            float stressIncrease = (fatiguePercentage - 0.7f) * 3.33f;
            
            // Cap the stress increase at +100%
            return Mathf.Min(2.0f, 1.0f + stressIncrease);
        }
        
        public void SaveFatigueData()
        {
            // TODO: Implement persistence
        }
        
        public void LoadFatigueData()
        {
            // TODO: Implement loading
        }
    }
} 