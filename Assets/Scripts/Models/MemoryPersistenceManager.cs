using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Newtonsoft.Json;

public class MemoryPersistenceManager : MonoBehaviour
{
    private static MemoryPersistenceManager _instance;
    public static MemoryPersistenceManager Instance
    {
        get
        {
            if (_instance == null)
            {
                GameObject go = new GameObject("MemoryPersistenceManager");
                _instance = go.AddComponent<MemoryPersistenceManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    private string _memoryDirectory;
    private const string MEMORY_EXTENSION = ".memories";

    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }

        _instance = this;
        DontDestroyOnLoad(gameObject);

        _memoryDirectory = Path.Combine(Application.persistentDataPath, "Memories");
        if (!Directory.Exists(_memoryDirectory))
        {
            Directory.CreateDirectory(_memoryDirectory);
        }
    }

    public void SaveCharacterMemories(string characterId, CompanionMemory memory)
    {
        try
        {
            string filePath = Path.Combine(_memoryDirectory, $"{characterId}{MEMORY_EXTENSION}");
            string json = JsonConvert.SerializeObject(memory, Formatting.Indented);
            File.WriteAllText(filePath, json);
            Debug.Log($"Memories saved for character {characterId}");
        }
        catch (Exception e)
        {
            Debug.LogError($"Error saving memories for character {characterId}: {e.Message}");
        }
    }

    public CompanionMemory LoadCharacterMemories(string characterId)
    {
        try
        {
            string filePath = Path.Combine(_memoryDirectory, $"{characterId}{MEMORY_EXTENSION}");
            if (File.Exists(filePath))
            {
                string json = File.ReadAllText(filePath);
                var memory = JsonConvert.DeserializeObject<CompanionMemory>(json);
                Debug.Log($"Memories loaded for character {characterId}");
                return memory;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error loading memories for character {characterId}: {e.Message}");
        }
        return null;
    }

    public void SaveAllMemories(Dictionary<string, CompanionMemory> memories)
    {
        foreach (var memory in memories)
        {
            SaveCharacterMemories(memory.Key, memory.Value);
        }
    }

    public Dictionary<string, CompanionMemory> LoadAllMemories(List<string> characterIds)
    {
        var memories = new Dictionary<string, CompanionMemory>();
        foreach (var characterId in characterIds)
        {
            var memory = LoadCharacterMemories(characterId);
            if (memory != null)
            {
                memories[characterId] = memory;
            }
        }
        return memories;
    }

    public void DeleteCharacterMemories(string characterId)
    {
        try
        {
            string filePath = Path.Combine(_memoryDirectory, $"{characterId}{MEMORY_EXTENSION}");
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                Debug.Log($"Memories deleted for character {characterId}");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error deleting memories for character {characterId}: {e.Message}");
        }
    }

    public List<string> GetCharactersWithMemories()
    {
        string[] files = Directory.GetFiles(_memoryDirectory, $"*{MEMORY_EXTENSION}");
        List<string> characterIds = new List<string>();
        
        foreach (string file in files)
        {
            string fileName = Path.GetFileNameWithoutExtension(file);
            characterIds.Add(fileName);
        }
        
        return characterIds;
    }
} 