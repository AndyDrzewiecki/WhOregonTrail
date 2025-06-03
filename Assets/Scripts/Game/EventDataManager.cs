using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.IO;
using System.Linq;
using Newtonsoft.Json;

public class EventDataManager : MonoBehaviour
{
    public static EventDataManager Instance { get; private set; }

    [Header("Event Data")]
    public TextAsset[] eventDataFiles;
    public string eventsFolderPath = "Events";
    public bool loadFromResources = true;
    public bool loadFromStreamingAssets = false;
    public bool loadFromPersistentData = false;

    [Header("Event Categories")]
    public List<GameEvent> randomEvents = new List<GameEvent>();
    public List<GameEvent> storyEvents = new List<GameEvent>();
    public List<GameEvent> characterEvents = new List<GameEvent>();
    public List<GameEvent> locationEvents = new List<GameEvent>();
    public List<GameEvent> resourceEvents = new List<GameEvent>();
    public List<GameEvent> relationshipEvents = new List<GameEvent>();
    public List<GameEvent> questEvents = new List<GameEvent>();
    public List<GameEvent> achievementEvents = new List<GameEvent>();

    private Dictionary<string, GameEvent> eventDictionary = new Dictionary<string, GameEvent>();
    private bool isInitialized = false;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        LoadAllEventData();
    }

    public void LoadAllEventData()
    {
        if (isInitialized)
            return;

        // Clear existing data
        ClearEventData();

        // Load from Resources if specified
        if (loadFromResources)
        {
            LoadEventsFromResources();
        }

        // Load from StreamingAssets if specified
        if (loadFromStreamingAssets)
        {
            LoadEventsFromStreamingAssets();
        }

        // Load from PersistentData if specified
        if (loadFromPersistentData)
        {
            LoadEventsFromPersistentData();
        }

        // Load from serialized TextAssets if available
        if (eventDataFiles != null && eventDataFiles.Length > 0)
        {
            foreach (TextAsset eventDataFile in eventDataFiles)
            {
                LoadEventsFromTextAsset(eventDataFile);
            }
        }

        // Categorize events
        CategorizeEvents();

        isInitialized = true;
        Debug.Log($"Loaded {eventDictionary.Count} events in total");
    }

    private void ClearEventData()
    {
        randomEvents.Clear();
        storyEvents.Clear();
        characterEvents.Clear();
        locationEvents.Clear();
        resourceEvents.Clear();
        relationshipEvents.Clear();
        questEvents.Clear();
        achievementEvents.Clear();
        eventDictionary.Clear();
    }

    private void LoadEventsFromResources()
    {
        TextAsset[] resourcesEventFiles = Resources.LoadAll<TextAsset>(eventsFolderPath);
        foreach (TextAsset eventFile in resourcesEventFiles)
        {
            LoadEventsFromTextAsset(eventFile);
        }
    }

    private void LoadEventsFromStreamingAssets()
    {
        string streamingAssetsPath = Path.Combine(Application.streamingAssetsPath, eventsFolderPath);
        if (Directory.Exists(streamingAssetsPath))
        {
            string[] jsonFiles = Directory.GetFiles(streamingAssetsPath, "*.json");
            foreach (string jsonFile in jsonFiles)
            {
                LoadEventsFromFile(jsonFile);
            }
        }
    }

    private void LoadEventsFromPersistentData()
    {
        string persistentDataPath = Path.Combine(Application.persistentDataPath, eventsFolderPath);
        if (Directory.Exists(persistentDataPath))
        {
            string[] jsonFiles = Directory.GetFiles(persistentDataPath, "*.json");
            foreach (string jsonFile in jsonFiles)
            {
                LoadEventsFromFile(jsonFile);
            }
        }
    }

    private void LoadEventsFromTextAsset(TextAsset textAsset)
    {
        try
        {
            List<GameEvent> events = JsonConvert.DeserializeObject<List<GameEvent>>(textAsset.text);
            foreach (GameEvent gameEvent in events)
            {
                AddEventToDictionary(gameEvent);
            }
            Debug.Log($"Loaded {events.Count} events from {textAsset.name}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error loading events from {textAsset.name}: {e.Message}");
        }
    }

    private void LoadEventsFromFile(string filePath)
    {
        try
        {
            string jsonContent = File.ReadAllText(filePath);
            List<GameEvent> events = JsonConvert.DeserializeObject<List<GameEvent>>(jsonContent);
            foreach (GameEvent gameEvent in events)
            {
                AddEventToDictionary(gameEvent);
            }
            Debug.Log($"Loaded {events.Count} events from {filePath}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error loading events from {filePath}: {e.Message}");
        }
    }

    private void AddEventToDictionary(GameEvent gameEvent)
    {
        if (string.IsNullOrEmpty(gameEvent.id))
        {
            gameEvent.id = System.Guid.NewGuid().ToString();
        }

        if (!eventDictionary.ContainsKey(gameEvent.id))
        {
            eventDictionary.Add(gameEvent.id, gameEvent);
        }
        else
        {
            Debug.LogWarning($"Duplicate event ID found: {gameEvent.id}. Skipping.");
        }
    }

    private void CategorizeEvents()
    {
        foreach (GameEvent gameEvent in eventDictionary.Values)
        {
            switch (gameEvent.type)
            {
                case EventType.Random:
                    randomEvents.Add(gameEvent);
                    break;
                case EventType.Story:
                    storyEvents.Add(gameEvent);
                    break;
                case EventType.Character:
                    characterEvents.Add(gameEvent);
                    break;
                case EventType.Location:
                    locationEvents.Add(gameEvent);
                    break;
                case EventType.Resource:
                    resourceEvents.Add(gameEvent);
                    break;
                case EventType.Relationship:
                    relationshipEvents.Add(gameEvent);
                    break;
                case EventType.Quest:
                    questEvents.Add(gameEvent);
                    break;
                case EventType.Achievement:
                    achievementEvents.Add(gameEvent);
                    break;
                default:
                    randomEvents.Add(gameEvent);
                    break;
            }
        }
    }

    public GameEvent GetEventById(string eventId)
    {
        if (eventDictionary.TryGetValue(eventId, out GameEvent gameEvent))
        {
            return gameEvent;
        }
        return null;
    }

    public List<GameEvent> GetEventsByType(EventType type)
    {
        switch (type)
        {
            case EventType.Random:
                return randomEvents;
            case EventType.Story:
                return storyEvents;
            case EventType.Character:
                return characterEvents;
            case EventType.Location:
                return locationEvents;
            case EventType.Resource:
                return resourceEvents;
            case EventType.Relationship:
                return relationshipEvents;
            case EventType.Quest:
                return questEvents;
            case EventType.Achievement:
                return achievementEvents;
            default:
                return new List<GameEvent>();
        }
    }

    public List<GameEvent> GetEventsByCharacter(string characterId)
    {
        return eventDictionary.Values
            .Where(e => e.requiredCharacters.Contains(characterId))
            .ToList();
    }

    public List<GameEvent> GetEventsByLocation(string locationId)
    {
        return eventDictionary.Values
            .Where(e => e.requiredLocations.Contains(locationId))
            .ToList();
    }

    public List<GameEvent> GetEventsByItem(string itemId)
    {
        return eventDictionary.Values
            .Where(e => e.requiredItems.Contains(itemId))
            .ToList();
    }

    public void SaveEventToFile(GameEvent gameEvent, string fileName)
    {
        string json = JsonConvert.SerializeObject(gameEvent, Formatting.Indented);
        string filePath = Path.Combine(Application.persistentDataPath, eventsFolderPath, fileName);
        
        // Ensure directory exists
        Directory.CreateDirectory(Path.GetDirectoryName(filePath));
        
        File.WriteAllText(filePath, json);
        Debug.Log($"Saved event to {filePath}");
    }

    public void SaveEventsToFile(List<GameEvent> events, string fileName)
    {
        string json = JsonConvert.SerializeObject(events, Formatting.Indented);
        string filePath = Path.Combine(Application.persistentDataPath, eventsFolderPath, fileName);
        
        // Ensure directory exists
        Directory.CreateDirectory(Path.GetDirectoryName(filePath));
        
        File.WriteAllText(filePath, json);
        Debug.Log($"Saved {events.Count} events to {filePath}");
    }
} 