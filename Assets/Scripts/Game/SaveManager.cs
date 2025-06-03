using UnityEngine;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Collections.Generic;

[System.Serializable]
public class GameSaveData
{
    public float food;
    public float water;
    public float morale;
    public float health;
    public int coins;
    public List<CharacterSaveData> playerCharacters;
    public List<CharacterSaveData> aiCharacters;
    public float distanceTraveled;
}

[System.Serializable]
public class CharacterSaveData
{
    public string characterId;
    public string characterName;
    public CharacterStats stats;
    public CharacterTraits traits;
    public Dictionary<string, float> relationships;
}

public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance { get; private set; }
    private string savePath;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            savePath = Path.Combine(Application.persistentDataPath, "whoregon_trail.save");
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void SaveGameState()
    {
        GameSaveData saveData = new GameSaveData
        {
            food = TravelLoopManager.Instance.food,
            water = TravelLoopManager.Instance.water,
            morale = TravelLoopManager.Instance.morale,
            health = TravelLoopManager.Instance.health,
            coins = TravelLoopManager.Instance.coins,
            playerCharacters = new List<CharacterSaveData>(),
            aiCharacters = new List<CharacterSaveData>()
        };

        // Save player characters
        foreach (Character character in TravelLoopManager.Instance.selectedPlayerCharacters)
        {
            saveData.playerCharacters.Add(CreateCharacterSaveData(character));
        }

        // Save AI characters
        foreach (Character character in TravelLoopManager.Instance.selectedAICharacters)
        {
            saveData.aiCharacters.Add(CreateCharacterSaveData(character));
        }

        // Serialize and save to file
        BinaryFormatter formatter = new BinaryFormatter();
        using (FileStream stream = new FileStream(savePath, FileMode.Create))
        {
            formatter.Serialize(stream, saveData);
        }

        Debug.Log($"Game saved to {savePath}");
    }

    public void LoadGameState()
    {
        if (!File.Exists(savePath))
        {
            Debug.LogWarning("No save file found!");
            return;
        }

        BinaryFormatter formatter = new BinaryFormatter();
        GameSaveData saveData;

        using (FileStream stream = new FileStream(savePath, FileMode.Open))
        {
            saveData = (GameSaveData)formatter.Deserialize(stream);
        }

        // Load game state
        TravelLoopManager.Instance.food = saveData.food;
        TravelLoopManager.Instance.water = saveData.water;
        TravelLoopManager.Instance.morale = saveData.morale;
        TravelLoopManager.Instance.health = saveData.health;
        TravelLoopManager.Instance.coins = saveData.coins;

        // Clear existing characters
        TravelLoopManager.Instance.selectedPlayerCharacters.Clear();
        TravelLoopManager.Instance.selectedAICharacters.Clear();

        // Load player characters
        foreach (CharacterSaveData charData in saveData.playerCharacters)
        {
            Character character = CreateCharacterFromSaveData(charData);
            TravelLoopManager.Instance.selectedPlayerCharacters.Add(character);
        }

        // Load AI characters
        foreach (CharacterSaveData charData in saveData.aiCharacters)
        {
            Character character = CreateCharacterFromSaveData(charData);
            TravelLoopManager.Instance.selectedAICharacters.Add(character);
        }

        // Update UI
        UIManager.Instance.UpdateResourceDisplay();

        Debug.Log("Game loaded successfully");
    }

    private CharacterSaveData CreateCharacterSaveData(Character character)
    {
        return new CharacterSaveData
        {
            characterId = character.characterId,
            characterName = character.characterName,
            stats = character.stats,
            traits = character.traits,
            relationships = new Dictionary<string, float>(character.relationships)
        };
    }

    private Character CreateCharacterFromSaveData(CharacterSaveData saveData)
    {
        GameObject characterObj = new GameObject(saveData.characterName);
        Character character = characterObj.AddComponent<Character>();
        
        character.characterId = saveData.characterId;
        character.characterName = saveData.characterName;
        character.stats = saveData.stats;
        character.traits = saveData.traits;
        character.relationships = new Dictionary<string, float>(saveData.relationships);

        return character;
    }

    public bool HasSaveFile()
    {
        return File.Exists(savePath);
    }

    public void DeleteSaveFile()
    {
        if (File.Exists(savePath))
        {
            File.Delete(savePath);
            Debug.Log("Save file deleted");
        }
    }
} 