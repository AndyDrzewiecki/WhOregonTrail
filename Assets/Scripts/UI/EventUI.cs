using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Linq;

public class EventUI : MonoBehaviour
{
    [Header("Event Panel")]
    public GameObject eventPanel;
    public TextMeshProUGUI eventTitleText;
    public TextMeshProUGUI eventDescriptionText;
    public Image eventImage;
    public AudioSource eventAudioSource;
    public Animator eventAnimator;

    [Header("Choice Buttons")]
    public Transform choiceButtonContainer;
    public GameObject choiceButtonPrefab;
    public int maxVisibleChoices = 4;

    [Header("Animation")]
    public float showAnimationDuration = 0.5f;
    public float hideAnimationDuration = 0.3f;
    public string showAnimationTrigger = "Show";
    public string hideAnimationTrigger = "Hide";

    [Header("Audio")]
    public AudioClip eventShowSound;
    public AudioClip eventHideSound;
    public AudioClip choiceSelectSound;

    private GameEvent currentEvent;
    private List<GameObject> choiceButtons = new List<GameObject>();

    private void Start()
    {
        if (eventPanel != null)
        {
            eventPanel.SetActive(false);
        }
    }

    public void ShowEvent(GameEvent gameEvent)
    {
        currentEvent = gameEvent;
        
        // Update UI elements
        eventTitleText.text = gameEvent.title;
        eventDescriptionText.text = gameEvent.description;
        
        // Load event image if specified
        if (!string.IsNullOrEmpty(gameEvent.eventImage))
        {
            StartCoroutine(LoadEventImage(gameEvent.eventImage));
        }
        
        // Play event sound if specified
        if (!string.IsNullOrEmpty(gameEvent.eventSound))
        {
            StartCoroutine(LoadEventSound(gameEvent.eventSound));
        }
        
        // Create choice buttons
        CreateChoiceButtons();
        
        // Show the panel with animation
        eventPanel.SetActive(true);
        if (eventAnimator != null)
        {
            eventAnimator.SetTrigger(showAnimationTrigger);
        }
        
        // Play show sound
        if (eventAudioSource != null && eventShowSound != null)
        {
            eventAudioSource.PlayOneShot(eventShowSound);
        }
    }

    public void HideEvent(GameEvent gameEvent)
    {
        if (currentEvent != gameEvent)
            return;
            
        // Play hide sound
        if (eventAudioSource != null && eventHideSound != null)
        {
            eventAudioSource.PlayOneShot(eventHideSound);
        }
        
        // Hide with animation
        if (eventAnimator != null)
        {
            eventAnimator.SetTrigger(hideAnimationTrigger);
            StartCoroutine(HidePanelAfterAnimation());
        }
        else
        {
            eventPanel.SetActive(false);
        }
        
        // Clear choice buttons
        ClearChoiceButtons();
        
        currentEvent = null;
    }

    private IEnumerator HidePanelAfterAnimation()
    {
        yield return new WaitForSeconds(hideAnimationDuration);
        eventPanel.SetActive(false);
    }

    private void CreateChoiceButtons()
    {
        ClearChoiceButtons();
        
        // Get available choices
        List<EventChoice> availableChoices = currentEvent.choices
            .Where(c => !c.isHidden || IsChoiceAvailable(c))
            .Take(maxVisibleChoices)
            .ToList();
            
        // Create buttons for each choice
        foreach (EventChoice choice in availableChoices)
        {
            GameObject buttonObj = Instantiate(choiceButtonPrefab, choiceButtonContainer);
            Button button = buttonObj.GetComponent<Button>();
            TextMeshProUGUI buttonText = buttonObj.GetComponentInChildren<TextMeshProUGUI>();
            
            if (buttonText != null)
            {
                buttonText.text = choice.text;
            }
            
            // Add click event
            button.onClick.AddListener(() => OnChoiceSelected(choice));
            
            choiceButtons.Add(buttonObj);
        }
    }

    private void ClearChoiceButtons()
    {
        foreach (GameObject button in choiceButtons)
        {
            Destroy(button);
        }
        
        choiceButtons.Clear();
    }

    private bool IsChoiceAvailable(EventChoice choice)
    {
        if (!choice.isHidden)
            return true;
            
        // TODO: Check if the hidden requirement is met
        // This would involve checking the game state against the hiddenRequirement and hiddenRequirementValue
        return false;
    }

    private void OnChoiceSelected(EventChoice choice)
    {
        // Play selection sound
        if (eventAudioSource != null && choiceSelectSound != null)
        {
            eventAudioSource.PlayOneShot(choiceSelectSound);
        }
        
        // Play choice animation if specified
        if (!string.IsNullOrEmpty(choice.choiceAnimation))
        {
            if (eventAnimator != null)
            {
                eventAnimator.Play(choice.choiceAnimation);
            }
        }
        
        // Notify the event manager
        EventManager.Instance.MakeChoice(currentEvent, choice);
    }

    private IEnumerator LoadEventImage(string imagePath)
    {
        // TODO: Load image from Resources or AssetBundle
        // For now, we'll just log the path
        Debug.Log($"Loading event image: {imagePath}");
        yield return null;
    }

    private IEnumerator LoadEventSound(string soundPath)
    {
        // TODO: Load sound from Resources or AssetBundle
        // For now, we'll just log the path
        Debug.Log($"Loading event sound: {soundPath}");
        yield return null;
    }
} 