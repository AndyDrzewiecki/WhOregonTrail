using System;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class Skill
{
    public string skillId;
    public string skillName;
    public string description;
    public int level; // 0-100
    public string category;
    public List<string> relatedTraits;
    public Dictionary<string, float> performanceModifiers;
    public string iconName;
    
    public Skill()
    {
        relatedTraits = new List<string>();
        performanceModifiers = new Dictionary<string, float>();
    }
}

[System.Serializable]
public class SkillCategory
{
    public string categoryId;
    public string categoryName;
    public string description;
    public List<string> relatedBackgrounds;
    public string iconName;
    
    public SkillCategory()
    {
        relatedBackgrounds = new List<string>();
    }
}

public class CompanionSkills
{
    private static Dictionary<string, SkillCategory> categories = new Dictionary<string, SkillCategory>();
    private static Dictionary<string, Skill> skills = new Dictionary<string, Skill>();
    
    static CompanionSkills()
    {
        InitializeCategories();
        InitializeSkills();
    }
    
    private static void InitializeCategories()
    {
        // Survival Skills
        AddCategory(new SkillCategory
        {
            categoryId = "survival",
            categoryName = "Survival",
            description = "Skills related to surviving in the wilderness.",
            relatedBackgrounds = new List<string>
            {
                "frontier_family",
                "native_guide"
            },
            iconName = "survival"
        });
        
        // Combat Skills
        AddCategory(new SkillCategory
        {
            categoryId = "combat",
            categoryName = "Combat",
            description = "Skills related to fighting and defense.",
            relatedBackgrounds = new List<string>
            {
                "military_veteran",
                "frontier_family"
            },
            iconName = "combat"
        });
        
        // Medical Skills
        AddCategory(new SkillCategory
        {
            categoryId = "medical",
            categoryName = "Medical",
            description = "Skills related to healing and treating injuries.",
            relatedBackgrounds = new List<string>
            {
                "religious_missionary",
                "city_dweller"
            },
            iconName = "medical"
        });
        
        // Social Skills
        AddCategory(new SkillCategory
        {
            categoryId = "social",
            categoryName = "Social",
            description = "Skills related to interacting with others.",
            relatedBackgrounds = new List<string>
            {
                "city_dweller",
                "religious_missionary"
            },
            iconName = "social"
        });
        
        // Crafting Skills
        AddCategory(new SkillCategory
        {
            categoryId = "crafting",
            categoryName = "Crafting",
            description = "Skills related to creating and repairing items.",
            relatedBackgrounds = new List<string>
            {
                "frontier_family",
                "city_dweller"
            },
            iconName = "crafting"
        });
        
        // Navigation Skills
        AddCategory(new SkillCategory
        {
            categoryId = "navigation",
            categoryName = "Navigation",
            description = "Skills related to finding your way and reading maps.",
            relatedBackgrounds = new List<string>
            {
                "native_guide",
                "military_veteran"
            },
            iconName = "navigation"
        });
        
        // Hunting Skills
        AddCategory(new SkillCategory
        {
            categoryId = "hunting",
            categoryName = "Hunting",
            description = "Skills related to tracking and hunting animals.",
            relatedBackgrounds = new List<string>
            {
                "native_guide",
                "frontier_family"
            },
            iconName = "hunting"
        });
        
        // Stealth Skills
        AddCategory(new SkillCategory
        {
            categoryId = "stealth",
            categoryName = "Stealth",
            description = "Skills related to moving quietly and avoiding detection.",
            relatedBackgrounds = new List<string>
            {
                "criminal_on_the_run",
                "native_guide"
            },
            iconName = "stealth"
        });
    }
    
    private static void InitializeSkills()
    {
        // Survival Skills
        AddSkill(new Skill
        {
            skillId = "fire_building",
            skillName = "Fire Building",
            description = "Ability to start and maintain fires in various conditions.",
            level = 0,
            category = "survival",
            relatedTraits = new List<string>
            {
                "resourceful",
                "adaptable"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "efficiency", 1.0f },
                { "speed", 1.0f }
            },
            iconName = "fire"
        });
        
