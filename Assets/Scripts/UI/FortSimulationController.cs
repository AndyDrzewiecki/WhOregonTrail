using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
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
    [SerializeField] private VisualTreeAsset characterStatusTemplate;
    [SerializeField] private VisualTreeAsset missionRewardsTemplate;
    [SerializeField] private VisualTreeAsset companionSheetTemplate;
    [SerializeField] private VisualTreeAsset fortDaySummaryTemplate;
    
    [Header("API Configuration")]
    [SerializeField] private string apiBaseUrl = "http://localhost:8000";
    
    // UI Elements
    private VisualElement root;
    private Label dayLabel;
    private Label fortNameLabel;
    private Label moneyValueLabel;
    private Label rashValueLabel;
    private ProgressBar moraleBar;
    private ProgressBar suspicionBar;
    private ScrollView charactersScroll;
    private ScrollView missionsScroll;
    private VisualElement missionDetailsContent;
    private Button beginMissionsButton;
    private VisualElement daySummaryOverlay;
    private VisualElement missionResults;
    private VisualElement resourceChangesList;
    private Button continueButton;
    
    // Game State
    private int currentDay = 1;
    private int maxDays = 3;
    private string fortName = "Fort Independence";
    private int money = 1000;
    private int rashPercentage = 0;
    private int morale = 50;
    private int suspicion = 30;
    
    // Mission and Character Data
    private List<MissionData> availableMissions = new List<MissionData>();
    private List<CharacterData> availableCharacters = new List<CharacterData>();
    private Dictionary<string, string> missionAssignments = new Dictionary<string, string>();
    private MissionData selectedMission;
    
    // Companion Data
    private Dictionary<string, CompanionMemory> companionMemories = new Dictionary<string, CompanionMemory>();
    
    // HTTP Client
    private HttpClient httpClient = new HttpClient();
    
    private DialogueInteractionController dialogueController;
    
    private void OnEnable()
    {
        // Get UI elements
        root = fortSimulationUI.rootVisualElement;
        dayLabel = root.Q<Label>("day-label");
        fortNameLabel = root.Q<Label>("fort-name");
        moneyValueLabel = root.Q<Label>("money-value");
        rashValueLabel = root.Q<Label>("rash-value");
        moraleBar = root.Q<ProgressBar>("morale-bar");
        suspicionBar = root.Q<ProgressBar>("suspicion-bar");
        charactersScroll = root.Q<ScrollView>("characters-scroll");
        missionsScroll = root.Q<ScrollView>("missions-scroll");
        missionDetailsContent = root.Q<VisualElement>("mission-details-content");
        beginMissionsButton = root.Q<Button>("begin-missions-button");
        daySummaryOverlay = root.Q<VisualElement>("day-summary-overlay");
        missionResults = root.Q<VisualElement>("mission-results");
        resourceChangesList = root.Q<VisualElement>("resource-changes-list");
        continueButton = root.Q<Button>("continue-button");
        
        // Add event handlers
        beginMissionsButton.clicked += OnBeginMissionsClicked;
        continueButton.clicked += OnContinueClicked;
        
        // Initialize UI
        UpdateUI();
        
        // Load game data
        StartCoroutine(LoadGameData());
        
        // Initialize companion memories
        InitializeCompanionMemories();
        
        // Initialize dialogue controller
        dialogueController = new DialogueInteractionController(root.Q<VisualElement>("dialogue-panel"));
    }
    
    private void OnDisable()
    {
        // Remove event handlers
        beginMissionsButton.clicked -= OnBeginMissionsClicked;
        continueButton.clicked -= OnContinueClicked;
    }
    
    private void UpdateUI()
    {
        // Update top bar
        dayLabel.text = $"Day {currentDay} of {maxDays}";
        fortNameLabel.text = fortName;
        moneyValueLabel.text = money.ToString();
        rashValueLabel.text = $"{rashPercentage}%";
        moraleBar.value = morale;
        suspicionBar.value = suspicion;
        
        // Update button states
        beginMissionsButton.SetEnabled(missionAssignments.Count == availableMissions.Count);
    }
    
    private IEnumerator LoadGameData()
    {
        try
        {
            // Load characters
            yield return StartCoroutine(LoadCharacters());
            
            // Load missions
            yield return StartCoroutine(LoadMissions());
            
            // Update UI
            UpdateUI();
        }
        catch (Exception e)
        {
            Debug.LogError($"Error loading game data: {e.Message}");
            ShowErrorMessage("Failed to load game data. Please try again.");
        }
    }
    
    private IEnumerator LoadCharacters()
    {
        try
        {
            // In a real implementation, this would load from the backend
            // For now, we'll create some sample characters
            availableCharacters = new List<CharacterData>
            {
                new CharacterData { id = "char1", name = "John Smith", role = "Scout", health = 80, morale = 70, energy = 90, skills = new List<string> { "navigation", "stealth" } },
                new CharacterData { id = "char2", name = "Sarah Johnson", role = "Doctor", health = 90, morale = 60, energy = 80, skills = new List<string> { "medicine", "empathy" } },
                new CharacterData { id = "char3", name = "Michael Brown", role = "Guard", health = 95, morale = 75, energy = 85, skills = new List<string> { "combat", "leadership" } },
                new CharacterData { id = "char4", name = "Emily Davis", role = "Trader", health = 75, morale = 80, energy = 70, skills = new List<string> { "persuasion", "knowledge" } }
            };
            
            // Create character UI elements
            charactersScroll.Clear();
            foreach (var character in availableCharacters)
            {
                var characterElement = CreateCharacterElement(character);
                charactersScroll.Add(characterElement);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error loading characters: {e.Message}");
            throw;
        }
        
        yield return null;
    }
    
    private VisualElement CreateCharacterElement(CharacterData character)
    {
        var characterElement = characterStatusTemplate.Instantiate();
        
        // Set character data
        var nameLabel = characterElement.Q<Label>("character-name");
        var roleLabel = characterElement.Q<Label>("character-role");
        var healthBar = characterElement.Q<ProgressBar>("health-bar");
        var moraleBar = characterElement.Q<ProgressBar>("morale-bar");
        var energyBar = characterElement.Q<ProgressBar>("energy-bar");
        var skillsList = characterElement.Q<VisualElement>("skills-list");
        
        nameLabel.text = character.name;
        roleLabel.text = character.role;
        healthBar.value = character.health;
        moraleBar.value = character.morale;
        energyBar.value = character.energy;
        
        // Add skills
        skillsList.Clear();
        foreach (var skill in character.skills)
        {
            var skillTag = new Label(skill);
            skillTag.AddToClassList("skill-tag");
            skillsList.Add(skillTag);
        }
        
        // Add drag functionality
        characterElement.AddToClassList("draggable");
        characterElement.RegisterCallback<MouseDownEvent>(evt => OnCharacterMouseDown(evt, character));
        
        return characterElement;
    }
    
    private void OnCharacterMouseDown(MouseDownEvent evt, CharacterData character)
    {
        if (evt.button == 0) // Left mouse button
        {
            // Start drag operation
            var dragData = new DragData { characterId = character.id };
            DragAndDrop.SetGenericData("CharacterData", JsonConvert.SerializeObject(dragData));
            
            // Visual feedback
            evt.target.AddToClassList("dragging");
        }
    }
    
    private IEnumerator LoadMissions()
    {
        try
        {
            // In a real implementation, this would load from the backend
            // For now, we'll create some sample missions
            availableMissions = new List<MissionData>
            {
                new MissionData { id = "mission1", type = "Scout", description = "Scout the surrounding area for potential threats", difficulty = "Medium", requiredSkills = new List<string> { "navigation", "stealth" }, resources = 100, experience = 50, reputation = 10 },
                new MissionData { id = "mission2", type = "Gather", description = "Gather resources from the surrounding area", difficulty = "Easy", requiredSkills = new List<string> { "foraging", "strength" }, resources = 150, experience = 30, reputation = 5 },
                new MissionData { id = "mission3", type = "Defend", description = "Defend the fort from potential threats", difficulty = "Hard", requiredSkills = new List<string> { "combat", "leadership" }, resources = 200, experience = 100, reputation = 20 },
                new MissionData { id = "mission4", type = "Negotiate", description = "Negotiate with local inhabitants for resources", difficulty = "Medium", requiredSkills = new List<string> { "persuasion", "knowledge" }, resources = 120, experience = 60, reputation = 15 }
            };
            
            // Create mission UI elements
            missionsScroll.Clear();
            foreach (var mission in availableMissions)
            {
                var missionElement = CreateMissionElement(mission);
                missionsScroll.Add(missionElement);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Error loading missions: {e.Message}");
            throw;
        }
        
        yield return null;
    }
    
    private VisualElement CreateMissionElement(MissionData mission)
    {
        var missionElement = missionCardTemplate.Instantiate();
        
        // Set mission data
        var titleLabel = missionElement.Q<Label>("mission-title");
        var descriptionLabel = missionElement.Q<Label>("mission-description");
        var difficultyLabel = missionElement.Q<Label>("mission-difficulty");
        var skillsLabel = missionElement.Q<Label>("mission-skills");
        var characterDropdown = missionElement.Q<DropdownField>("character-dropdown");
        
        titleLabel.text = mission.type;
        descriptionLabel.text = mission.description;
        difficultyLabel.text = $"Difficulty: {mission.difficulty}";
        skillsLabel.text = $"Required Skills: {string.Join(", ", mission.requiredSkills)}";
        
        // Set up character dropdown
        characterDropdown.choices = new List<string> { "Select Character" };
        characterDropdown.choices.AddRange(availableCharacters.Select(c => c.name));
        characterDropdown.value = "Select Character";
        
        // Add event handler for dropdown change
        characterDropdown.RegisterValueChangedCallback(evt => OnCharacterAssigned(mission, evt.newValue));
        
        // Add event handler for mission selection
        missionElement.RegisterCallback<ClickEvent>(evt => OnMissionSelected(mission));
        
        // Add drop functionality
        missionElement.AddToClassList("droppable");
        missionElement.RegisterCallback<DragEnterEvent>(evt => OnDragEnter(evt, missionElement));
        missionElement.RegisterCallback<DragLeaveEvent>(evt => OnDragLeave(evt, missionElement));
        missionElement.RegisterCallback<DragDropEvent>(evt => OnDragDrop(evt, mission));
        
        return missionElement;
    }
    
    private void OnCharacterAssigned(MissionData mission, string characterName)
    {
        if (characterName == "Select Character")
        {
            // Remove assignment
            if (missionAssignments.ContainsKey(mission.id))
            {
                missionAssignments.Remove(mission.id);
            }
        }
        else
        {
            // Find character by name
            var character = availableCharacters.FirstOrDefault(c => c.name == characterName);
            if (character != null)
            {
                // Check if character is already assigned
                if (missionAssignments.Values.Contains(character.id))
                {
                    // Show error message
                    ShowErrorMessage($"{character.name} is already assigned to another mission.");
                    return;
                }
                
                // Assign character to mission
                missionAssignments[mission.id] = character.id;
            }
        }
        
        // Update UI
        UpdateUI();
    }
    
    private void OnMissionSelected(MissionData mission)
    {
        selectedMission = mission;
        
        // Update mission details panel
        missionDetailsContent.Clear();
        
        var rewardsElement = missionRewardsTemplate.Instantiate();
        
        // Set rewards data
        var resourcesValue = rewardsElement.Q<Label>("resources-value");
        var experienceValue = rewardsElement.Q<Label>("experience-value");
        var reputationValue = rewardsElement.Q<Label>("reputation-value");
        var chanceBar = rewardsElement.Q<ProgressBar>("chance-bar");
        var chanceValue = rewardsElement.Q<Label>("chance-value");
        var riskIndicator = rewardsElement.Q<VisualElement>("risk-indicator");
        
        resourcesValue.text = $"+{mission.resources}";
        experienceValue.text = $"+{mission.experience}";
        reputationValue.text = $"+{mission.reputation}";
        
        // Calculate success chance based on assigned character
        float successChance = 50f; // Default chance
        if (missionAssignments.ContainsKey(mission.id))
        {
            var characterId = missionAssignments[mission.id];
            var character = availableCharacters.FirstOrDefault(c => c.id == characterId);
            if (character != null)
            {
                // Calculate based on matching skills
                int matchingSkills = character.skills.Count(s => mission.requiredSkills.Contains(s));
                successChance = 50f + (matchingSkills * 25f);
            }
        }
        
        chanceBar.value = successChance;
        chanceValue.text = $"{successChance:F0}%";
        
        // Set risk level
        riskIndicator.RemoveFromClassList("low");
        riskIndicator.RemoveFromClassList("medium");
        riskIndicator.RemoveFromClassList("high");
        
        if (mission.difficulty == "Easy")
        {
            riskIndicator.AddToClassList("low");
        }
        else if (mission.difficulty == "Medium")
        {
            riskIndicator.AddToClassList("medium");
        }
        else if (mission.difficulty == "Hard")
        {
            riskIndicator.AddToClassList("high");
        }
        
        missionDetailsContent.Add(rewardsElement);
    }
    
    private void OnDragEnter(DragEnterEvent evt, VisualElement element)
    {
        element.AddToClassList("drag-over");
    }
    
    private void OnDragLeave(DragLeaveEvent evt, VisualElement element)
    {
        element.RemoveFromClassList("drag-over");
    }
    
    private void OnDragDrop(DragDropEvent evt, MissionData mission)
    {
        evt.target.RemoveFromClassList("drag-over");
        
        // Get drag data
        var dragDataJson = DragAndDrop.GetGenericData("CharacterData") as string;
        if (string.IsNullOrEmpty(dragDataJson))
        {
            return;
        }
        
        var dragData = JsonConvert.DeserializeObject<DragData>(dragDataJson);
        
        // Find character
        var character = availableCharacters.FirstOrDefault(c => c.id == dragData.characterId);
        if (character == null)
        {
            return;
        }
        
        // Check if character is already assigned
        if (missionAssignments.Values.Contains(character.id))
        {
            // Show error message
            ShowErrorMessage($"{character.name} is already assigned to another mission.");
            return;
        }
        
        // Assign character to mission
        missionAssignments[mission.id] = character.id;
        
        // Update dropdown
        var missionElement = evt.target as VisualElement;
        var dropdown = missionElement.Q<DropdownField>("character-dropdown");
        dropdown.value = character.name;
        
        // Update UI
        UpdateUI();
    }
    
    private void OnBeginMissionsClicked()
    {
        // Check if all missions are assigned
        if (missionAssignments.Count < availableMissions.Count)
        {
            ShowErrorMessage("Please assign a character to all missions before beginning.");
            return;
        }
        
        // Submit assignments
        StartCoroutine(SubmitAssignments());
    }
    
    private IEnumerator SubmitAssignments()
    {
        try
        {
            // Show loading state
            beginMissionsButton.SetEnabled(false);
            beginMissionsButton.text = "Processing...";
            
            // Prepare assignments
            var assignments = missionAssignments.Select(kvp => new
            {
                mission_id = kvp.Key,
                character_id = kvp.Value
            }).ToList();
            
            // Prepare request data
            var requestData = new
            {
                game_state = new
                {
                    day = currentDay,
                    money = money,
                    rash_percentage = rashPercentage,
                    morale = morale,
                    suspicion = suspicion
                },
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
            ShowErrorMessage("Failed to submit assignments. Please try again.");
            
            // Reset button state
            beginMissionsButton.SetEnabled(true);
            beginMissionsButton.text = "Begin Missions";
        }
    }
    
    private void ProcessDayResults(DayResults results)
    {
        // Update game state
        money += results.resource_changes.money;
        rashPercentage += results.resource_changes.rash;
        morale += results.resource_changes.morale;
        suspicion += results.resource_changes.suspicion;
        
        // Clamp values
        rashPercentage = Mathf.Clamp(rashPercentage, 0, 100);
        morale = Mathf.Clamp(morale, 0, 100);
        suspicion = Mathf.Clamp(suspicion, 0, 100);
        
        // Update mission results
        missionResults.Clear();
        foreach (var result in results.mission_results)
        {
            var mission = availableMissions.FirstOrDefault(m => m.id == result.mission_id);
            var character = availableCharacters.FirstOrDefault(c => c.id == result.character_id);
            
            if (mission != null && character != null)
            {
                var resultElement = new VisualElement();
                resultElement.AddToClassList("mission-result");
                
                var titleLabel = new Label($"{mission.type} - {character.name}");
                titleLabel.AddToClassList("result-title");
                resultElement.Add(titleLabel);
                
                var outcomeLabel = new Label($"Outcome: {result.outcome}");
                outcomeLabel.AddToClassList($"outcome-{result.outcome.ToLower()}");
                resultElement.Add(outcomeLabel);
                
                var descriptionLabel = new Label(result.description);
                descriptionLabel.AddToClassList("result-description");
                resultElement.Add(descriptionLabel);
                
                missionResults.Add(resultElement);
            }
        }
        
        // Update resource changes
        resourceChangesList.Clear();
        
        var moneyChange = new Label($"Money: {(results.resource_changes.money >= 0 ? "+" : "")}{results.resource_changes.money}");
        moneyChange.AddToClassList("resource-change");
        resourceChangesList.Add(moneyChange);
        
        var rashChange = new Label($"Rash: {(results.resource_changes.rash >= 0 ? "+" : "")}{results.resource_changes.rash}%");
        rashChange.AddToClassList("resource-change");
        resourceChangesList.Add(rashChange);
        
        var moraleChange = new Label($"Morale: {(results.resource_changes.morale >= 0 ? "+" : "")}{results.resource_changes.morale}");
        moraleChange.AddToClassList("resource-change");
        resourceChangesList.Add(moraleChange);
        
        var suspicionChange = new Label($"Suspicion: {(results.resource_changes.suspicion >= 0 ? "+" : "")}{results.resource_changes.suspicion}");
        suspicionChange.AddToClassList("resource-change");
        resourceChangesList.Add(suspicionChange);
        
        // Process emotional reactions and relationship changes
        ProcessEmotionalReactions(results);
        
        // Update continue button text
        if (currentDay >= maxDays)
        {
            continueButton.text = "Return to Travel";
        }
        else
        {
            continueButton.text = "Continue to Next Day";
        }
        
        // Show summary overlay
        daySummaryOverlay.style.display = DisplayStyle.Flex;
    }
    
    private void ProcessEmotionalReactions(DayResults results)
    {
        // Process each mission result
        foreach (var result in results.mission_results)
        {
            var mission = availableMissions.FirstOrDefault(m => m.id == result.mission_id);
            var character = availableCharacters.FirstOrDefault(c => c.id == result.character_id);
            
            if (mission != null && character != null)
            {
                // Calculate emotional changes based on mission outcome
                var emotionalChanges = CalculateEmotionalChanges(mission, result);
                
                // Create memory entry
                var memoryEntry = new MemoryEntry
                {
                    day = currentDay,
                    missionId = mission.id,
                    missionType = mission.type,
                    outcome = result.outcome,
                    trustChange = emotionalChanges.trustChange,
                    loyaltyChange = emotionalChanges.loyaltyChange,
                    stressChange = emotionalChanges.stressChange,
                    rashExposure = results.resource_changes.rash,
                    description = result.description
                };
                
                // Update companion memory
                var companionMemory = companionMemories[character.id];
                companionMemory.AddMemoryEntry(memoryEntry);
                
                // Update relationships with other companions
                UpdateRelationships(character.id, mission, result, emotionalChanges);
            }
        }
    }
    
    private (int trustChange, int loyaltyChange, int stressChange) CalculateEmotionalChanges(MissionData mission, MissionResult result)
    {
        int trustChange = 0;
        int loyaltyChange = 0;
        int stressChange = 0;
        
        // Base changes based on mission outcome
        switch (result.outcome.ToLower())
        {
            case "success":
                trustChange = 10;
                loyaltyChange = 15;
                stressChange = -5;
                break;
            case "partial":
                trustChange = 0;
                loyaltyChange = 5;
                stressChange = 5;
                break;
            case "failure":
                trustChange = -15;
                loyaltyChange = -10;
                stressChange = 20;
                break;
        }
        
        // Adjust based on mission difficulty
        switch (mission.difficulty.ToLower())
        {
            case "easy":
                trustChange = (int)(trustChange * 0.5f);
                loyaltyChange = (int)(loyaltyChange * 0.5f);
                stressChange = (int)(stressChange * 0.5f);
                break;
            case "hard":
                trustChange = (int)(trustChange * 1.5f);
                loyaltyChange = (int)(loyaltyChange * 1.5f);
                stressChange = (int)(stressChange * 1.5f);
                break;
        }
        
        return (trustChange, loyaltyChange, stressChange);
    }
    
    private void UpdateRelationships(string characterId, MissionData mission, MissionResult result, (int trustChange, int loyaltyChange, int stressChange) emotionalChanges)
    {
        var companionMemory = companionMemories[characterId];
        
        // Find other companions on the same mission
        var otherCompanions = missionAssignments
            .Where(kvp => kvp.Key == mission.id && kvp.Value != characterId)
            .Select(kvp => kvp.Value);
        
        foreach (var otherId in otherCompanions)
        {
            int relationshipChange = 0;
            
            // Calculate relationship change based on mission outcome and emotional changes
            switch (result.outcome.ToLower())
            {
                case "success":
                    relationshipChange = 10;
                    break;
                case "partial":
                    relationshipChange = 0;
                    break;
                case "failure":
                    relationshipChange = -15;
                    break;
            }
            
            // Adjust based on stress levels
            if (emotionalChanges.stressChange > 10)
            {
                relationshipChange -= 5; // High stress can strain relationships
            }
            
            // Update relationship scores for both companions
            companionMemory.UpdateRelationship(otherId, relationshipChange);
            companionMemories[otherId].UpdateRelationship(characterId, relationshipChange);
        }
    }
    
    private void OnContinueClicked()
    {
        if (currentDay >= maxDays)
        {
            // Return to travel
            // In a real implementation, this would transition to the travel scene
            Debug.Log("Returning to travel");
        }
        else
        {
            // Move to next day
            currentDay++;
            
            // Clear assignments
            missionAssignments.Clear();
            
            // Hide summary overlay
            daySummaryOverlay.style.display = DisplayStyle.None;
            
            // Load new missions
            StartCoroutine(LoadMissions());
            
            // Update UI
            UpdateUI();
        }
    }
    
    private void ShowErrorMessage(string message)
    {
        // Create error panel
        var errorPanel = new VisualElement();
        errorPanel.AddToClassList("error-panel");
        
        var errorContainer = new VisualElement();
        errorContainer.AddToClassList("error-container");
        
        var errorLabel = new Label(message);
        errorLabel.AddToClassList("error-message");
        errorContainer.Add(errorLabel);
        
        var closeButton = new Button(() => { root.Remove(errorPanel); });
        closeButton.text = "Close";
        closeButton.AddToClassList("error-close-button");
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
    
    private void InitializeCompanionMemories()
    {
        // Sample companion data
        var companions = new Dictionary<string, (string name, string role, string bio, List<string> traits)>
        {
            { "char1", ("John Smith", "Scout", "A skilled tracker with a mysterious past.", new List<string> { "Observant", "Cautious", "Loyal" }) },
            { "char2", ("Sarah Johnson", "Doctor", "A compassionate healer with a strong sense of duty.", new List<string> { "Empathetic", "Dedicated", "Analytical" }) },
            { "char3", ("Michael Brown", "Guard", "A former soldier with a strict code of honor.", new List<string> { "Disciplined", "Brave", "Stubborn" }) },
            { "char4", ("Emily Davis", "Trader", "A charismatic negotiator with a sharp mind.", new List<string> { "Persuasive", "Ambitious", "Adaptable" }) }
        };
        
        foreach (var companion in companions)
        {
            companionMemories[companion.Key] = new CompanionMemory(
                companion.Key,
                companion.Value.name,
                companion.Value.role,
                companion.Value.bio,
                companion.Value.traits
            );
        }
    }
    
    private void ShowCompanionSheet(string characterId)
    {
        var companionMemory = companionMemories[characterId];
        var companionSheet = companionSheetTemplate.Instantiate();
        
        // Set companion data
        var nameLabel = companionSheet.Q<Label>("companion-name");
        var roleLabel = companionSheet.Q<Label>("companion-role");
        var bioLabel = companionSheet.Q<Label>("companion-bio");
        var traitsList = companionSheet.Q<VisualElement>("traits-list");
        
        nameLabel.text = companionMemory.companionName;
        roleLabel.text = companionMemory.emotionalState.role;
        bioLabel.text = companionMemory.emotionalState.bio;
        
        // Add traits
        traitsList.Clear();
        foreach (var trait in companionMemory.emotionalState.traits)
        {
            var traitTag = new Label(trait);
            traitTag.AddToClassList("trait-tag");
            traitsList.Add(traitTag);
        }
        
        // Set emotional state
        var trustBar = companionSheet.Q<ProgressBar>("trust-bar");
        var loyaltyBar = companionSheet.Q<ProgressBar>("loyalty-bar");
        var stressBar = companionSheet.Q<ProgressBar>("stress-bar");
        var moraleBar = companionSheet.Q<ProgressBar>("morale-bar");
        var rashBar = companionSheet.Q<ProgressBar>("rash-bar");
        
        var trustValue = companionSheet.Q<Label>("trust-value");
        var loyaltyValue = companionSheet.Q<Label>("loyalty-value");
        var stressValue = companionSheet.Q<Label>("stress-value");
        var moraleValue = companionSheet.Q<Label>("morale-value");
        var rashValue = companionSheet.Q<Label>("rash-value");
        
        trustBar.value = companionMemory.emotionalState.trust;
        loyaltyBar.value = companionMemory.emotionalState.loyalty;
        stressBar.value = companionMemory.emotionalState.stress;
        moraleBar.value = companionMemory.emotionalState.morale;
        rashBar.value = companionMemory.emotionalState.rashImmunity;
        
        trustValue.text = companionMemory.emotionalState.trust.ToString();
        loyaltyValue.text = companionMemory.emotionalState.loyalty.ToString();
        stressValue.text = companionMemory.emotionalState.stress.ToString();
        moraleValue.text = companionMemory.emotionalState.morale.ToString();
        rashValue.text = companionMemory.emotionalState.rashImmunity.ToString();
        
        // Set emotional state description
        var emotionalStateDescription = companionSheet.Q<Label>("emotional-state-description");
        emotionalStateDescription.text = companionMemory.GetEmotionalStateDescription();
        
        // Add relationships
        var relationshipsList = companionSheet.Q<VisualElement>("relationships-list");
        relationshipsList.Clear();
        
        foreach (var relationship in companionMemory.relationshipScores)
        {
            var otherCompanion = companionMemories[relationship.Key];
            var relationshipItem = new VisualElement();
            relationshipItem.AddToClassList("relationship-item");
            
            var relationshipName = new Label($"{otherCompanion.companionName} - {companionMemory.GetRelationshipDescription(relationship.Key)}");
            relationshipName.AddToClassList("relationship-name");
            
            var relationshipScore = new Label(relationship.Value.ToString());
            relationshipScore.AddToClassList("relationship-score");
            
            relationshipItem.Add(relationshipName);
            relationshipItem.Add(relationshipScore);
            relationshipsList.Add(relationshipItem);
        }
        
        // Add memory log
        var memoryLog = companionSheet.Q<ScrollView>("memory-log");
        memoryLog.Clear();
        
        foreach (var memory in companionMemory.memoryLog.OrderByDescending(m => m.timestamp))
        {
            var memoryEntry = new VisualElement();
            memoryEntry.AddToClassList("memory-entry");
            
            var memoryHeader = new VisualElement();
            memoryHeader.AddToClassList("memory-header");
            
            var memoryTitle = new Label($"Day {memory.day} - {memory.missionType}");
            memoryTitle.AddToClassList("memory-title");
            
            var memoryDate = new Label(memory.timestamp.ToString("MM/dd/yyyy HH:mm"));
            memoryDate.AddToClassList("memory-date");
            
            memoryHeader.Add(memoryTitle);
            memoryHeader.Add(memoryDate);
            
            var memoryDescription = new Label(memory.description);
            memoryDescription.AddToClassList("memory-description");
            
            var memoryChanges = new VisualElement();
            memoryChanges.AddToClassList("memory-changes");
            
            if (memory.trustChange != 0)
            {
                var trustChange = new Label($"Trust: {(memory.trustChange >= 0 ? "+" : "")}{memory.trustChange}");
                trustChange.AddToClassList("change-item");
                trustChange.AddToClassList(memory.trustChange >= 0 ? "change-positive" : "change-negative");
                memoryChanges.Add(trustChange);
            }
            
            if (memory.loyaltyChange != 0)
            {
                var loyaltyChange = new Label($"Loyalty: {(memory.loyaltyChange >= 0 ? "+" : "")}{memory.loyaltyChange}");
                loyaltyChange.AddToClassList("change-item");
                loyaltyChange.AddToClassList(memory.loyaltyChange >= 0 ? "change-positive" : "change-negative");
                memoryChanges.Add(loyaltyChange);
            }
            
            if (memory.stressChange != 0)
            {
                var stressChange = new Label($"Stress: {(memory.stressChange >= 0 ? "+" : "")}{memory.stressChange}");
                stressChange.AddToClassList("change-item");
                stressChange.AddToClassList(memory.stressChange >= 0 ? "change-negative" : "change-positive");
                memoryChanges.Add(stressChange);
            }
            
            if (memory.rashExposure > 0)
            {
                var rashChange = new Label($"Rash Exposure: +{memory.rashExposure}");
                rashChange.AddToClassList("change-item");
                rashChange.AddToClassList("change-negative");
                memoryChanges.Add(rashChange);
            }
            
            memoryEntry.Add(memoryHeader);
            memoryEntry.Add(memoryDescription);
            memoryEntry.Add(memoryChanges);
            
            memoryLog.Add(memoryEntry);
        }
        
        // Add close button handler
        var closeButton = companionSheet.Q<Button>("close-button");
        closeButton.clicked += () => root.Remove(companionSheet);
        
        // Add to UI
        root.Add(companionSheet);
    }
    
    private void ShowDaySummary(DayResults results)
    {
        var daySummary = fortDaySummaryTemplate.Instantiate();
        
        // Set day title
        var dayTitle = daySummary.Q<Label>("day-title");
        dayTitle.text = $"Day {currentDay} Summary";
        
        // Add mission results
        var missionResults = daySummary.Q<ScrollView>("mission-results");
        foreach (var result in results.mission_results)
        {
            var mission = availableMissions.FirstOrDefault(m => m.id == result.mission_id);
            var character = availableCharacters.FirstOrDefault(c => c.id == result.character_id);
            
            if (mission != null && character != null)
            {
                var resultElement = new VisualElement();
                resultElement.AddToClassList("mission-result");
                
                var titleLabel = new Label($"{mission.type} - {character.name}");
                titleLabel.AddToClassList("result-title");
                
                var outcomeLabel = new Label($"Outcome: {result.outcome}");
                outcomeLabel.AddToClassList($"outcome-{result.outcome.ToLower()}");
                
                var descriptionLabel = new Label(result.description);
                descriptionLabel.AddToClassList("result-description");
                
                resultElement.Add(titleLabel);
                resultElement.Add(outcomeLabel);
                resultElement.Add(descriptionLabel);
                
                missionResults.Add(resultElement);
            }
        }
        
        // Add emotional reactions
        var emotionalReactions = daySummary.Q<ScrollView>("emotional-reactions");
        foreach (var result in results.mission_results)
        {
            var character = availableCharacters.FirstOrDefault(c => c.id == result.character_id);
            if (character != null)
            {
                var emotionalChanges = CalculateEmotionalChanges(
                    availableMissions.FirstOrDefault(m => m.id == result.mission_id),
                    result
                );
                
                var reactionElement = new VisualElement();
                reactionElement.AddToClassList("emotional-reaction");
                
                // Determine reaction type
                string reactionType = "neutral";
                if (emotionalChanges.trustChange > 0 || emotionalChanges.loyaltyChange > 0)
                {
                    reactionType = "positive";
                }
                else if (emotionalChanges.trustChange < 0 || emotionalChanges.loyaltyChange < 0 || emotionalChanges.stressChange > 0)
                {
                    reactionType = "negative";
                }
                
                reactionElement.AddToClassList(reactionType);
                
                var reactionHeader = new VisualElement();
                reactionHeader.AddToClassList("reaction-header");
                
                var companionLabel = new Label(character.name);
                companionLabel.AddToClassList("reaction-companion");
                
                var typeLabel = new Label("Emotional Reaction");
                typeLabel.AddToClassList("reaction-type");
                
                reactionHeader.Add(companionLabel);
                reactionHeader.Add(typeLabel);
                
                var descriptionLabel = new Label(GetEmotionalReactionDescription(character.name, emotionalChanges));
                descriptionLabel.AddToClassList("reaction-description");
                
                reactionElement.Add(reactionHeader);
                reactionElement.Add(descriptionLabel);
                
                emotionalReactions.Add(reactionElement);
            }
        }
        
        // Add relationship changes
        var relationshipChanges = daySummary.Q<ScrollView>("relationship-changes");
        var processedPairs = new HashSet<string>();
        
        foreach (var result in results.mission_results)
        {
            var mission = availableMissions.FirstOrDefault(m => m.id == result.mission_id);
            var character = availableCharacters.FirstOrDefault(c => c.id == result.character_id);
            
            if (mission != null && character != null)
            {
                var otherCompanions = missionAssignments
                    .Where(kvp => kvp.Key == mission.id && kvp.Value != character.id)
                    .Select(kvp => kvp.Value);
                
                foreach (var otherId in otherCompanions)
                {
                    var pairKey = $"{Math.Min(character.id, otherId)}_{Math.Max(character.id, otherId)}";
                    if (!processedPairs.Contains(pairKey))
                    {
                        processedPairs.Add(pairKey);
                        
                        var otherCharacter = availableCharacters.FirstOrDefault(c => c.id == otherId);
                        if (otherCharacter != null)
                        {
                            var emotionalChanges = CalculateEmotionalChanges(mission, result);
                            var relationshipChange = GetRelationshipChange(mission, result, emotionalChanges);
                            
                            var changeElement = new VisualElement();
                            changeElement.AddToClassList("relationship-change");
                            
                            // Determine change type
                            string changeType = "neutral";
                            if (relationshipChange > 0)
                            {
                                changeType = "positive";
                            }
                            else if (relationshipChange < 0)
                            {
                                changeType = "negative";
                            }
                            
                            changeElement.AddToClassList(changeType);
                            
                            var pairLabel = new Label($"{character.name} & {otherCharacter.name}");
                            pairLabel.AddToClassList("relationship-pair");
                            
                            var descriptionLabel = new Label(GetRelationshipChangeDescription(character.name, otherCharacter.name, relationshipChange));
                            descriptionLabel.AddToClassList("relationship-description");
                            
                            changeElement.Add(pairLabel);
                            changeElement.Add(descriptionLabel);
                            
                            relationshipChanges.Add(changeElement);
                        }
                    }
                }
            }
        }
        
        // Add resource changes
        var resourceChanges = daySummary.Q<VisualElement>("resource-changes");
        
        var moneyChange = new VisualElement();
        moneyChange.AddToClassList("resource-change");
        
        var moneyLabel = new Label("Money");
        moneyLabel.AddToClassList("resource-label");
        
        var moneyValue = new Label($"{(results.resource_changes.money >= 0 ? "+" : "")}{results.resource_changes.money}");
        moneyValue.AddToClassList("resource-value");
        moneyValue.AddToClassList(results.resource_changes.money >= 0 ? "positive" : "negative");
        
        moneyChange.Add(moneyLabel);
        moneyChange.Add(moneyValue);
        
        var rashChange = new VisualElement();
        rashChange.AddToClassList("resource-change");
        
        var rashLabel = new Label("Rash");
        rashLabel.AddToClassList("resource-label");
        
        var rashValue = new Label($"{(results.resource_changes.rash >= 0 ? "+" : "")}{results.resource_changes.rash}%");
        rashValue.AddToClassList("resource-value");
        rashValue.AddToClassList(results.resource_changes.rash >= 0 ? "negative" : "positive");
        
        rashChange.Add(rashLabel);
        rashChange.Add(rashValue);
        
        var moraleChange = new VisualElement();
        moraleChange.AddToClassList("resource-change");
        
        var moraleLabel = new Label("Morale");
        moraleLabel.AddToClassList("resource-label");
        
        var moraleValue = new Label($"{(results.resource_changes.morale >= 0 ? "+" : "")}{results.resource_changes.morale}");
        moraleValue.AddToClassList("resource-value");
        moraleValue.AddToClassList(results.resource_changes.morale >= 0 ? "positive" : "negative");
        
        moraleChange.Add(moraleLabel);
        moraleChange.Add(moraleValue);
        
        var suspicionChange = new VisualElement();
        suspicionChange.AddToClassList("resource-change");
        
        var suspicionLabel = new Label("Suspicion");
        suspicionLabel.AddToClassList("resource-label");
        
        var suspicionValue = new Label($"{(results.resource_changes.suspicion >= 0 ? "+" : "")}{results.resource_changes.suspicion}");
        suspicionValue.AddToClassList("resource-value");
        suspicionValue.AddToClassList(results.resource_changes.suspicion >= 0 ? "negative" : "positive");
        
        suspicionChange.Add(suspicionLabel);
        suspicionChange.Add(suspicionValue);
        
        resourceChanges.Add(moneyChange);
        resourceChanges.Add(rashChange);
        resourceChanges.Add(moraleChange);
        resourceChanges.Add(suspicionChange);
        
        // Add continue button handler
        var continueButton = daySummary.Q<Button>("continue-button");
        continueButton.clicked += () => OnContinueClicked();
        
        // Add close button handler
        var closeButton = daySummary.Q<Button>("close-button");
        closeButton.clicked += () => root.Remove(daySummary);
        
        // Add to UI
        root.Add(daySummary);
    }
    
    private string GetEmotionalReactionDescription(string characterName, (int trustChange, int loyaltyChange, int stressChange) changes)
    {
        var description = $"{characterName} ";
        
        if (changes.trustChange > 0)
        {
            description += $"gained trust in your leadership (+{changes.trustChange}). ";
        }
        else if (changes.trustChange < 0)
        {
            description += $"lost trust in your leadership ({changes.trustChange}). ";
        }
        
        if (changes.loyaltyChange > 0)
        {
            description += $"became more loyal to the group (+{changes.loyaltyChange}). ";
        }
        else if (changes.loyaltyChange < 0)
        {
            description += $"became less loyal to the group ({changes.loyaltyChange}). ";
        }
        
        if (changes.stressChange > 0)
        {
            description += $"became more stressed (+{changes.stressChange}). ";
        }
        else if (changes.stressChange < 0)
        {
            description += $"became less stressed ({changes.stressChange}). ";
        }
        
        return description;
    }
    
    private int GetRelationshipChange(MissionData mission, MissionResult result, (int trustChange, int loyaltyChange, int stressChange) emotionalChanges)
    {
        int change = 0;
        
        // Base change on mission outcome
        switch (result.outcome.ToLower())
        {
            case "success":
                change = 10;
                break;
            case "partial":
                change = 0;
                break;
            case "failure":
                change = -15;
                break;
        }
        
        // Adjust based on stress levels
        if (emotionalChanges.stressChange > 10)
        {
            change -= 5; // High stress can strain relationships
        }
        
        return change;
    }
    
    private string GetRelationshipChangeDescription(string character1, string character2, int change)
    {
        if (change > 0)
        {
            return $"{character1} and {character2} grew closer after working together.";
        }
        else if (change < 0)
        {
            return $"{character1} and {character2} grew distant after the mission.";
        }
        else
        {
            return $"{character1} and {character2}'s relationship remained unchanged.";
        }
    }
    
    private void ProcessMissionResults(MissionResult result)
    {
        // Check for emotional reactions
        foreach (var companion in result.assignedCompanions)
        {
            var memory = companionMemories[companion.id];
            var emotionalState = memory.currentEmotionalState;
            
            // Calculate emotional changes based on mission outcome
            var trustChange = result.success ? 10 : -15;
            var loyaltyChange = result.success ? 5 : -10;
            var stressChange = result.success ? -5 : 15;
            var moraleChange = result.success ? 10 : -15;
            
            // Update emotional state
            emotionalState.trust = Mathf.Clamp(emotionalState.trust + trustChange, 0, 100);
            emotionalState.loyalty = Mathf.Clamp(emotionalState.loyalty + loyaltyChange, 0, 100);
            emotionalState.stress = Mathf.Clamp(emotionalState.stress + stressChange, 0, 100);
            emotionalState.morale = Mathf.Clamp(emotionalState.morale + moraleChange, 0, 100);
            
            // Add memory entry
            memory.AddMemoryEntry(new MemoryEntry
            {
                missionName = result.missionName,
                outcome = result.success ? "Success" : "Failure",
                emotionalChanges = new Dictionary<string, float>
                {
                    { "Trust", trustChange },
                    { "Loyalty", loyaltyChange },
                    { "Stress", stressChange },
                    { "Morale", moraleChange }
                },
                timestamp = System.DateTime.Now
            });
            
            // Check for emotional reactions that trigger dialogue
            if (emotionalState.stress > 80 || emotionalState.morale < 20)
            {
                ShowEmotionalDialogue(companion, emotionalState);
            }
        }
        
        // Check for relationship changes
        foreach (var companion in result.assignedCompanions)
        {
            foreach (var otherCompanion in result.assignedCompanions)
            {
                if (companion.id != otherCompanion.id)
                {
                    var relationshipChange = result.success ? 5 : -10;
                    companionMemories[companion.id].UpdateRelationship(otherCompanion.id, relationshipChange);
                    
                    // Check for significant relationship changes
                    var relationship = companionMemories[companion.id].relationships[otherCompanion.id];
                    if (relationship > 80 || relationship < 20)
                    {
                        ShowRelationshipDialogue(companion, otherCompanion, relationship);
                    }
                }
            }
        }
    }
    
    private void ShowEmotionalDialogue(Character companion, EmotionalState emotionalState)
    {
        var options = new List<DialogueOption>();
        
        if (emotionalState.stress > 80)
        {
            options.Add(new DialogueOption
            {
                text = "Offer support and understanding",
                consequence = "Reduce stress and increase trust",
                emotionalChanges = new Dictionary<string, float>
                {
                    { "Stress", -20 },
                    { "Trust", 10 }
                }
            });
            
            options.Add(new DialogueOption
            {
                text = "Give them space to process",
                consequence = "Slight stress reduction",
                emotionalChanges = new Dictionary<string, float>
                {
                    { "Stress", -10 }
                }
            });
        }
        
        if (emotionalState.morale < 20)
        {
            options.Add(new DialogueOption
            {
                text = "Share an encouraging story",
                consequence = "Boost morale and strengthen bond",
                emotionalChanges = new Dictionary<string, float>
                {
                    { "Morale", 15 },
                    { "Loyalty", 5 }
                }
            });
            
            options.Add(new DialogueOption
            {
                text = "Remind them of their importance",
                consequence = "Moderate morale boost",
                emotionalChanges = new Dictionary<string, float>
                {
                    { "Morale", 10 }
                }
            });
        }
        
        dialogueController.ShowDialogue(
            $"{companion.name} needs attention",
            $"{companion.name} is showing signs of {emotionalState.stress > 80 ? "high stress" : "low morale"}. How will you respond?",
            options,
            (selectedOption) => HandleDialogueChoice(companion, selectedOption)
        );
    }
    
    private void ShowRelationshipDialogue(Character companion1, Character companion2, float relationship)
    {
        var options = new List<DialogueOption>();
        
        if (relationship > 80)
        {
            options.Add(new DialogueOption
            {
                text = "Encourage their friendship",
                consequence = "Strengthen their bond further",
                relationshipChanges = new List<RelationshipChange>
                {
                    new RelationshipChange { companionId = companion1.id, change = 5 },
                    new RelationshipChange { companionId = companion2.id, change = 5 }
                }
            });
            
            options.Add(new DialogueOption
            {
                text = "Let their friendship develop naturally",
                consequence = "No significant changes",
                relationshipChanges = new List<RelationshipChange>()
            });
        }
        
        if (relationship < 20)
        {
            options.Add(new DialogueOption
            {
                text = "Help them resolve their differences",
                consequence = "Improve their relationship",
                relationshipChanges = new List<RelationshipChange>
                {
                    new RelationshipChange { companionId = companion1.id, change = 10 },
                    new RelationshipChange { companionId = companion2.id, change = 10 }
                }
            });
            
            options.Add(new DialogueOption
            {
                text = "Keep them separated for now",
                consequence = "Maintain current tension",
                relationshipChanges = new List<RelationshipChange>()
            });
        }
        
        dialogueController.ShowDialogue(
            "Companion Relationship",
            $"The relationship between {companion1.name} and {companion2.name} has reached a {relationship > 80 ? "strong" : "tense"} point. What will you do?",
            options,
            (selectedOption) => HandleDialogueChoice(companion1, selectedOption)
        );
    }
    
    private void HandleDialogueChoice(Character companion, DialogueOption option)
    {
        var memory = companionMemories[companion.id];
        var emotionalState = memory.currentEmotionalState;
        
        // Apply emotional changes
        foreach (var change in option.emotionalChanges)
        {
            switch (change.Key)
            {
                case "Trust":
                    emotionalState.trust = Mathf.Clamp(emotionalState.trust + change.Value, 0, 100);
                    break;
                case "Loyalty":
                    emotionalState.loyalty = Mathf.Clamp(emotionalState.loyalty + change.Value, 0, 100);
                    break;
                case "Stress":
                    emotionalState.stress = Mathf.Clamp(emotionalState.stress + change.Value, 0, 100);
                    break;
                case "Morale":
                    emotionalState.morale = Mathf.Clamp(emotionalState.morale + change.Value, 0, 100);
                    break;
            }
        }
        
        // Apply relationship changes
        foreach (var change in option.relationshipChanges)
        {
            memory.UpdateRelationship(change.companionId, change.change);
        }
        
        // Add memory entry for the dialogue interaction
        memory.AddMemoryEntry(new MemoryEntry
        {
            missionName = "Dialogue Interaction",
            outcome = option.consequence,
            emotionalChanges = option.emotionalChanges,
            timestamp = System.DateTime.Now
        });
        
        // Update UI to reflect changes
        UpdateCompanionUI(companion);
    }
}

// Data classes
[System.Serializable]
public class CharacterData
{
    public string id;
    public string name;
    public string role;
    public int health;
    public int morale;
    public int energy;
    public List<string> skills;
}

[System.Serializable]
public class MissionData
{
    public string id;
    public string type;
    public string description;
    public string difficulty;
    public List<string> requiredSkills;
    public int resources;
    public int experience;
    public int reputation;
}

[System.Serializable]
public class DragData
{
    public string characterId;
}

[System.Serializable]
public class MissionResult
{
    public string mission_id;
    public string character_id;
    public string outcome;
    public string description;
}

[System.Serializable]
public class ResourceChanges
{
    public int money;
    public int rash;
    public int morale;
    public int suspicion;
}

[System.Serializable]
public class DayResults
{
    public List<MissionResult> mission_results;
    public ResourceChanges resource_changes;
}

[System.Serializable]
public class FortSimulationResponse
{
    public DayResults result;
} 