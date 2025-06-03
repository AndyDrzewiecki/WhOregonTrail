using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance { get; private set; }

    [Header("HUD Elements")]
    public TextMeshProUGUI foodText;
    public TextMeshProUGUI waterText;
    public TextMeshProUGUI moraleText;
    public TextMeshProUGUI healthText;
    public TextMeshProUGUI coinsText;
    public Image minimapImage;
    public Image relationshipMatrixImage;

    [Header("Dialog System")]
    public GameObject dialogPanel;
    public TextMeshProUGUI dialogTitle;
    public TextMeshProUGUI dialogText;
    public TMP_InputField inputField;
    public Button sendButton;
    public Button closeButton;

    [Header("Event System")]
    public GameObject eventPanel;
    public TextMeshProUGUI eventTitle;
    public TextMeshProUGUI eventDescription;
    public Transform choiceButtonContainer;
    public GameObject choiceButtonPrefab;

    [Header("Character Selection")]
    public GameObject characterSelectionPanel;
    public Transform characterButtonContainer;
    public GameObject characterButtonPrefab;

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
        InitializeUI();
    }

    private void InitializeUI()
    {
        // Initialize HUD
        UpdateResourceDisplay();
        
        // Setup dialog system
        if (sendButton != null)
        {
            sendButton.onClick.AddListener(SendDialog);
        }
        
        if (closeButton != null)
        {
            closeButton.onClick.AddListener(() => dialogPanel.SetActive(false));
        }
    }

    public void UpdateResourceDisplay()
    {
        if (foodText != null) foodText.text = $"Food: {TravelLoopManager.Instance.food:F1}";
        if (waterText != null) waterText.text = $"Water: {TravelLoopManager.Instance.water:F1}";
        if (moraleText != null) moraleText.text = $"Morale: {TravelLoopManager.Instance.morale:F1}";
        if (healthText != null) healthText.text = $"Health: {TravelLoopManager.Instance.health:F1}";
        if (coinsText != null) coinsText.text = $"Coins: {TravelLoopManager.Instance.coins}";
    }

    public void UpdateCharacterStats(Character character)
    {
        // Update character stats in UI
        // This would be called when character stats change
    }

    public void UpdateRelationshipDisplay(Character character, string targetCharacterId)
    {
        // Update relationship display in UI
        // This would be called when relationships change
    }

    public void ShowEventDialog(GameEvent gameEvent)
    {
        eventPanel.SetActive(true);
        eventTitle.text = gameEvent.title;
        eventDescription.text = gameEvent.description;

        // Clear existing choice buttons
        foreach (Transform child in choiceButtonContainer)
        {
            Destroy(child.gameObject);
        }

        // Create new choice buttons
        foreach (EventChoice choice in gameEvent.choices)
        {
            GameObject buttonObj = Instantiate(choiceButtonPrefab, choiceButtonContainer);
            Button button = buttonObj.GetComponent<Button>();
            TextMeshProUGUI buttonText = buttonObj.GetComponentInChildren<TextMeshProUGUI>();
            
            buttonText.text = choice.choiceText;
            button.onClick.AddListener(() => EventManager.Instance.ProcessEventChoice(gameEvent, choice));
        }
    }

    public void ShowEventOutcome(string outcome)
    {
        eventDescription.text = outcome;
        // Hide choice buttons
        foreach (Transform child in choiceButtonContainer)
        {
            child.gameObject.SetActive(false);
        }
    }

    public void ShowDialog(string title, string text)
    {
        dialogPanel.SetActive(true);
        dialogTitle.text = title;
        dialogText.text = text;
    }

    private async void SendDialog()
    {
        if (string.IsNullOrEmpty(inputField.text))
            return;

        string userInput = inputField.text;
        inputField.text = "";

        // Show user input in dialog
        dialogText.text += $"\nYou: {userInput}";

        // TODO: Send to backend API and get response
        // For now, just show a mock response
        string response = "This is a mock response from the AI.";
        dialogText.text += $"\nAI: {response}";
    }

    public void ShowCharacterSelection(List<Character> availableCharacters)
    {
        characterSelectionPanel.SetActive(true);

        // Clear existing character buttons
        foreach (Transform child in characterButtonContainer)
        {
            Destroy(child.gameObject);
        }

        // Create character selection buttons
        foreach (Character character in availableCharacters)
        {
            GameObject buttonObj = Instantiate(characterButtonPrefab, characterButtonContainer);
            Button button = buttonObj.GetComponent<Button>();
            TextMeshProUGUI buttonText = buttonObj.GetComponentInChildren<TextMeshProUGUI>();
            
            buttonText.text = character.characterName;
            button.onClick.AddListener(() => SelectCharacter(character));
        }
    }

    private void SelectCharacter(Character character)
    {
        // Add character to selected list
        if (TravelLoopManager.Instance.selectedPlayerCharacters.Count < 4)
        {
            TravelLoopManager.Instance.selectedPlayerCharacters.Add(character);
            
            // If we have 4 characters selected, close the panel
            if (TravelLoopManager.Instance.selectedPlayerCharacters.Count == 4)
            {
                characterSelectionPanel.SetActive(false);
                // Start AI character selection
                SelectAICharacters();
            }
        }
    }

    private void SelectAICharacters()
    {
        // TODO: Implement AI character selection
        // For now, just add some placeholder characters
        for (int i = 0; i < 4; i++)
        {
            GameObject characterObj = new GameObject($"AICharacter_{i}");
            Character character = characterObj.AddComponent<Character>();
            character.characterId = $"ai_{i}";
            character.characterName = $"AI Companion {i + 1}";
            TravelLoopManager.Instance.selectedAICharacters.Add(character);
        }
    }
} 