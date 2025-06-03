using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using System.IO;
using Newtonsoft.Json;

public class CharacterManager : MonoBehaviour
{
    private static CharacterManager _instance;
    public static CharacterManager Instance
    {
        get
        {
            if (_instance == null)
            {
                GameObject go = new GameObject("CharacterManager");
                _instance = go.AddComponent<CharacterManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }
    
    private Dictionary<string, CharacterData> _characters = new Dictionary<string, CharacterData>();
    private Dictionary<string, CompanionMemory> _memories = new Dictionary<string, CompanionMemory>();
    private List<CharacterData> _predefinedCharacters = new List<CharacterData>();
    private CharacterData _playerCharacter;
    
    public CharacterData PlayerCharacter => _playerCharacter;
    public IReadOnlyDictionary<string, CharacterData> Characters => _characters;
    public IReadOnlyList<CharacterData> PredefinedCharacters => _predefinedCharacters;
    public IReadOnlyDictionary<string, CompanionMemory> Memories => _memories;
    
    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }
        
        _instance = this;
        DontDestroyOnLoad(gameObject);
        
        LoadPredefinedCharacters();
    }
    
    private void LoadPredefinedCharacters()
    {
        // In a real implementation, this would load from JSON files
        // For now, we'll create a few sample characters
        CreateSampleCharacters();
    }
    
    private void CreateSampleCharacters()
    {
        // Sample character 1
        var character1 = new CharacterData
        {
            name = "Sarah Johnson",
            age = 28,
            genderIdentity = new CharacterData.GenderIdentity
            {
                identity = "Female",
                transitionStatus = "non-applicable",
                pronouns = new List<string> { "she", "her" }
            },
            ethnicity = new CharacterData.Ethnicity
            {
                primary = "African American",
                heritage = new List<string> { "African", "Native American" }
            },
            religion = new CharacterData.Religion
            {
                denomination = "Baptist",
                devotionLevel = 7,
                practices = new List<string> { "Prayer", "Church attendance" },
                conflicts = new List<string> { "Struggles with church's stance on LGBTQ+ issues" }
            },
            sexualOrientation = new CharacterData.SexualOrientation
            {
                primary = "Bisexual",
                fluid = true,
                preferences = new List<string> { "Emotional connection", "Intelligence" }
            },
            personality = new CharacterData.Personality
            {
                traits = new List<string> { "Compassionate", "Determined", "Intelligent" },
                values = new List<string> { "Family", "Justice", "Education" },
                quirks = new List<string> { "Collects books", "Talks to plants" }
            },
            moralCode = new CharacterData.MoralCode
            {
                alignment = "Lawful Good",
                principles = new List<string> { "Help others", "Tell the truth", "Protect the innocent" },
                flexibility = 6
            },
            voice = new CharacterData.Voice
            {
                tone = "Warm",
                accent = "Southern",
                speechPatterns = new List<string> { "Uses metaphors", "Speaks slowly" }
            },
            conflictResolution = new CharacterData.ConflictResolution
            {
                style = "Diplomatic",
                triggers = new List<string> { "Injustice", "Dishonesty" },
                copingMechanisms = new List<string> { "Writing", "Gardening" }
            },
            skills = new CharacterData.Skills
            {
                performance = new CharacterData.Skills.Performance
                {
                    dance = 8,
                    singing = 7,
                    acting = 6,
                    specialties = new List<string> { "Jazz dance", "Blues singing" }
                },
                survival = new CharacterData.Skills.Survival
                {
                    hunting = 5,
                    navigation = 6,
                    firstAid = 8,
                    resourceManagement = 7
                },
                social = new CharacterData.Skills.Social
                {
                    persuasion = 7,
                    empathy = 9,
                    leadership = 6,
                    negotiation = 7
                },
                knowledge = new CharacterData.Skills.Knowledge
                {
                    history = 8,
                    culture = 7,
                    religion = 6,
                    languages = new List<string> { "English", "French" }
                }
            },
            health = 100,
            morale = 100,
            energy = 100
        };
        
        // Sample character 2
        var character2 = new CharacterData
        {
            name = "Miguel Rodriguez",
            age = 32,
            genderIdentity = new CharacterData.GenderIdentity
            {
                identity = "Male",
                transitionStatus = "non-applicable",
                pronouns = new List<string> { "he", "him" }
            },
            ethnicity = new CharacterData.Ethnicity
            {
                primary = "Latino",
                heritage = new List<string> { "Mexican", "Spanish" }
            },
            religion = new CharacterData.Religion
            {
                denomination = "Catholic",
                devotionLevel = 5,
                practices = new List<string> { "Occasional prayer" },
                conflicts = new List<string> { "Questions church authority" }
            },
            sexualOrientation = new CharacterData.SexualOrientation
            {
                primary = "Heterosexual",
                fluid = false,
                preferences = new List<string> { "Kindness", "Humor" }
            },
            personality = new CharacterData.Personality
            {
                traits = new List<string> { "Charismatic", "Adventurous", "Loyal" },
                values = new List<string> { "Family", "Honor", "Freedom" },
                quirks = new List<string> { "Whistles while working", "Collects knives" }
            },
            moralCode = new CharacterData.MoralCode
            {
                alignment = "Chaotic Good",
                principles = new List<string> { "Protect the weak", "Follow your heart", "Question authority" },
                flexibility = 8
            },
            voice = new CharacterData.Voice
            {
                tone = "Rough",
                accent = "Mexican",
                speechPatterns = new List<string> { "Uses Spanish phrases", "Speaks with hands" }
            },
            conflictResolution = new CharacterData.ConflictResolution
            {
                style = "Confrontational",
                triggers = new List<string> { "Disrespect", "Threats to family" },
                copingMechanisms = new List<string> { "Fighting", "Drinking" }
            },
            skills = new CharacterData.Skills
            {
                performance = new CharacterData.Skills.Performance
                {
                    dance = 7,
                    singing = 6,
                    acting = 5,
                    specialties = new List<string> { "Folk dance", "Guitar playing" }
                },
                survival = new CharacterData.Skills.Survival
                {
                    hunting = 8,
                    navigation = 7,
                    firstAid = 6,
                    resourceManagement = 5
                },
                social = new CharacterData.Skills.Social
                {
                    persuasion = 8,
                    empathy = 6,
                    leadership = 7,
                    negotiation = 6
                },
                knowledge = new CharacterData.Skills.Knowledge
                {
                    history = 6,
                    culture = 8,
                    religion = 5,
                    languages = new List<string> { "English", "Spanish" }
                }
            },
            health = 100,
            morale = 100,
            energy = 100
        };
        
        _predefinedCharacters.Add(character1);
        _predefinedCharacters.Add(character2);
        
        // Add more sample characters as needed
    }
    
