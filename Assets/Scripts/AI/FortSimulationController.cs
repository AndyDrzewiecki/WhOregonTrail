using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.UIElements;
using System.Linq;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

public class FortSimulationController : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private UIDocument fortSimulationUI;
    [SerializeField] private VisualTreeAsset missionCardTemplate;
    [SerializeField] private VisualTreeAsset characterSlotTemplate;
    
    [Header("API Configuration")]
    [SerializeField] private string apiBaseUrl = "http://localhost:8000";
    
    // UI Elements
    private VisualElement root;
    private Label dayLabel;
    private Label fortStatusLabel;
    private VisualElement missionsContainer;
    private VisualElement charactersContainer;
    private Button submitButton;
    private Button nextDayButton;
    private VisualElement summaryPanel;
    private Label summaryText;
    private Button returnToTravelButton;
    
    // Game State
    private Dictionary<string, object> gameState;
    private string simulationId;
    private int currentDay = 1;
    private int maxDays = 3;
    private List<MissionData> availableMissions = new List<MissionData>();
    private List<CharacterData> availableCharacters = new List<CharacterData>();
    private Dictionary<string, string> missionAssignments = new Dictionary<string, string>();
    private FortData fortData;
    
    // HTTP Client
    private HttpClient httpClient = new HttpClient();
    
    private void OnEnable()
    {
        // Get UI elements
        root = fortSimulationUI.rootVisualElement;
        dayLabel = root.Q<Label>("day-label");
        fortStatusLabel = root.Q<Label>("fort-status-label");
        missionsContainer = root.Q<VisualElement>("missions-container");
        charactersContainer = root.Q<VisualElement>("characters-container");
        submitButton = root.Q<Button>("submit-button");
        nextDayButton = root.Q<Button>("next-day-button");
        summaryPanel = root.Q<VisualElement>("summary-panel");
        summaryText = root.Q<Label>("summary-text");
        returnToTravelButton = root.Q<Button>("return-to-travel-button");
        
        // Add event handlers
        submitButton.clicked += OnSubmitClicked;
        nextDayButton.clicked += OnNextDayClicked;
        returnToTravelButton.clicked += OnReturnToTravelClicked;
        
        // Hide summary panel initially
        summaryPanel.style.display = DisplayStyle.None;
        
        // Start fort simulation
        StartCoroutine(StartFortSimulation());
    }
    
    private void OnDisable()
    {
        // Remove event handlers
        submitButton.clicked -= OnSubmitClicked;
        nextDayButton.clicked -= OnNextDayClicked;
        returnToTravelButton.clicked -= OnReturnToTravelClicked;
    }
    
    private IEnumerator StartFortSimulation()
    {
        // Get game state from GameManager
        gameState = GameManager.Instance.GetGameState();
        
        // Get available characters
        availableCharacters = CharacterManager.Instance.GetAvailableCharacters();
        
        // Start fort simulation
        yield return StartCoroutine(StartSimulation());
    }
    
    private IEnumerator StartSimulation()
    {
        try
        {
            // Prepare request data
            var requestData = new
            {
                game_state = gameState,
                action = "start"
            };
            
            // Send request to backend
            var response = await SendRequest("/fort/day", requestData);
            
            // Parse response
            var result = JsonConvert.DeserializeObject<FortSimulationResponse>(response);
            
            // Update simulation ID
            simulationId = result.simulation_id;
            
            // Update game state
            gameState["simulation_id"] = simulationId;
            
            // Update UI with missions and fort data
            UpdateUIWithSimulationData(result.result);
            
            yield return null;
        }
        catch (Exception e)
        {
            Debug.LogError($"Error starting fort simulation: {e.Message}");
            // Show error message
            ShowErrorMessage("Failed to start fort simulation. Please try again.");
        }
    }
    
    private void UpdateUIWithSimulationData(FortSimulationResult result)
    {
        // Update day label
        currentDay = result.day;
        maxDays = result.max_days;
        dayLabel.text = $"Day {currentDay} of {maxDays}";
        
        // Update fort data
        fortData = new FortData(result.fort_data);
        UpdateFortStatusLabel();
        
        // Clear existing missions and characters
        missionsContainer.Clear();
        charactersContainer.Clear();
        missionAssignments.Clear();
        
        // Add mission cards
        availableMissions = result.missions.Select(m => new MissionData(m)).ToList();
        foreach (var mission in availableMissions)
        {
            var missionCard = missionCardTemplate.Instantiate();
            
            // Set mission data
            var missionTitle = missionCard.Q<Label>("mission-title");
            var missionDescription = missionCard.Q<Label>("mission-description");
            var missionDifficulty = missionCard.Q<Label>("mission-difficulty");
            var missionSkills = missionCard.Q<Label>("mission-skills");
            
            missionTitle.text = mission.type.ToUpper();
            missionDescription.text = mission.description;
            missionDifficulty.text = $"Difficulty: {mission.difficulty}";
            missionSkills.text = $"Required Skills: {string.Join(", ", mission.required_skills)}";
            
            // Add character dropdown
            var characterDropdown = missionCard.Q<DropdownField>("character-dropdown");
            characterDropdown.choices = availableCharacters.Select(c => c.name).ToList();
            characterDropdown.value = "Select Character";
            
            // Add event handler for dropdown change
            characterDropdown.RegisterValueChangedCallback(evt => 
            {
                var selectedCharacter = availableCharacters.FirstOrDefault(c => c.name == evt.newValue);
                if (selectedCharacter != null)
                {
                    missionAssignments[mission.id] = selectedCharacter.id;
                }
            });
            
            missionsContainer.Add(missionCard);
        }
        
        // Add character slots
        foreach (var character in availableCharacters)
        {
            var characterSlot = characterSlotTemplate.Instantiate();
            
            // Set character data
            var characterName = characterSlot.Q<Label>("character-name");
            var characterSkills = characterSlot.Q<Label>("character-skills");
            var characterStatus = characterSlot.Q<Label>("character-status");
            
            characterName.text = character.name;
            characterSkills.text = $"Skills: {string.Join(", ", character.skills.Keys)}";
            characterStatus.text = $"Morale: {character.state.GetValueOrDefault("morale", 50)}";
            
            charactersContainer.Add(characterSlot);
        }
        
        // Enable/disable buttons
        submitButton.SetEnabled(true);
        nextDayButton.SetEnabled(false);
    }
    
    private void UpdateFortStatusLabel()
    {
        if (fortData != null)
        {
            fortStatusLabel.text = $"Fort Status: Defense {fortData.status.defense}/100, Morale {fortData.status.morale}/100, Suspicion {fortData.status.suspicion}/100";
        }
    }
    
    private void OnSubmitClicked()
    {
        // Check if all missions are assigned
        if (missionAssignments.Count < availableMissions.Count)
        {
            ShowErrorMessage("Please assign a character to all missions before submitting.");
            return;
        }
        
        // Submit assignments
        StartCoroutine(SubmitAssignments());
    }
    
    private IEnumerator SubmitAssignments()
    {
        try
        {
            // Prepare assignments
            var assignments = missionAssignments.Select(kvp => new
            {
                mission_id = kvp.Key,
                character_id = kvp.Value
            }).ToList();
            
            // Prepare request data
            var requestData = new
            {
                game_state = gameState,
                action = "submit",
                assignments = assignments
            };
            
            // Send request to backend
            var response = await SendRequest("/fort/day", requestData);
            
            // Parse response
            var result = JsonConvert.DeserializeObject<FortSimulationResponse>(response);
            
            // Process results
            ProcessDayResults(result.result);
            
            yield return null;
        }
        catch (Exception e)
        {
            Debug.LogError($"Error submitting assignments: {e.Message}");
            // Show error message
            ShowErrorMessage("Failed to submit assignments. Please try again.");
        }
    }
    
    private void ProcessDayResults(DayResults results)
    {
        // Update fort status
        fortData.status = new FortStatus(results.fort_status);
        UpdateFortStatusLabel();
        
        // Show mission results
        ShowMissionResults(results.mission_results);
        
        // Check if simulation is complete
        if (results.simulation_complete)
        {
            // Show summary
            ShowSummary(results.summary);
        }
        else
        {
            // Enable next day button
            nextDayButton.SetEnabled(true);
            submitButton.SetEnabled(false);
        }
    }
    
    private void ShowMissionResults(List<MissionResult> results)
    {
        // Create results panel
        var resultsPanel = new VisualElement();
        resultsPanel.style.position = Position.Absolute;
        resultsPanel.style.left = 0;
        resultsPanel.style.right = 0;
        resultsPanel.style.top = 0;
        resultsPanel.style.bottom = 0;
        resultsPanel.style.backgroundColor = new Color(0, 0, 0, 0.8f);
        resultsPanel.style.alignItems = Align.Center;
        resultsPanel.style.justifyContent = Justify.Center;
        
        // Create results container
        var resultsContainer = new VisualElement();
        resultsContainer.style.width = 600;
        resultsContainer.style.backgroundColor = new Color(0.2f, 0.2f, 0.2f);
        resultsContainer.style.padding = 10;
        resultsContainer.style.borderRadius = 5;
        
        // Add title
        var titleLabel = new Label("Day Results");
        titleLabel.style.fontSize = 24;
        titleLabel.style.color = Color.white;
        titleLabel.style.marginBottom = 10;
        resultsContainer.Add(titleLabel);
        
        // Add mission results
        foreach (var result in results)
        {
            var missionResult = new VisualElement();
            missionResult.style.marginBottom = 10;
            missionResult.style.padding = 10;
            missionResult.style.backgroundColor = new Color(0.3f, 0.3f, 0.3f);
            missionResult.style.borderRadius = 5;
            
            // Get mission and character
            var mission = availableMissions.FirstOrDefault(m => m.id == result.mission_id);
            var character = availableCharacters.FirstOrDefault(c => c.id == result.character_id);
            
            if (mission != null && character != null)
            {
                // Add mission title
                var missionTitle = new Label($"{mission.type.ToUpper()} - {character.name}");
                missionTitle.style.fontSize = 18;
                missionTitle.style.color = Color.white;
                missionResult.Add(missionTitle);
                
                // Add outcome
                var outcomeLabel = new Label($"Outcome: {result.outcome}");
                outcomeLabel.style.color = GetOutcomeColor(result.outcome);
                missionResult.Add(outcomeLabel);
                
                // Add description
                var descriptionLabel = new Label(result.description);
                descriptionLabel.style.color = Color.white;
                descriptionLabel.style.whiteSpace = WhiteSpace.Normal;
                missionResult.Add(descriptionLabel);
                
                // Add rewards
                var rewardsLabel = new Label("Rewards:");
                rewardsLabel.style.color = Color.white;
                missionResult.Add(rewardsLabel);
                
                var rewardsList = new VisualElement();
                rewardsList.style.marginLeft = 20;
                
                foreach (var reward in result.rewards)
                {
                    var rewardLabel = new Label($"{reward.Key}: {reward.Value}");
                    rewardLabel.style.color = Color.white;
                    rewardsList.Add(rewardLabel);
                }
                
                missionResult.Add(rewardsList);
            }
            
            resultsContainer.Add(missionResult);
        }
        
        // Add close button
        var closeButton = new Button(() => { root.Remove(resultsPanel); });
        closeButton.text = "Close";
        closeButton.style.marginTop = 10;
        resultsContainer.Add(closeButton);
        
        resultsPanel.Add(resultsContainer);
        root.Add(resultsPanel);
    }
    
    private Color GetOutcomeColor(string outcome)
    {
        switch (outcome.ToLower())
        {
            case "success":
                return new Color(0.2f, 0.8f, 0.2f);
            case "partial_success":
                return new Color(0.8f, 0.8f, 0.2f);
            case "failure":
                return new Color(0.8f, 0.2f, 0.2f);
            default:
                return Color.white;
        }
    }
    
    private void OnNextDayClicked()
    {
        // Update UI for next day
        if (currentDay < maxDays)
        {
            // Clear mission assignments
            missionAssignments.Clear();
            
            // Enable submit button
            submitButton.SetEnabled(true);
            nextDayButton.SetEnabled(false);
            
            // Update day label
            currentDay++;
            dayLabel.text = $"Day {currentDay} of {maxDays}";
        }
    }
    
    private void ShowSummary(SimulationSummary summary)
    {
        // Show summary panel
        summaryPanel.style.display = DisplayStyle.Flex;
        
        // Set summary text
        summaryText.text = summary.summary_text;
        
        // Disable next day button
        nextDayButton.SetEnabled(false);
        
        // Enable return to travel button
        returnToTravelButton.SetEnabled(true);
    }
    
    private void OnReturnToTravelClicked()
    {
        // Update game state with fort simulation results
        UpdateGameStateWithFortResults();
        
        // Return to travel phase
        SceneManager.LoadScene("TravelScene");
    }
    
    private void UpdateGameStateWithFortResults()
    {
        // Update character states
        foreach (var character in availableCharacters)
        {
            CharacterManager.Instance.UpdateCharacter(character);
        }
        
        // Update game state
        GameManager.Instance.UpdateGameState(gameState);
    }
    
    private void ShowErrorMessage(string message)
    {
        // Create error panel
        var errorPanel = new VisualElement();
        errorPanel.style.position = Position.Absolute;
        errorPanel.style.left = 0;
        errorPanel.style.right = 0;
        errorPanel.style.top = 0;
        errorPanel.style.bottom = 0;
        errorPanel.style.backgroundColor = new Color(0, 0, 0, 0.8f);
        errorPanel.style.alignItems = Align.Center;
        errorPanel.style.justifyContent = Justify.Center;
        
        // Create error container
        var errorContainer = new VisualElement();
        errorContainer.style.width = 400;
        errorContainer.style.backgroundColor = new Color(0.8f, 0.2f, 0.2f);
        errorContainer.style.padding = 20;
        errorContainer.style.borderRadius = 5;
        
        // Add error message
        var errorLabel = new Label(message);
        errorLabel.style.color = Color.white;
        errorLabel.style.whiteSpace = WhiteSpace.Normal;
        errorContainer.Add(errorLabel);
        
        // Add close button
        var closeButton = new Button(() => { root.Remove(errorPanel); });
        closeButton.text = "Close";
        closeButton.style.marginTop = 10;
        errorContainer.Add(closeButton);
        
        errorPanel.Add(errorContainer);
        root.Add(errorPanel);
    }
    
    private async Task<string> SendRequest(string endpoint, object data)
    {
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await httpClient.PostAsync($"{apiBaseUrl}{endpoint}", content);
        response.EnsureSuccessStatusCode();
        
        return await response.Content.ReadAsStringAsync();
    }
}

