using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Newtonsoft.Json;
using System.Threading.Tasks;

public class SaveManager : MonoBehaviour
{
    private static SaveManager _instance;
    public static SaveManager Instance
    {
        get
        {
            if (_instance == null)
            {
                GameObject go = new GameObject("SaveManager");
                _instance = go.AddComponent<SaveManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }
    
    private string _saveDirectory;
    private const string SAVE_EXTENSION = ".save";
    
    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }
        
        _instance = this;
        DontDestroyOnLoad(gameObject);
        
        _saveDirectory = Path.Combine(Application.persistentDataPath, "Saves");
        if (!Directory.Exists(_saveDirectory))
        {
            Directory.CreateDirectory(_saveDirectory);
        }
    }
    
    public List<string> GetSaveFiles()
    {
        string[] files = Directory.GetFiles(_saveDirectory, $"*{SAVE_EXTENSION}");
        List<string> saveNames = new List<string>();
        
        foreach (string file in files)
        {
            string fileName = Path.GetFileNameWithoutExtension(file);
            saveNames.Add(fileName);
        }
        
        return saveNames;
    }
    
    public async Task<bool> SaveGame(string saveName, GameState gameState)
    {
        try
        {
            string filePath = Path.Combine(_saveDirectory, $"{saveName}{SAVE_EXTENSION}");
            
            // Convert game state to JSON
            string json = JsonConvert.SerializeObject(gameState, Formatting.Indented);
            
            // Write to file
            await File.WriteAllTextAsync(filePath, json);
            
            Debug.Log($"Game saved to {filePath}");
            return true;
        }
        catch (Exception e)
        {
            Debug.LogError($"Error saving game: {e.Message}");
            return false;
        }
    }
    
    public async Task<GameState> LoadGame(string saveName)
    {
        try
        {
            string filePath = Path.Combine(_saveDirectory, $"{saveName}{SAVE_EXTENSION}");
            
            if (!File.Exists(filePath))
            {
                Debug.LogError($"Save file not found: {filePath}");
                return null;
            }
            
            // Read from file
            string json = await File.ReadAllTextAsync(filePath);
            
            // Convert JSON to game state
            GameState gameState = JsonConvert.DeserializeObject<GameState>(json);
            
            Debug.Log($"Game loaded from {filePath}");
            return gameState;
        }
        catch (Exception e)
        {
            Debug.LogError($"Error loading game: {e.Message}");
            return null;
        }
    }
    
    public bool DeleteSave(string saveName)
    {
        try
        {
            string filePath = Path.Combine(_saveDirectory, $"{saveName}{SAVE_EXTENSION}");
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                Debug.Log($"Save file deleted: {filePath}");
                return true;
            }
            
            Debug.LogWarning($"Save file not found: {filePath}");
            return false;
        }
        catch (Exception e)
        {
            Debug.LogError($"Error deleting save: {e.Message}");
            return false;
        }
    }
    
    public async Task<bool> AutoSave(GameState gameState)
    {
        string autoSaveName = $"AutoSave_{DateTime.Now:yyyy-MM-dd_HH-mm-ss}";
        return await SaveGame(autoSaveName, gameState);
    }
}

[Serializable]
public class GameState
{
    public string saveName;
    public DateTime saveDate;
    public string playerCharacterId;
    public List<string> partyCharacterIds;
    public Dictionary<string, int> relationships;
    public Inventory inventory;
    public List<Mission> missions;
    public GameProgress progress;
    public Dictionary<string, object> gameData;
    public Dictionary<string, CompanionMemory> characterMemories;
    
    public GameState()
    {
        saveDate = DateTime.Now;
        partyCharacterIds = new List<string>();
        relationships = new Dictionary<string, int>();
        inventory = new Inventory();
        missions = new List<Mission>();
        progress = new GameProgress();
        gameData = new Dictionary<string, object>();
        characterMemories = new Dictionary<string, CompanionMemory>();
    }
}

[Serializable]
public class Inventory
{
    public int money;
    public Dictionary<string, int> resources;
    public List<Item> items;
    
    public Inventory()
    {
        money = 0;
        resources = new Dictionary<string, int>();
        items = new List<Item>();
    }
}

[Serializable]
public class Item
{
    public string id;
    public string name;
    public string description;
    public int quantity;
    public Dictionary<string, object> properties;
    
    public Item()
    {
        properties = new Dictionary<string, object>();
    }
}

[Serializable]
public class Mission
{
    public string id;
    public string type;
    public string status;
    public Dictionary<string, object> progress;
    public Dictionary<string, object> rewards;
    
    public Mission()
    {
        progress = new Dictionary<string, object>();
        rewards = new Dictionary<string, object>();
    }
}

[Serializable]
public class GameProgress
{
    public int currentDay;
    public string currentLocation;
    public float distanceTraveled;
    public List<string> completedMissions;
    public List<string> discoveredLocations;
    
    public GameProgress()
    {
        currentDay = 1;
        currentLocation = "Starting Point";
        distanceTraveled = 0;
        completedMissions = new List<string>();
        discoveredLocations = new List<string>();
    }
} 