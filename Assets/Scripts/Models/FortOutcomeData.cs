using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class FortOutcomeData
{
    public int fortDay;
    public string fortName;
    public Dictionary<string, CompanionOutcomeData> companionOutcomes;
    public List<RelationshipChangeData> relationshipChanges;
    public List<ResourceChangeData> resourceChanges;
    public List<NotificationData> importantEvents;
    public int overallMorale;
    public int overallSuspicion;
    public int rashExposureLevel;
    
    public FortOutcomeData()
    {
        companionOutcomes = new Dictionary<string, CompanionOutcomeData>();
        relationshipChanges = new List<RelationshipChangeData>();
        resourceChanges = new List<ResourceChangeData>();
        importantEvents = new List<NotificationData>();
    }
}

[System.Serializable]
public class CompanionOutcomeData
{
    public string companionId;
    public string companionName;
    public int trustChange;
    public int loyaltyChange;
    public int stressChange;
    public int moraleChange;
    public int fatigueLevel;
    public int rashExposure;
    public List<string> unlockedTraits;
    public List<MemoryEntry> significantMemories;
    
    public CompanionOutcomeData()
    {
        unlockedTraits = new List<string>();
        significantMemories = new List<MemoryEntry>();
    }
}

[System.Serializable]
public class RelationshipChangeData
{
    public string companionAId;
    public string companionBId;
    public string companionAName;
    public string companionBName;
    public int relationshipChange;
    public string relationshipType; // e.g., "Mentor", "Rival", "Crush"
    public string changeDescription;
    public DateTime timestamp;
}

[System.Serializable]
public class ResourceChangeData
{
    public string resourceType; // "Money", "Food", "Medicine", etc.
    public int changeAmount;
    public string source; // "Mission", "Event", "Trade", etc.
    public DateTime timestamp;
}

[System.Serializable]
public class NotificationData
{
    public string title;
    public string message;
    public string type; // "Info", "Warning", "Success", "Failure"
    public string category; // "Relationship", "Resource", "Trait", "Event"
    public DateTime timestamp;
    public bool isPersistent; // Whether this should be shown in the travel phase
} 