// Data classes
[System.Serializable]
public class MissionData
{
    public string id;
    public string type;
    public string description;
    public string difficulty;
    public List<string> required_skills;
    public string status;
    public string outcome;
    public Dictionary<string, object> rewards;
    
    public MissionData(Dictionary<string, object> data)
    {
        id = data["id"].ToString();
        type = data["type"].ToString();
        description = data["description"].ToString();
        difficulty = data["difficulty"].ToString();
        required_skills = ((Newtonsoft.Json.Linq.JArray)data["required_skills"]).ToObject<List<string>>();
        status = data["status"].ToString();
        outcome = data.ContainsKey("outcome") ? data["outcome"].ToString() : null;
        rewards = data.ContainsKey("rewards") ? ((Newtonsoft.Json.Linq.JObject)data["rewards"]).ToObject<Dictionary<string, object>>() : new Dictionary<string, object>();
    }
}

[System.Serializable]
public class FortData
{
    public string name;
    public string type;
    public string description;
    public Dictionary<string, int> resources;
    public Dictionary<string, int> inhabitants;
    public FortStatus status;
    
    public FortData(Dictionary<string, object> data)
    {
        name = data["name"].ToString();
        type = data["type"].ToString();
        description = data["description"].ToString();
        resources = ((Newtonsoft.Json.Linq.JObject)data["resources"]).ToObject<Dictionary<string, int>>();
        inhabitants = ((Newtonsoft.Json.Linq.JObject)data["inhabitants"]).ToObject<Dictionary<string, int>>();
        status = new FortStatus(((Newtonsoft.Json.Linq.JObject)data["status"]).ToObject<Dictionary<string, int>>());
    }
}

