using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class Character
{
    public string id;
    public string name;
    public int age;
    public string gender;
    public string occupation;
    public string background;
    public PersonalityTraits personality;
    public Dictionary<string, float> relationships;
    public List<string> skills;
    public List<string> traits;
    public CharacterState state;

    public Character()
    {
        id = Guid.NewGuid().ToString();
        relationships = new Dictionary<string, float>();
        skills = new List<string>();
        traits = new List<string>();
        state = new CharacterState();
    }
}

[Serializable]
public class PersonalityTraits
{
    public float openness;
    public float conscientiousness;
    public float extraversion;
    public float agreeableness;
    public float neuroticism;

    public PersonalityTraits()
    {
        openness = 0.5f;
        conscientiousness = 0.5f;
        extraversion = 0.5f;
        agreeableness = 0.5f;
        neuroticism = 0.5f;
    }
}

[Serializable]
public class CharacterState
{
    public float health;
    public float morale;
    public float energy;
    public List<string> activeEffects;
    public Dictionary<string, float> needs;

    public CharacterState()
    {
        health = 100f;
        morale = 100f;
        energy = 100f;
        activeEffects = new List<string>();
        needs = new Dictionary<string, float>();
    }
}

[System.Serializable]
public class CharacterStats
{
    public float health = 100f;
    public float morale = 100f;
    public float stamina = 100f;
    public float charisma = 50f;
    public float intelligence = 50f;
    public float strength = 50f;
}

[System.Serializable]
public class CharacterTraits
{
    public string religion;
    public string identity;
    public string morality;
    public List<string> skills;
    public List<string> fears;
    public List<string> desires;
}

public class Character : MonoBehaviour
{
    [Header("Character Info")]
    public string characterId;
    public string characterName;
    public string background;
    public CharacterStats stats;
    public CharacterTraits traits;
    
    [Header("Relationships")]
    public Dictionary<string, float> relationships = new Dictionary<string, float>();
    
    [Header("Visual")]
    public GameObject characterModel;
    public Animator animator;
    
    private void Start()
    {
        InitializeCharacter();
    }
    
    private void InitializeCharacter()
    {
        if (animator == null)
        {
            animator = GetComponent<Animator>();
        }
        
        // Initialize relationships with other characters
        foreach (Character otherChar in TravelLoopManager.Instance.selectedPlayerCharacters)
        {
            if (otherChar != this)
            {
                relationships[otherChar.characterId] = 50f; // Neutral starting relationship
            }
        }
        
        foreach (Character otherChar in TravelLoopManager.Instance.selectedAICharacters)
        {
            relationships[otherChar.characterId] = 50f;
        }
    }
    
    public void UpdateStats(float deltaHealth, float deltaMorale, float deltaStamina)
    {
        stats.health = Mathf.Clamp(stats.health + deltaHealth, 0, 100);
        stats.morale = Mathf.Clamp(stats.morale + deltaMorale, 0, 100);
        stats.stamina = Mathf.Clamp(stats.stamina + deltaStamina, 0, 100);
        
        // Update UI
        UIManager.Instance.UpdateCharacterStats(this);
    }
    
    public void UpdateRelationship(string targetCharacterId, float delta)
    {
        if (relationships.ContainsKey(targetCharacterId))
        {
            relationships[targetCharacterId] = Mathf.Clamp(relationships[targetCharacterId] + delta, 0, 100);
            // Update UI
            UIManager.Instance.UpdateRelationshipDisplay(this, targetCharacterId);
        }
    }
    
    public float GetRelationship(string targetCharacterId)
    {
        return relationships.ContainsKey(targetCharacterId) ? relationships[targetCharacterId] : 0f;
    }
    
    public void PlayAnimation(string animationName)
    {
        if (animator != null)
        {
            animator.Play(animationName);
        }
    }
} 