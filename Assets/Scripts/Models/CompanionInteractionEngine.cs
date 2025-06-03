using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class CompanionInteractionEngine : MonoBehaviour
{
    private Dictionary<string, CompanionMemory> companionMemories;
    private List<DialogueTemplate> activeInteractions;
    private Queue<DialogueTemplate> interactionQueue;
    private bool isProcessingInteraction;
    
    public event Action<DialogueTemplate> OnInteractionTriggered;
    public event Action<DialogueConsequence> OnConsequenceApplied;
    
    private void Awake()
    {
        activeInteractions = new List<DialogueTemplate>();
        interactionQueue = new Queue<DialogueTemplate>();
    }
    
    public void Initialize(Dictionary<string, CompanionMemory> memories)
    {
        companionMemories = memories;
    }
    
    public void TriggerPostMissionInteractions()
    {
        foreach (var memory in companionMemories.Values)
        {
            foreach (var otherMemory in companionMemories.Values)
            {
                if (memory == otherMemory) continue;
                
                // Check for conflict triggers
                if (ShouldTriggerConflict(memory, otherMemory))
                {
                    var template = CompanionDialogueTemplates.GetRandomTemplate("conflict");
                    if (template != null)
                    {
                        QueueInteraction(template, memory.companionName, otherMemory.companionName);
                    }
                }
                
                // Check for support triggers
                if (ShouldTriggerSupport(memory, otherMemory))
                {
                    var template = CompanionDialogueTemplates.GetRandomTemplate("support");
                    if (template != null)
                    {
                        QueueInteraction(template, memory.companionName, otherMemory.companionName);
                    }
                }
            }
        }
        
        // Add some random bonding interactions
        if (UnityEngine.Random.value < 0.3f)
        {
            var companions = new List<string>(companionMemories.Keys);
            if (companions.Count >= 2)
            {
                int index1 = UnityEngine.Random.Range(0, companions.Count);
                int index2 = (index1 + 1) % companions.Count;
                
                var template = CompanionDialogueTemplates.GetRandomTemplate("bonding");
                if (template != null)
                {
                    QueueInteraction(template, companions[index1], companions[index2]);
                }
            }
        }
        
        ProcessInteractionQueue();
    }
    
    public void TriggerRandomTravelInteraction()
    {
        if (companionMemories.Count < 2) return;
        
        var companions = new List<string>(companionMemories.Keys);
        int index1 = UnityEngine.Random.Range(0, companions.Count);
        int index2 = (index1 + 1) % companions.Count;
        
        // Randomly choose interaction type
        string[] types = { "gossip", "secrets", "bonding" };
        string randomType = types[UnityEngine.Random.Range(0, types.Length)];
        
        var template = CompanionDialogueTemplates.GetRandomTemplate(randomType);
        if (template != null)
        {
            QueueInteraction(template, companions[index1], companions[index2]);
            ProcessInteractionQueue();
        }
    }
    
    private bool ShouldTriggerConflict(CompanionMemory memoryA, CompanionMemory memoryB)
    {
        // Check for recent negative memories
        var recentMemories = memoryA.GetRecentMemories(3);
        foreach (var memory in recentMemories)
        {
            if (memory.emotionalChanges.Any(change => 
                change.type == "trust" && change.value < -5 && 
                memory.relatedCompanion == memoryB.companionName))
            {
                return true;
            }
        }
        
        // Check for high stress levels
        if (memoryA.emotionalState.stress > 70 || memoryB.emotionalState.stress > 70)
        {
            return UnityEngine.Random.value < 0.3f;
        }
        
        return false;
    }
    
    private bool ShouldTriggerSupport(CompanionMemory memoryA, CompanionMemory memoryB)
    {
        // Check for high stress or low morale
        if (memoryB.emotionalState.stress > 60 || memoryB.emotionalState.morale < 40)
        {
            // Higher chance if they have a good relationship
            float chance = 0.3f;
            if (memoryA.GetRelationshipScore(memoryB.companionName) > 50)
            {
                chance = 0.6f;
            }
            return UnityEngine.Random.value < chance;
        }
        
        return false;
    }
    
    private void QueueInteraction(DialogueTemplate template, string companionA, string companionB)
    {
        var interaction = new DialogueTemplate
        {
            id = template.id,
            type = template.type,
            title = template.title,
            description = CompanionDialogueTemplates.FormatTemplate(template, companionA, companionB),
            options = template.options,
            consequences = template.consequences
        };
        
        interactionQueue.Enqueue(interaction);
    }
    
    private void ProcessInteractionQueue()
    {
        if (isProcessingInteraction || interactionQueue.Count == 0) return;
        
        StartCoroutine(ProcessNextInteraction());
    }
    
    private IEnumerator ProcessNextInteraction()
    {
        isProcessingInteraction = true;
        
        while (interactionQueue.Count > 0)
        {
            var interaction = interactionQueue.Dequeue();
            OnInteractionTriggered?.Invoke(interaction);
            
            // Wait for player response
            yield return new WaitUntil(() => !isProcessingInteraction);
        }
        
        isProcessingInteraction = false;
    }
    
    public void HandlePlayerChoice(DialogueTemplate interaction, DialogueOption choice)
    {
        foreach (var consequence in choice.consequences)
        {
            ApplyConsequence(interaction, consequence);
        }
        
        isProcessingInteraction = false;
        ProcessInteractionQueue();
    }
    
    private void ApplyConsequence(DialogueTemplate interaction, DialogueConsequence consequence)
    {
        switch (consequence.target)
        {
            case "player":
                // Handle player-specific consequences
                break;
                
            case "companion_a":
            case "companion_b":
                string companionName = consequence.target == "companion_a" ? 
                    interaction.description.Split(' ')[0] : 
                    interaction.description.Split(' ')[^1].TrimEnd('.');
                    
                if (companionMemories.TryGetValue(companionName, out var memory))
                {
                    switch (consequence.type)
                    {
                        case "trust":
                            memory.emotionalState.trust = Mathf.Clamp(
                                memory.emotionalState.trust + consequence.value, 0, 100);
                            break;
                            
                        case "loyalty":
                            memory.emotionalState.loyalty = Mathf.Clamp(
                                memory.emotionalState.loyalty + consequence.value, 0, 100);
                            break;
                            
                        case "stress":
                            memory.emotionalState.stress = Mathf.Clamp(
                                memory.emotionalState.stress + consequence.value, 0, 100);
                            break;
                    }
                }
                break;
                
            case "both":
                string[] names = interaction.description.Split(' ');
                string companionA = names[0];
                string companionB = names[^1].TrimEnd('.');
                
                if (companionMemories.TryGetValue(companionA, out var memoryA) &&
                    companionMemories.TryGetValue(companionB, out var memoryB))
                {
                    switch (consequence.type)
                    {
                        case "relationship":
                            memoryA.UpdateRelationship(companionB, consequence.value);
                            memoryB.UpdateRelationship(companionA, consequence.value);
                            break;
                            
                        case "trust":
                            memoryA.emotionalState.trust = Mathf.Clamp(
                                memoryA.emotionalState.trust + consequence.value, 0, 100);
                            memoryB.emotionalState.trust = Mathf.Clamp(
                                memoryB.emotionalState.trust + consequence.value, 0, 100);
                            break;
                            
                        case "loyalty":
                            memoryA.emotionalState.loyalty = Mathf.Clamp(
                                memoryA.emotionalState.loyalty + consequence.value, 0, 100);
                            memoryB.emotionalState.loyalty = Mathf.Clamp(
                                memoryB.emotionalState.loyalty + consequence.value, 0, 100);
                            break;
                            
                        case "stress":
                            memoryA.emotionalState.stress = Mathf.Clamp(
                                memoryA.emotionalState.stress + consequence.value, 0, 100);
                            memoryB.emotionalState.stress = Mathf.Clamp(
                                memoryB.emotionalState.stress + consequence.value, 0, 100);
                            break;
                    }
                }
                break;
        }
        
        OnConsequenceApplied?.Invoke(consequence);
    }
} 