    public void SetPlayerCharacter(CharacterData character)
    {
        _playerCharacter = character;
        _characters[character.id] = character;
    }
    
    public void AddCharacter(CharacterData character)
    {
        _characters[character.id] = character;
    }
    
    public void RemoveCharacter(string characterId)
    {
        if (_characters.ContainsKey(characterId))
        {
            _characters.Remove(characterId);
        }
    }
    
    public CharacterData GetCharacter(string characterId)
    {
        if (_characters.TryGetValue(characterId, out CharacterData character))
        {
            return character;
        }
        return null;
    }
    
    public void LoadCharacterMemories()
    {
        _memories.Clear();
        foreach (var character in _characters.Values)
        {
            var memory = CompanionMemory.LoadMemories(character.id);
            if (memory != null)
            {
                _memories[character.id] = memory;
            }
            else
            {
                // Create new memory if none exists
                _memories[character.id] = new CompanionMemory(
                    character.id,
                    character.name,
                    character.role,
                    character.bio,
                    character.traits
                );
            }
        }
    }

    public void SaveCharacterMemories()
    {
        foreach (var memory in _memories.Values)
        {
            memory.SaveMemories();
        }
    }

    public CompanionMemory GetCharacterMemory(string characterId)
    {
        if (_memories.TryGetValue(characterId, out var memory))
        {
            return memory;
        }
        return null;
    }

    public void AddMemoryEntry(string characterId, MemoryEntry entry)
    {
        if (_memories.TryGetValue(characterId, out var memory))
        {
            memory.AddMemoryEntry(entry);
        }
    }

    public void AddSignificantMemory(string characterId, Memory memory)
    {
        if (_memories.TryGetValue(characterId, out var companionMemory))
        {
            companionMemory.AddSignificantMemory(memory);
        }
    }

    public void UpdateRelationship(string characterId1, string characterId2, int change)
    {
        if (_memories.TryGetValue(characterId1, out var memory1))
        {
            memory1.UpdateRelationship(characterId2, change);
        }
        if (_memories.TryGetValue(characterId2, out var memory2))
        {
            memory2.UpdateRelationship(characterId1, change);
        }
    }
    
    public int GetRelationship(string characterId1, string characterId2)
    {
        if (_characters.TryGetValue(characterId1, out CharacterData character1) &&
            character1.relationships.TryGetValue(characterId2, out int relationship))
        {
            return relationship;
        }
        return 0;
    }
    
    public void SaveCharacters(string filePath)
    {
        var charactersList = _characters.Values.ToList();
        string json = JsonConvert.SerializeObject(charactersList, Formatting.Indented);
        File.WriteAllText(filePath, json);
    }
    
    public void LoadCharacters(string filePath)
    {
        if (File.Exists(filePath))
        {
            string json = File.ReadAllText(filePath);
            var charactersList = JsonConvert.DeserializeObject<List<CharacterData>>(json);
            
            _characters.Clear();
            foreach (var character in charactersList)
            {
                _characters[character.id] = character;
            }
            
            // Set player character if it exists
            _playerCharacter = charactersList.FirstOrDefault(c => c.id == _playerCharacter?.id);
        }
    }
} 