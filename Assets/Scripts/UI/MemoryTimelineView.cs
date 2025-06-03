using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UIElements;
using System.Text;

public class MemoryTimelineView : MonoBehaviour
{
    [SerializeField] private UIDocument document;
    [SerializeField] private string companionId;
    [SerializeField] private int maxMemoriesToDisplay = 20;
    
    private VisualElement root;
    private ScrollView timelineContainer;
    private Label titleLabel;
    private DropdownField filterDropdown;
    private Toggle showHiddenToggle;
    private CompanionMemory companionMemory;
    
    private void OnEnable()
    {
        if (document == null)
        {
            document = GetComponent<UIDocument>();
        }
        
        root = document.rootVisualElement;
        
        // Get UI elements
        timelineContainer = root.Q<ScrollView>("timeline-container");
        titleLabel = root.Q<Label>("title-label");
        filterDropdown = root.Q<DropdownField>("filter-dropdown");
        showHiddenToggle = root.Q<Toggle>("show-hidden-toggle");
        
        // Initialize filter options
        InitializeFilterOptions();
        
        // Add event handlers
        filterDropdown.RegisterValueChangedCallback(OnFilterChanged);
        showHiddenToggle.RegisterValueChangedCallback(OnShowHiddenChanged);
        
        // Load companion memory
        LoadCompanionMemory();
    }
    
    private void OnDisable()
    {
        // Remove event handlers
        if (filterDropdown != null)
        {
            filterDropdown.UnregisterValueChangedCallback(OnFilterChanged);
        }
        
        if (showHiddenToggle != null)
        {
            showHiddenToggle.UnregisterValueChangedCallback(OnShowHiddenChanged);
        }
    }
    
    private void InitializeFilterOptions()
    {
        List<string> filterOptions = new List<string>
        {
            "All Memories",
            "Significant",
            "Recent",
            "Betrayal",
            "Friendship",
            "Achievement",
            "Loss",
            "Survival",
            "Conflict",
            "Discovery",
            "Sacrifice"
        };
        
        filterDropdown.choices = filterOptions;
        filterDropdown.value = "All Memories";
    }
    
    private void LoadCompanionMemory()
    {
        if (string.IsNullOrEmpty(companionId))
        {
            Debug.LogError("No companion ID specified for memory timeline view");
            return;
        }
        
        companionMemory = CharacterManager.Instance.GetCharacterMemory(companionId);
        
        if (companionMemory == null)
        {
            Debug.LogError($"No memory found for companion {companionId}");
            return;
        }
        
        // Update title
        titleLabel.text = $"Memories of {companionMemory.companionName}";
        
        // Populate timeline
        PopulateTimeline();
    }
    
    private void PopulateTimeline()
    {
        timelineContainer.Clear();
        
        // Get memories based on filter
        List<Memory> memories = GetFilteredMemories();
        
        // Sort by timestamp (newest first)
        memories = memories.OrderByDescending(m => m.timestamp).ToList();
        
        // Limit to max display count
        if (memories.Count > maxMemoriesToDisplay)
        {
            memories = memories.Take(maxMemoriesToDisplay).ToList();
        }
        
        // Create timeline entries
        foreach (var memory in memories)
        {
            var memoryEntry = CreateMemoryEntry(memory);
            timelineContainer.Add(memoryEntry);
        }
        
        // Add empty state if no memories
        if (memories.Count == 0)
        {
            var emptyState = new Label("No memories to display");
            emptyState.AddToClassList("empty-state");
            timelineContainer.Add(emptyState);
        }
    }
    
    private List<Memory> GetFilteredMemories()
    {
        List<Memory> memories = new List<Memory>();
        
        // Add significant memories
        memories.AddRange(companionMemory.significantMemories);
        
        // Add regular memories from memory log
        var memoryEntries = companionMemory.memoryLog
            .Where(m => !m.isHidden || showHiddenToggle.value)
            .Select(m => new Memory
            {
                memoryId = Guid.NewGuid().ToString(),
                title = m.missionType,
                description = m.description,
                timestamp = m.timestamp,
                category = DetermineMemoryCategory(m),
                emotionalImpact = new Dictionary<string, float>
                {
                    { "trust", m.trustChange },
                    { "loyalty", m.loyaltyChange },
                    { "stress", m.stressChange }
                },
                involvedCompanions = new List<string> { companionMemory.companionId },
                location = "Various",
                isSignificant = false
            })
            .ToList();
        
        memories.AddRange(memoryEntries);
        
        // Apply filter
        string filter = filterDropdown.value;
        if (filter != "All Memories")
        {
            if (filter == "Significant")
            {
                memories = memories.Where(m => m.isSignificant).ToList();
            }
            else if (filter == "Recent")
            {
                DateTime cutoff = DateTime.Now.AddDays(-7); // Last 7 days
                memories = memories.Where(m => m.timestamp >= cutoff).ToList();
            }
            else
            {
                // Filter by category
                memories = memories.Where(m => m.category.ToLower() == filter.ToLower()).ToList();
            }
        }
        
        return memories;
    }
    
