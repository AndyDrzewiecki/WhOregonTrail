using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class NotificationController : MonoBehaviour
{
    [SerializeField] private UIDocument notificationUI;
    [SerializeField] private VisualTreeAsset toastNotificationTemplate;
    [SerializeField] private VisualTreeAsset logbookEntryTemplate;
    [SerializeField] private int maxToastNotifications = 3;
    [SerializeField] private float toastDisplayDuration = 5f;
    
    private VisualElement root;
    private VisualElement toastContainer;
    private ScrollView logbookContainer;
    private Queue<NotificationData> notificationQueue = new Queue<NotificationData>();
    private List<VisualElement> activeToasts = new List<VisualElement>();
    private List<NotificationData> logbookEntries = new List<NotificationData>();
    
    private void OnEnable()
    {
        root = notificationUI.rootVisualElement;
        toastContainer = root.Q<VisualElement>("toast-container");
        logbookContainer = root.Q<ScrollView>("logbook-container");
        
        // Initially hide the logbook
        var logbookPanel = root.Q<VisualElement>("logbook-panel");
        logbookPanel.style.display = DisplayStyle.None;
        
        // Set up logbook toggle button
        var logbookToggle = root.Q<Button>("logbook-toggle");
        logbookToggle.clicked += () => ToggleLogbook(logbookPanel);
    }
    
    public void ShowNotification(NotificationData notification)
    {
        // Add to queue
        notificationQueue.Enqueue(notification);
        
        // Add to logbook if persistent
        if (notification.isPersistent)
        {
            logbookEntries.Add(notification);
            AddLogbookEntry(notification);
        }
        
        // Process queue
        ProcessNotificationQueue();
    }
    
    private void ProcessNotificationQueue()
    {
        // If we have active toasts at max capacity, remove the oldest one
        if (activeToasts.Count >= maxToastNotifications)
        {
            var oldestToast = activeToasts[0];
            activeToasts.RemoveAt(0);
            toastContainer.Remove(oldestToast);
        }
        
        // Show next notification if queue is not empty
        if (notificationQueue.Count > 0)
        {
            var notification = notificationQueue.Dequeue();
            ShowToastNotification(notification);
        }
    }
    
    private void ShowToastNotification(NotificationData notification)
    {
        // Create toast from template
        var toastElement = toastNotificationTemplate.Instantiate();
        
        // Set notification data
        var titleLabel = toastElement.Q<Label>("notification-title");
        var messageLabel = toastElement.Q<Label>("notification-message");
        var iconElement = toastElement.Q<VisualElement>("notification-icon");
        
        titleLabel.text = notification.title;
        messageLabel.text = notification.message;
        
        // Set icon based on category
        SetNotificationIcon(iconElement, notification.category);
        
        // Add appropriate class based on type
        toastElement.AddToClassList($"notification-{notification.type.ToLower()}");
        
        // Add to container and active toasts list
        toastContainer.Add(toastElement);
        activeToasts.Add(toastElement);
        
        // Animate in
        toastElement.AddToClassList("notification-enter");
        
        // Start coroutine to remove after duration
        StartCoroutine(RemoveToastAfterDelay(toastElement, toastDisplayDuration));
    }
    
    private IEnumerator RemoveToastAfterDelay(VisualElement toast, float delay)
    {
        yield return new WaitForSeconds(delay);
        
        // Animate out
        toast.AddToClassList("notification-exit");
        
        // Wait for animation to complete
        yield return new WaitForSeconds(0.5f);
        
        // Remove from container and active toasts list
        toastContainer.Remove(toast);
        activeToasts.Remove(toast);
        
        // Process next notification if any
        ProcessNotificationQueue();
    }
    
    private void AddLogbookEntry(NotificationData notification)
    {
        // Create logbook entry from template
        var entryElement = logbookEntryTemplate.Instantiate();
        
        // Set notification data
        var titleLabel = entryElement.Q<Label>("entry-title");
        var messageLabel = entryElement.Q<Label>("entry-message");
        var dateLabel = entryElement.Q<Label>("entry-date");
        var iconElement = entryElement.Q<VisualElement>("entry-icon");
        
        titleLabel.text = notification.title;
        messageLabel.text = notification.message;
        dateLabel.text = notification.timestamp.ToString("MM/dd/yyyy HH:mm");
        
        // Set icon based on category
        SetNotificationIcon(iconElement, notification.category);
        
        // Add appropriate class based on type
        entryElement.AddToClassList($"entry-{notification.type.ToLower()}");
        
        // Add to container
        logbookContainer.Add(entryElement);
    }
    
    private void SetNotificationIcon(VisualElement iconElement, string category)
    {
        // Clear existing classes
        iconElement.ClearClassList();
        
        // Add appropriate icon class based on category
        switch (category.ToLower())
        {
            case "relationship":
                iconElement.AddToClassList("icon-heart");
                break;
            case "resource":
                iconElement.AddToClassList("icon-resource");
                break;
            case "trait":
                iconElement.AddToClassList("icon-trait");
                break;
            case "event":
                iconElement.AddToClassList("icon-event");
                break;
            default:
                iconElement.AddToClassList("icon-info");
                break;
        }
    }
    
    private void ToggleLogbook(VisualElement logbookPanel)
    {
        if (logbookPanel.style.display == DisplayStyle.None)
        {
            logbookPanel.style.display = DisplayStyle.Flex;
        }
        else
        {
            logbookPanel.style.display = DisplayStyle.None;
        }
    }
    
    public List<NotificationData> GetLogbookEntries()
    {
        return logbookEntries;
    }
} 