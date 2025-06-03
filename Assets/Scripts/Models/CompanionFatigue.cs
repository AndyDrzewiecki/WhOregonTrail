using System;
using UnityEngine;

[System.Serializable]
public class CompanionFatigue
{
    public int currentFatigue;
    public int maxFatigue = 100;
    public int fatigueRecoveryRate = 10; // Per day
    public int criticalFatigueThreshold = 80;
    public int highFatigueThreshold = 60;
    public int moderateFatigueThreshold = 40;
    
    public CompanionFatigue()
    {
        currentFatigue = 0;
    }
    
    public void AddFatigue(int amount)
    {
        currentFatigue = Mathf.Clamp(currentFatigue + amount, 0, maxFatigue);
    }
    
    public void RecoverFatigue(int amount)
    {
        currentFatigue = Mathf.Clamp(currentFatigue - amount, 0, maxFatigue);
    }
    
    public void RecoverFatigueForDay()
    {
        RecoverFatigue(fatigueRecoveryRate);
    }
    
    public float GetFatiguePercentage()
    {
        return (float)currentFatigue / maxFatigue;
    }
    
    public FatigueLevel GetFatigueLevel()
    {
        if (currentFatigue >= criticalFatigueThreshold)
            return FatigueLevel.Critical;
        else if (currentFatigue >= highFatigueThreshold)
            return FatigueLevel.High;
        else if (currentFatigue >= moderateFatigueThreshold)
            return FatigueLevel.Moderate;
        else
            return FatigueLevel.Low;
    }
    
    public float GetMissionSuccessPenalty()
    {
        // Higher fatigue reduces mission success chance
        return currentFatigue * 0.5f; // 0.5% penalty per fatigue point
    }
    
    public float GetEmotionalVolatilityMultiplier()
    {
        // Higher fatigue increases emotional volatility
        FatigueLevel level = GetFatigueLevel();
        
        switch (level)
        {
            case FatigueLevel.Critical:
                return 2.0f; // 2x emotional changes
            case FatigueLevel.High:
                return 1.5f; // 1.5x emotional changes
            case FatigueLevel.Moderate:
                return 1.2f; // 1.2x emotional changes
            case FatigueLevel.Low:
                return 1.0f; // Normal emotional changes
            default:
                return 1.0f;
        }
    }
    
    public string GetFatigueDescription()
    {
        FatigueLevel level = GetFatigueLevel();
        
        switch (level)
        {
            case FatigueLevel.Critical:
                return "Exhausted - Severely impacting performance and emotional stability";
            case FatigueLevel.High:
                return "Very Tired - Significantly affecting mission success and emotional state";
            case FatigueLevel.Moderate:
                return "Tired - Noticeably impacting performance";
            case FatigueLevel.Low:
                return "Well-Rested - Operating at full capacity";
            default:
                return "Unknown fatigue level";
        }
    }
}

public enum FatigueLevel
{
    Low,
    Moderate,
    High,
    Critical
} 