    private VisualElement CreateMemoryEntry(Memory memory)
    {
        var entry = new VisualElement();
        entry.AddToClassList("memory-entry");
        
        // Add category icon
        var icon = new Label(GetCategoryIcon(memory.category));
        icon.AddToClassList("memory-icon");
        entry.Add(icon);
        
        // Add memory content
        var content = new VisualElement();
        content.AddToClassList("memory-content");
        
        // Title and date
        var header = new VisualElement();
        header.AddToClassList("memory-header");
        
        var title = new Label(memory.title);
        title.AddToClassList("memory-title");
        
        var date = new Label(memory.timestamp.ToString("MMM dd, yyyy"));
        date.AddToClassList("memory-date");
        
        header.Add(title);
        header.Add(date);
        content.Add(header);
        
        // Description
        var description = new Label(memory.description);
        description.AddToClassList("memory-description");
        content.Add(description);
        
        // Emotional impact
        var impact = new VisualElement();
        impact.AddToClassList("memory-impact");
        
        foreach (var emotional in memory.emotionalImpact)
        {
            var impactLabel = new Label($"{emotional.Key}: {(emotional.Value >= 0 ? "+" : "")}{emotional.Value}");
            impactLabel.AddToClassList(emotional.Value >= 0 ? "positive-impact" : "negative-impact");
            impact.Add(impactLabel);
        }
        
        content.Add(impact);
        
        // Add content to entry
        entry.Add(content);
        
        // Add click handler to show details
        entry.RegisterCallback<ClickEvent>(evt => ShowMemoryDetails(memory));
        
        return entry;
    }
    
    private string GetCategoryIcon(string category)
    {
        switch (category.ToLower())
        {
            case "betrayal": return "💔";
            case "friendship": return "🤝";
            case "achievement": return "🎉";
            case "loss": return "😢";
            case "survival": return "🛡️";
            case "conflict": return "⚔️";
            case "discovery": return "🔍";
            case "sacrifice": return "❤️";
            default: return "📝";
        }
    }
    
    private string DetermineMemoryCategory(MemoryEntry entry)
    {
        // Determine category based on emotional changes and mission type
        if (entry.trustChange > 10 || entry.loyaltyChange > 10)
            return "friendship";
        if (entry.trustChange < -10 || entry.loyaltyChange < -10)
            return "betrayal";
        if (entry.stressChange > 15)
            return "survival";
        if (entry.missionType.Contains("success", StringComparison.OrdinalIgnoreCase))
            return "achievement";
        if (entry.missionType.Contains("failure", StringComparison.OrdinalIgnoreCase))
            return "loss";
        return "general";
    }
    
    private void ShowMemoryDetails(Memory memory)
    {
        // Create a popup with memory details
        var popup = new VisualElement();
        popup.AddToClassList("memory-details-popup");
        
        // Title
        var title = new Label(memory.title);
        title.AddToClassList("popup-title");
        popup.Add(title);
        
        // Close button
        var closeButton = new Button(() => popup.RemoveFromHierarchy()) { text = "X" };
        closeButton.AddToClassList("close-button");
        popup.Add(closeButton);
        
        // Date
        var date = new Label($"Date: {memory.timestamp.ToString("MMMM dd, yyyy")}");
        popup.Add(date);
        
        // Category
        var category = new Label($"Category: {memory.category}");
        popup.Add(category);
        
        // Description
        var description = new Label(memory.description);
        description.AddToClassList("popup-description");
        popup.Add(description);
        
        // Involved companions
        var companionsLabel = new Label("Involved Companions:");
        popup.Add(companionsLabel);
        
        var companionsList = new VisualElement();
        companionsList.AddToClassList("companions-list");
        
        foreach (var companionId in memory.involvedCompanions)
        {
            var character = CharacterManager.Instance.GetCharacter(companionId);
            if (character != null)
            {
                var companionLabel = new Label(character.name);
                companionsList.Add(companionLabel);
            }
        }
        
        popup.Add(companionsList);
        
        // Emotional impact
        var impactLabel = new Label("Emotional Impact:");
        popup.Add(impactLabel);
        
        var impactList = new VisualElement();
        impactList.AddToClassList("impact-list");
        
        foreach (var emotional in memory.emotionalImpact)
        {
            var impactItem = new Label($"{emotional.Key}: {(emotional.Value >= 0 ? "+" : "")}{emotional.Value}");
            impactItem.AddToClassList(emotional.Value >= 0 ? "positive-impact" : "negative-impact");
            impactList.Add(impactItem);
        }
        
        popup.Add(impactList);
        
        // Add to UI
        root.Add(popup);
    }
    
    private void OnFilterChanged(ChangeEvent<string> evt)
    {
        PopulateTimeline();
    }
    
    private void OnShowHiddenChanged(ChangeEvent<bool> evt)
    {
        PopulateTimeline();
    }
    
    public void SetCompanionId(string id)
    {
        companionId = id;
        LoadCompanionMemory();
    }
} 