        AddSkill(new Skill
        {
            skillId = "shelter_building",
            skillName = "Shelter Building",
            description = "Ability to construct effective shelters from available materials.",
            level = 0,
            category = "survival",
            relatedTraits = new List<string>
            {
                "resourceful",
                "pragmatic"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "efficiency", 1.0f },
                { "durability", 1.0f }
            },
            iconName = "shelter"
        });
        
        AddSkill(new Skill
        {
            skillId = "water_finding",
            skillName = "Water Finding",
            description = "Ability to locate and purify water sources.",
            level = 0,
            category = "survival",
            relatedTraits = new List<string>
            {
                "observant",
                "resourceful"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "efficiency", 1.0f },
                { "safety", 1.0f }
            },
            iconName = "water"
        });
        
        // Combat Skills
        AddSkill(new Skill
        {
            skillId = "marksmanship",
            skillName = "Marksmanship",
            description = "Ability to accurately shoot firearms.",
            level = 0,
            category = "combat",
            relatedTraits = new List<string>
            {
                "disciplined",
                "focused"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "accuracy", 1.0f },
                { "range", 1.0f }
            },
            iconName = "shooting"
        });
        
        AddSkill(new Skill
        {
            skillId = "melee_combat",
            skillName = "Melee Combat",
            description = "Ability to fight effectively in close quarters.",
            level = 0,
            category = "combat",
            relatedTraits = new List<string>
            {
                "brave",
                "strong"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "damage", 1.0f },
                { "defense", 1.0f }
            },
            iconName = "melee"
        });
        
        AddSkill(new Skill
        {
            skillId = "tactics",
            skillName = "Tactics",
            description = "Ability to plan and execute combat strategies.",
            level = 0,
            category = "combat",
            relatedTraits = new List<string>
            {
                "leader",
                "analytical"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "coordination", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "tactics"
        });
        
        // Medical Skills
        AddSkill(new Skill
        {
            skillId = "first_aid",
            skillName = "First Aid",
            description = "Ability to treat minor injuries and wounds.",
            level = 0,
            category = "medical",
            relatedTraits = new List<string>
            {
                "empathetic",
                "calm"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "healing", 1.0f },
                { "speed", 1.0f }
            },
            iconName = "first_aid"
        });
        
        AddSkill(new Skill
        {
            skillId = "herbalism",
            skillName = "Herbalism",
            description = "Knowledge of medicinal plants and their uses.",
            level = 0,
            category = "medical",
            relatedTraits = new List<string>
            {
                "observant",
                "curious"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "healing", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "herbs"
        });
        
        AddSkill(new Skill
        {
            skillId = "surgery",
            skillName = "Surgery",
            description = "Ability to perform surgical procedures.",
            level = 0,
            category = "medical",
            relatedTraits = new List<string>
            {
                "focused",
                "steady"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "healing", 1.0f },
                { "precision", 1.0f }
            },
            iconName = "surgery"
        });
        
        // Social Skills
        AddSkill(new Skill
        {
            skillId = "negotiation",
            skillName = "Negotiation",
            description = "Ability to reach agreements and resolve conflicts.",
            level = 0,
            category = "social",
            relatedTraits = new List<string>
            {
                "diplomatic",
                "persuasive"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "success", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "negotiation"
        });
        
        AddSkill(new Skill
        {
            skillId = "leadership",
            skillName = "Leadership",
            description = "Ability to inspire and guide others.",
            level = 0,
            category = "social",
            relatedTraits = new List<string>
            {
                "leader",
                "charismatic"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "morale", 1.0f },
                { "coordination", 1.0f }
            },
            iconName = "leadership"
        });
        
        AddSkill(new Skill
        {
            skillId = "intimidation",
            skillName = "Intimidation",
            description = "Ability to influence others through fear.",
            level = 0,
            category = "social",
            relatedTraits = new List<string>
            {
                "confrontational",
                "strong"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "success", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "intimidation"
        });
        
        // Crafting Skills
        AddSkill(new Skill
        {
            skillId = "blacksmithing",
            skillName = "Blacksmithing",
            description = "Ability to work with metal and create tools.",
            level = 0,
            category = "crafting",
            relatedTraits = new List<string>
            {
                "strong",
                "patient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "quality", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "blacksmith"
        });
        
        AddSkill(new Skill
        {
            skillId = "carpentry",
            skillName = "Carpentry",
            description = "Ability to work with wood and build structures.",
            level = 0,
            category = "crafting",
            relatedTraits = new List<string>
            {
                "precise",
                "patient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "quality", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "carpentry"
        });
        
        AddSkill(new Skill
        {
            skillId = "leatherworking",
            skillName = "Leatherworking",
            description = "Ability to work with leather and create items.",
            level = 0,
            category = "crafting",
            relatedTraits = new List<string>
            {
                "precise",
                "patient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "quality", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "leather"
        });
        
        // Navigation Skills
        AddSkill(new Skill
        {
            skillId = "map_reading",
            skillName = "Map Reading",
            description = "Ability to read and interpret maps.",
            level = 0,
            category = "navigation",
            relatedTraits = new List<string>
            {
                "analytical",
                "observant"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "accuracy", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "map"
        });
        
        AddSkill(new Skill
        {
            skillId = "tracking",
            skillName = "Tracking",
            description = "Ability to follow trails and signs.",
            level = 0,
            category = "navigation",
            relatedTraits = new List<string>
            {
                "observant",
                "patient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "accuracy", 1.0f },
                { "speed", 1.0f }
            },
            iconName = "tracking"
        });
        
        AddSkill(new Skill
        {
            skillId = "astronomy",
            skillName = "Astronomy",
            description = "Knowledge of stars and celestial navigation.",
            level = 0,
            category = "navigation",
            relatedTraits = new List<string>
            {
                "analytical",
                "curious"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "accuracy", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "stars"
        });
        
        // Hunting Skills
        AddSkill(new Skill
        {
            skillId = "animal_tracking",
            skillName = "Animal Tracking",
            description = "Ability to track and identify animal signs.",
            level = 0,
            category = "hunting",
            relatedTraits = new List<string>
            {
                "observant",
                "patient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "success", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "tracking"
        });
        
        AddSkill(new Skill
        {
            skillId = "trapping",
            skillName = "Trapping",
            description = "Ability to set and maintain traps for animals.",
            level = 0,
            category = "hunting",
            relatedTraits = new List<string>
            {
                "patient",
                "resourceful"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "success", 1.0f },
                { "efficiency", 1.0f }
            },
            iconName = "trap"
        });
        
        AddSkill(new Skill
        {
            skillId = "butchering",
            skillName = "Butchering",
            description = "Ability to properly process hunted animals.",
            level = 0,
            category = "hunting",
            relatedTraits = new List<string>
            {
                "precise",
                "efficient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "efficiency", 1.0f },
                { "waste", 1.0f }
            },
            iconName = "butcher"
        });
        
        // Stealth Skills
        AddSkill(new Skill
        {
            skillId = "sneaking",
            skillName = "Sneaking",
            description = "Ability to move quietly and avoid detection.",
            level = 0,
            category = "stealth",
            relatedTraits = new List<string>
            {
                "quiet",
                "observant"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "stealth", 1.0f },
                { "speed", 1.0f }
            },
            iconName = "sneak"
        });
        
        AddSkill(new Skill
        {
            skillId = "lockpicking",
            skillName = "Lockpicking",
            description = "Ability to open locks without keys.",
            level = 0,
            category = "stealth",
            relatedTraits = new List<string>
            {
                "precise",
                "patient"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "success", 1.0f },
                { "speed", 1.0f }
            },
            iconName = "lock"
        });
        
        AddSkill(new Skill
        {
            skillId = "disguise",
            skillName = "Disguise",
            description = "Ability to alter appearance to avoid recognition.",
            level = 0,
            category = "stealth",
            relatedTraits = new List<string>
            {
                "observant",
                "creative"
            },
            performanceModifiers = new Dictionary<string, float>
            {
                { "success", 1.0f },
                { "duration", 1.0f }
            },
            iconName = "disguise"
        });
    }
    
    private static void AddCategory(SkillCategory category)
    {
        categories[category.categoryId] = category;
    }
    
    private static void AddSkill(Skill skill)
    {
        skills[skill.skillId] = skill;
    }
    
    public static SkillCategory GetCategory(string categoryId)
    {
        if (categories.TryGetValue(categoryId, out var category))
        {
            return category;
        }
        return null;
    }
    
    public static Skill GetSkill(string skillId)
    {
        if (skills.TryGetValue(skillId, out var skill))
        {
            return skill;
        }
        return null;
    }
    
    public static List<SkillCategory> GetAllCategories()
    {
        return new List<SkillCategory>(categories.Values);
    }
    
    public static List<Skill> GetAllSkills()
    {
        return new List<Skill>(skills.Values);
    }
    
    public static List<Skill> GetSkillsByCategory(string categoryId)
    {
        return skills.Values.Where(s => s.category == categoryId).ToList();
    }
    
    public static List<Skill> GetSkillsByBackground(string backgroundId)
    {
        List<Skill> backgroundSkills = new List<Skill>();
        
        foreach (var category in categories.Values)
        {
            if (category.relatedBackgrounds.Contains(backgroundId))
            {
                backgroundSkills.AddRange(GetSkillsByCategory(category.categoryId));
            }
        }
        
        return backgroundSkills;
    }
    
    public static List<Skill> GetSkillsByTrait(string traitId)
    {
        return skills.Values.Where(s => s.relatedTraits.Contains(traitId)).ToList();
    }
    
    public static Dictionary<string, float> CalculateSkillPerformance(string skillId, int skillLevel, List<string> companionTraits)
    {
        Dictionary<string, float> performance = new Dictionary<string, float>();
        
        if (skills.TryGetValue(skillId, out var skill))
        {
            // Start with base performance modifiers
            foreach (var modifier in skill.performanceModifiers)
            {
                performance[modifier.Key] = modifier.Value;
            }
            
            // Apply skill level modifier (linear scaling)
            float levelModifier = 1.0f + (skillLevel / 100.0f);
            foreach (var modifier in performance.Keys.ToList())
            {
                performance[modifier] *= levelModifier;
            }
            
            // Apply trait modifiers
            foreach (var trait in companionTraits)
            {
                if (skill.relatedTraits.Contains(trait))
                {
                    // Traits related to the skill amplify the performance
                    foreach (var modifier in performance.Keys.ToList())
                    {
                        performance[modifier] *= 1.2f;
                    }
                }
            }
        }
        
        return performance;
    }
    
    public static float CalculateTaskSuccess(string skillId, int skillLevel, List<string> companionTraits, float taskDifficulty)
    {
        Dictionary<string, float> performance = CalculateSkillPerformance(skillId, skillLevel, companionTraits);
        
        // Use the average of all performance modifiers
        float averagePerformance = performance.Values.Average();
        
        // Calculate success chance based on performance and task difficulty
        float successChance = (averagePerformance * skillLevel) / (taskDifficulty * 100);
        
        // Clamp between 0 and 1
        return Mathf.Clamp01(successChance);
    }
    
    public static int CalculateSkillGain(string skillId, int currentLevel, float taskDifficulty, bool success)
    {
        // Base gain is higher for lower levels and decreases as skill improves
        float baseGain = 5.0f * (1.0f - (currentLevel / 100.0f));
        
        // Adjust based on task difficulty
        float difficultyModifier = taskDifficulty / 10.0f;
        
        // Success or failure affects gain
        float outcomeModifier = success ? 1.0f : 0.5f;
        
        // Calculate final gain
        float gain = baseGain * difficultyModifier * outcomeModifier;
        
        // Round to nearest integer
        return Mathf.RoundToInt(gain);
    }
    
    public static string GetSkillLevelDescription(int level)
    {
        if (level >= 90)
            return "Master";
        else if (level >= 75)
            return "Expert";
        else if (level >= 60)
            return "Advanced";
        else if (level >= 45)
            return "Intermediate";
        else if (level >= 30)
            return "Basic";
        else if (level >= 15)
            return "Novice";
        else
            return "Untrained";
    }
    
    public static string GetSkillSummary(Dictionary<string, int> skillLevels)
    {
        if (skillLevels.Count == 0)
        {
            return "No skills to display.";
        }
        
        // Group skills by category
        Dictionary<string, List<Skill>> skillsByCategory = new Dictionary<string, List<Skill>>();
        
        foreach (var skillLevel in skillLevels)
        {
            Skill skill = GetSkill(skillLevel.Key);
            if (skill != null)
            {
                if (!skillsByCategory.ContainsKey(skill.category))
                {
                    skillsByCategory[skill.category] = new List<Skill>();
                }
                
                skillsByCategory[skill.category].Add(skill);
            }
        }
        
        string summary = "Skill Summary:\n";
        
        foreach (var category in skillsByCategory)
        {
            SkillCategory skillCategory = GetCategory(category.Key);
            summary += $"\n{skillCategory.categoryName}:\n";
            
            foreach (var skill in category.Value)
            {
                int level = skillLevels[skill.skillId];
                string levelDescription = GetSkillLevelDescription(level);
                summary += $"- {skill.skillName}: {levelDescription} ({level})\n";
            }
        }
        
        return summary;
    }
} 