[System.Serializable]
public class FortStatus
{
    public int defense;
    public int morale;
    public int suspicion;
    
    public FortStatus(Dictionary<string, int> data)
    {
        defense = data["defense"];
        morale = data["morale"];
        suspicion = data["suspicion"];
    }
}

[System.Serializable]
public class MissionResult
{
    public string mission_id;
    public string character_id;
    public string outcome;
    public string description;
    public Dictionary<string, int> rewards;
}

[System.Serializable]
public class DayResults
{
    public int day;
    public List<MissionResult> mission_results;
    public Dictionary<string, int> fort_status;
    public bool simulation_complete;
    public SimulationSummary summary;
    public NextDay next_day;
}

[System.Serializable]
public class NextDay
{
    public int day;
    public List<MissionData> missions;
}

[System.Serializable]
public class SimulationSummary
{
    public int total_missions;
    public int successful_missions;
    public int partial_success_missions;
    public int failed_missions;
    public float success_rate;
    public Dictionary<string, int> fort_status;
    public int resource_change;
    public string summary_text;
}

[System.Serializable]
public class FortSimulationResponse
{
    public string simulation_id;
    public FortSimulationResult result;
}

[System.Serializable]
public class FortSimulationResult
{
    public int day;
    public int max_days;
    public List<MissionData> missions;
    public FortData fort_data;
} 