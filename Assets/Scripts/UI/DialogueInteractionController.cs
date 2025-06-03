using UnityEngine;
using UnityEngine.UIElements;
using System.Collections.Generic;
using System;

public class DialogueInteractionController : MonoBehaviour
{
    private VisualElement root;
    private VisualElement dialoguePanel;
    private Label dialogueTitle;
    private Label dialogueDescription;
    private VisualElement optionsContainer;
    private Button closeButton;

    private void OnEnable()
    {
        root = GetComponent<UIDocument>().rootVisualElement;
        
        // Get references to UI elements
        dialoguePanel = root.Q<VisualElement>("dialogue-panel");
        dialogueTitle = root.Q<Label>("dialogue-title");
        dialogueDescription = root.Q<Label>("dialogue-description");
        optionsContainer = root.Q<VisualElement>("options-container");
        closeButton = root.Q<Button>("close-button");

        // Set up event handlers
        closeButton.clicked += HideDialogue;
        
        // Initially hide the panel
        HideDialogue();
    }

    private void OnDisable()
    {
        closeButton.clicked -= HideDialogue;
    }

    public void ShowDialogue(string title, string description, List<DialogueOption> options)
    {
        dialogueTitle.text = title;
        dialogueDescription.text = description;
        
        // Clear existing options
        optionsContainer.Clear();
        
        // Add new options
        foreach (var option in options)
        {
            var optionButton = new Button();
            optionButton.AddToClassList("dialogue-option");
            
            var optionText = new Label(option.Text);
            optionText.AddToClassList("dialogue-option-text");
            optionButton.Add(optionText);
            
            if (!string.IsNullOrEmpty(option.Consequence))
            {
                var consequenceText = new Label(option.Consequence);
                consequenceText.AddToClassList("dialogue-option-consequence");
                optionButton.Add(consequenceText);
            }
            
            optionButton.clicked += () => OnOptionSelected(option);
            optionsContainer.Add(optionButton);
        }
        
        // Show the panel with animation
        dialoguePanel.RemoveFromClassList("fade-out");
        dialoguePanel.AddToClassList("visible");
        dialoguePanel.AddToClassList("fade-in");
    }

    private void HideDialogue()
    {
        dialoguePanel.RemoveFromClassList("fade-in");
        dialoguePanel.AddToClassList("fade-out");
        
        // Remove visible class after animation completes
        StartCoroutine(RemoveVisibleClassAfterDelay(0.3f));
    }

    private System.Collections.IEnumerator RemoveVisibleClassAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);
        dialoguePanel.RemoveFromClassList("visible");
    }

    private void OnOptionSelected(DialogueOption option)
    {
        option.OnSelected?.Invoke();
        HideDialogue();
    }
}

[Serializable]
public class DialogueOption
{
    public string Text { get; set; }
    public string Consequence { get; set; }
    public Action OnSelected { get; set; }
} 