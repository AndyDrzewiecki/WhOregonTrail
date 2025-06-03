using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class CharacterData
{
    public string id;
    public string name;
    public int age;
    
    [Serializable]
    public class GenderIdentity
    {
        public string identity;
        public string transitionStatus; // "pre-op", "post-op", "non-applicable"
        public List<string> pronouns;
    }
    
    [Serializable]
    public class Ethnicity
    {
        public string primary;
        public List<string> heritage;
    }
    
    [Serializable]
    public class Religion
    {
        public string denomination;
        public int devotionLevel; // 1-10
        public List<string> practices;
        public List<string> conflicts;
    }
    
    [Serializable]
    public class SexualOrientation
    {
        public string primary;
        public bool fluid;
        public List<string> preferences;
    }
    
    [Serializable]
    public class Personality
    {
        public List<string> traits;
        public List<string> values;
        public List<string> quirks;
    }
    
    [Serializable]
    public class MoralCode
    {
        public string alignment;
        public List<string> principles;
        public int flexibility; // 1-10
    }
    
    [Serializable]
    public class Voice
    {
        public string tone;
        public string accent;
        public List<string> speechPatterns;
    }
    
    [Serializable]
    public class ConflictResolution
    {
        public string style;
        public List<string> triggers;
        public List<string> copingMechanisms;
    }
    
    [Serializable]
    public class Skills
    {
        [Serializable]
        public class Performance
        {
            public int dance; // 1-10
            public int singing; // 1-10
            public int acting; // 1-10
            public List<string> specialties;
        }
        
        [Serializable]
        public class Survival
        {
            public int hunting; // 1-10
            public int navigation; // 1-10
            public int firstAid; // 1-10
            public int resourceManagement; // 1-10
        }
        
        [Serializable]
        public class Social
        {
            public int persuasion; // 1-10
            public int empathy; // 1-10
            public int leadership; // 1-10
            public int negotiation; // 1-10
        }
        
        [Serializable]
        public class Knowledge
        {
            public int history; // 1-10
            public int culture; // 1-10
            public int religion; // 1-10
            public List<string> languages;
        }
        
        public Performance performance;
        public Survival survival;
        public Social social;
        public Knowledge knowledge;
    }
    
    public GenderIdentity genderIdentity;
    public Ethnicity ethnicity;
    public Religion religion;
    public SexualOrientation sexualOrientation;
    public Personality personality;
    public MoralCode moralCode;
    public Voice voice;
    public ConflictResolution conflictResolution;
    public Skills skills;
    
    // Current state
    public int health; // 1-100
    public int morale; // 1-100
    public int energy; // 1-100
    public Dictionary<string, int> relationships; // Character ID -> Relationship value (-100 to 100)
    
    public CharacterData()
    {
        id = Guid.NewGuid().ToString();
        relationships = new Dictionary<string, int>();
    }
} 