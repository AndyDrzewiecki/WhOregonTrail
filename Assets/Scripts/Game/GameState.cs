using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class GameState
{
    public string gameId;
    public DateTime lastSaved;
    public int currentDay;
    public float currentTime;
    public List<Character> characters;
    public List<GameEvent> eventHistory;
    public List<RelationshipEvent> relationshipHistory;
    public ResourceState resources;
    public GameProgress progress;
    public Dictionary<string, float> characterRelationships;

    public GameState()
    {
        gameId = Guid.NewGuid().ToString();
        lastSaved = DateTime.Now;
        currentDay = 1;
        currentTime = 0f;
        characters = new List<Character>();
        eventHistory = new List<GameEvent>();
        relationshipHistory = new List<RelationshipEvent>();
        resources = new ResourceState();
        progress = new GameProgress();
        characterRelationships = new Dictionary<string, float>();
    }
}

[Serializable]
public class ResourceState
{
    public float food;
    public float water;
    public float morale;
    public float health;
    public int coins;
    public Dictionary<string, int> inventory;

    public ResourceState()
    {
        food = 100f;
        water = 100f;
        morale = 100f;
        health = 100f;
        coins = 100;
        inventory = new Dictionary<string, int>();
    }
}

[Serializable]
public class GameProgress
{
    public float distanceTraveled;
    public int landmarksVisited;
    public int eventsCompleted;
    public int relationshipsFormed;
    public List<string> achievements;
    public Dictionary<string, bool> quests;

    public GameProgress()
    {
        distanceTraveled = 0f;
        landmarksVisited = 0;
        eventsCompleted = 0;
        relationshipsFormed = 0;
        achievements = new List<string>();
        quests = new Dictionary<string, bool>();
    }
} 