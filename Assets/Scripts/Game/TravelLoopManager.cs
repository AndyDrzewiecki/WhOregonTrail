using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

public class TravelLoopManager : MonoBehaviour
{
    public static TravelLoopManager Instance { get; private set; }

    [Header("Travel Settings")]
    public float baseSpeed = 5f;
    public float currentSpeed;
    public float healthDecayRate = 0.1f;
    public float moraleDecayRate = 0.05f;
    public float eventCheckInterval = 5f;
    public float eventTriggerChance = 0.1f;

    [Header("Character Management")]
    public List<Character> selectedPlayerCharacters;
    public List<Character> selectedAICharacters;
    public Character activeCharacter;

    [Header("Resource Management")]
    public float food = 100f;
    public float water = 100f;
    public float morale = 100f;
    public float health = 100f;
    public int coins = 1000;

    private bool isTraveling = false;
    private float distanceTraveled = 0f;
    private float lastEventCheck = 0f;

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
        InitializeTravelLoop();
    }

    private void Update()
    {
        if (isTraveling)
        {
            UpdateTravel();
            UpdateResources();
            CheckEventTriggers();
        }
    }

    private void InitializeTravelLoop()
    {
        currentSpeed = baseSpeed;
        isTraveling = false;
        distanceTraveled = 0f;
        lastEventCheck = Time.time;
    }

    private void UpdateTravel()
    {
        distanceTraveled += currentSpeed * Time.deltaTime;
        // Update UI and game state based on distance traveled
    }

    private void UpdateResources()
    {
        // Decay resources over time
        health = Mathf.Max(0, health - healthDecayRate * Time.deltaTime);
        morale = Mathf.Max(0, morale - moraleDecayRate * Time.deltaTime);

        // Update UI
        UIManager.Instance.UpdateResourceDisplay();
    }

    private void CheckEventTriggers()
    {
        if (Time.time - lastEventCheck >= eventCheckInterval)
        {
            lastEventCheck = Time.time;
            if (UnityEngine.Random.value < eventTriggerChance)
            {
                EventManager.Instance.TriggerRandomEvent();
            }
        }
    }

    public void StartTravel()
    {
        isTraveling = true;
    }

    public void PauseTravel()
    {
        isTraveling = false;
    }

    public void SetTravelSpeed(float speed)
    {
        currentSpeed = Mathf.Clamp(speed, 0, baseSpeed * 2);
    }

    public void SwitchActiveCharacter(Character character)
    {
        if (selectedPlayerCharacters.Contains(character))
        {
            activeCharacter = character;
            CameraController.Instance.SetTarget(character.transform);
        }
    }

    public void SaveGameState()
    {
        // Implement save functionality
        SaveManager.Instance.SaveGameState();
    }

    public void LoadGameState()
    {
        // Implement load functionality
        SaveManager.Instance.LoadGameState();
    }
} 