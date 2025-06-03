using UnityEngine;
using UnityEngine.UIElements;
using UnityEngine.SceneManagement;

public class MainMenuController : MonoBehaviour
{
    private UIDocument _document;
    private Button _newGameButton;
    private Button _loadGameButton;
    private Button _characterCreationButton;
    private Button _settingsButton;
    private Button _quitButton;

    private void OnEnable()
    {
        _document = GetComponent<UIDocument>();
        
        // Get UI elements
        var root = _document.rootVisualElement;
        _newGameButton = root.Q<Button>("new-game-button");
        _loadGameButton = root.Q<Button>("load-game-button");
        _characterCreationButton = root.Q<Button>("character-creation-button");
        _settingsButton = root.Q<Button>("settings-button");
        _quitButton = root.Q<Button>("quit-button");
        
        // Add event handlers
        _newGameButton.clicked += OnNewGameClicked;
        _loadGameButton.clicked += OnLoadGameClicked;
        _characterCreationButton.clicked += OnCharacterCreationClicked;
        _settingsButton.clicked += OnSettingsClicked;
        _quitButton.clicked += OnQuitClicked;
    }

    private void OnDisable()
    {
        // Remove event handlers
        _newGameButton.clicked -= OnNewGameClicked;
        _loadGameButton.clicked -= OnLoadGameClicked;
        _characterCreationButton.clicked -= OnCharacterCreationClicked;
        _settingsButton.clicked -= OnSettingsClicked;
        _quitButton.clicked -= OnQuitClicked;
    }

    private void OnNewGameClicked()
    {
        Debug.Log("New Game clicked");
        // Load character creation scene
        SceneManager.LoadScene("CharacterCreation");
    }

    private void OnLoadGameClicked()
    {
        Debug.Log("Load Game clicked");
        // Load save game selection scene
        SceneManager.LoadScene("SaveGameSelection");
    }

    private void OnCharacterCreationClicked()
    {
        Debug.Log("Character Creation clicked");
        // Load character creation scene
        SceneManager.LoadScene("CharacterCreation");
    }

    private void OnSettingsClicked()
    {
        Debug.Log("Settings clicked");
        // Load settings scene
        SceneManager.LoadScene("Settings");
    }

    private void OnQuitClicked()
    {
        Debug.Log("Quit clicked");
        #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
        #else
            Application.Quit();
        #endif
    }
} 