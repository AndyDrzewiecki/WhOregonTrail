using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Game State")]
    public GameState currentState = GameState.MainMenu;
    public float gameTime = 0f;
    public float dayLength = 300f; // 5 minutes per day
    public int currentDay = 1;

    [Header("References")]
    public TravelLoopManager travelManager;
    public EventManager eventManager;
    public UIManager uiManager;
    public CameraController cameraController;
    public SaveManager saveManager;

    [Header("Game Settings")]
    public int maxCharacters = 4;
    public float startingFood = 100f;
    public float startingWater = 100f;
    public float startingMorale = 100f;
    public float startingHealth = 100f;
    public int startingCoins = 1000;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeManagers();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        // Initialize game systems
        if (saveManager.HasSaveFile())
        {
            ShowLoadGameDialog();
        }
        else
        {
            ShowNewGameDialog();
        }
    }

    private void Update()
    {
        if (currentState == GameState.Playing)
        {
            UpdateGameTime();
        }
    }

    private void InitializeManagers()
    {
        // Ensure all required managers are present
        if (travelManager == null) travelManager = GetComponent<TravelLoopManager>();
        if (eventManager == null) eventManager = GetComponent<EventManager>();
        if (uiManager == null) uiManager = GetComponent<UIManager>();
        if (cameraController == null) cameraController = GetComponent<CameraController>();
        if (saveManager == null) saveManager = GetComponent<SaveManager>();
    }

    private void UpdateGameTime()
    {
        gameTime += Time.deltaTime;
        if (gameTime >= dayLength)
        {
            gameTime = 0f;
            currentDay++;
            OnNewDay();
        }
    }

    private void OnNewDay()
    {
        // Trigger daily events and updates
        eventManager.TriggerRandomEvent();
        travelManager.UpdateResources();
        uiManager.UpdateResourceDisplay();
    }

    public void StartNewGame()
    {
        currentState = GameState.CharacterSelection;
        uiManager.ShowCharacterSelection(GenerateAvailableCharacters());
    }

    public void LoadGame()
    {
        saveManager.LoadGameState();
        currentState = GameState.Playing;
        travelManager.StartTravel();
    }

    public void SaveGame()
    {
        saveManager.SaveGameState();
        uiManager.ShowNotification("Game Saved");
    }

    public void PauseGame()
    {
        currentState = GameState.Paused;
        Time.timeScale = 0f;
        uiManager.ShowPauseMenu();
    }

    public void ResumeGame()
    {
        currentState = GameState.Playing;
        Time.timeScale = 1f;
        uiManager.HidePauseMenu();
    }

    public void QuitGame()
    {
        SaveGame();
        #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
        #else
            Application.Quit();
        #endif
    }

    private List<Character> GenerateAvailableCharacters()
    {
        List<Character> characters = new List<Character>();
        // TODO: Generate characters from backend API
        return characters;
    }

    private void ShowNewGameDialog()
    {
        uiManager.ShowDialog("New Game", "Would you like to start a new game?");
    }

    private void ShowLoadGameDialog()
    {
        uiManager.ShowDialog("Load Game", "Would you like to load your saved game?");
    }
}

public enum GameState
{
    MainMenu,
    CharacterSelection,
    Playing,
    Paused,
    GameOver
} 