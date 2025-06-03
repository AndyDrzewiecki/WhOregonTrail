using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace WhOregonTrail.UI
{
    public enum NotificationType
    {
        Info,
        Success,
        Warning,
        Error,
        Memory,
        Emotional,
        Mission,
        Event
    }
    
    [System.Serializable]
    public class Notification
    {
        public string id;
        public string title;
        public string message;
        public NotificationType type;
        public float duration;
        public bool isPersistent;
        public Action onClickAction;
        public DateTime timestamp;
        
        public Notification()
        {
            id = Guid.NewGuid().ToString();
            duration = 5.0f;
            isPersistent = false;
            timestamp = DateTime.Now;
        }
    }
    
    public class NotificationManager : MonoBehaviour
    {
        [SerializeField] private UIDocument notificationDocument;
        [SerializeField] private VisualTreeAsset notificationTemplate;
        [SerializeField] private int maxNotifications = 5;
        [SerializeField] private float notificationSpacing = 10f;
        
        private VisualElement root;
        private VisualElement notificationContainer;
        private Queue<Notification> notificationQueue;
        private List<VisualElement> activeNotifications;
        private Dictionary<string, VisualElement> notificationElements;
        
        private void Awake()
        {
            notificationQueue = new Queue<Notification>();
            activeNotifications = new List<VisualElement>();
            notificationElements = new Dictionary<string, VisualElement>();
        }
        
        private void OnEnable()
        {
            if (notificationDocument == null)
            {
                notificationDocument = GetComponent<UIDocument>();
            }
            
            root = notificationDocument.rootVisualElement;
            notificationContainer = root.Q<VisualElement>("notification-container");
            
            if (notificationContainer == null)
            {
                Debug.LogError("Notification container not found in UXML!");
                return;
            }
            
            // Set up notification container
            notificationContainer.style.position = Position.Absolute;
            notificationContainer.style.top = 20;
            notificationContainer.style.right = 20;
            notificationContainer.style.width = 300;
            notificationContainer.style.alignItems = Align.FlexEnd;
        }
        
        private void Update()
        {
            // Process queued notifications
            while (notificationQueue.Count > 0 && activeNotifications.Count < maxNotifications)
            {
                ShowNotification(notificationQueue.Dequeue());
            }
            
            // Update notification positions
            UpdateNotificationPositions();
        }
        
        public void ShowNotification(string title, string message, NotificationType type = NotificationType.Info, float duration = 5.0f, bool isPersistent = false, Action onClickAction = null)
        {
            var notification = new Notification
            {
                title = title,
                message = message,
                type = type,
                duration = duration,
                isPersistent = isPersistent,
                onClickAction = onClickAction
            };
            
            if (activeNotifications.Count >= maxNotifications)
            {
                notificationQueue.Enqueue(notification);
            }
            else
            {
                ShowNotification(notification);
            }
        }
        
        private void ShowNotification(Notification notification)
        {
            if (notificationTemplate == null)
            {
                Debug.LogError("Notification template not assigned!");
                return;
            }
            
            // Create notification element from template
            VisualElement notificationElement = notificationTemplate.Instantiate();
            
            // Set notification content
            Label titleLabel = notificationElement.Q<Label>("notification-title");
            Label messageLabel = notificationElement.Q<Label>("notification-message");
            VisualElement iconElement = notificationElement.Q<VisualElement>("notification-icon");
            
            if (titleLabel != null) titleLabel.text = notification.title;
            if (messageLabel != null) messageLabel.text = notification.message;
            
            // Set notification style based on type
            string typeClass = GetNotificationTypeClass(notification.type);
            notificationElement.AddToClassList(typeClass);
            
            // Set icon based on type
            if (iconElement != null)
            {
                iconElement.AddToClassList($"icon-{notification.type.ToString().ToLower()}");
            }
            
            // Add click handler if provided
            if (notification.onClickAction != null)
            {
                notificationElement.RegisterCallback<ClickEvent>(evt => notification.onClickAction.Invoke());
                notificationElement.style.cursor = CursorStyle.Pointer;
            }
            
            // Add to container
            notificationContainer.Add(notificationElement);
            activeNotifications.Add(notificationElement);
            notificationElements[notification.id] = notificationElement;
            
            // Set up auto-dismiss if not persistent
            if (!notification.isPersistent)
            {
                StartCoroutine(DismissNotificationAfterDelay(notification));
            }
        }
        
        private System.Collections.IEnumerator DismissNotificationAfterDelay(Notification notification)
        {
            yield return new WaitForSeconds(notification.duration);
            
            DismissNotification(notification.id);
        }
        
        public void DismissNotification(string notificationId)
        {
            if (notificationElements.TryGetValue(notificationId, out VisualElement element))
            {
                // Fade out animation
                element.style.transition = new StyleTransition(new List<TimeValue> { new TimeValue(0.3f, TimeUnit.Second) }, new List<StylePropertyName> { new StylePropertyName("opacity") });
                element.style.opacity = 0;
                
                // Remove after animation
                element.RegisterCallback<TransitionEndEvent>(evt =>
                {
                    if (evt.stylePropertyNames.Contains(new StylePropertyName("opacity")))
                    {
                        notificationContainer.Remove(element);
                        activeNotifications.Remove(element);
                        notificationElements.Remove(notificationId);
                    }
                });
            }
        }
        
        public void DismissAllNotifications()
        {
            foreach (var notificationId in new List<string>(notificationElements.Keys))
            {
                DismissNotification(notificationId);
            }
            
            notificationQueue.Clear();
        }
        
        private void UpdateNotificationPositions()
        {
            float currentY = 0;
            
            foreach (var notification in activeNotifications)
            {
                notification.style.top = currentY;
                currentY += notification.worldBound.height + notificationSpacing;
            }
        }
        
        private string GetNotificationTypeClass(NotificationType type)
        {
            switch (type)
            {
                case NotificationType.Success:
                    return "notification-success";
                case NotificationType.Warning:
                    return "notification-warning";
                case NotificationType.Error:
                    return "notification-error";
                case NotificationType.Memory:
                    return "notification-memory";
                case NotificationType.Emotional:
                    return "notification-emotional";
                case NotificationType.Mission:
                    return "notification-mission";
                case NotificationType.Event:
                    return "notification-event";
                default:
                    return "notification-info";
            }
        }
        
        // Convenience methods for common notification types
        
        public void ShowMemoryNotification(string title, string message, Action onClickAction = null)
        {
            ShowNotification(title, message, NotificationType.Memory, 7.0f, false, onClickAction);
        }
        
        public void ShowEmotionalNotification(string title, string message, Action onClickAction = null)
        {
            ShowNotification(title, message, NotificationType.Emotional, 5.0f, false, onClickAction);
        }
        
        public void ShowMissionNotification(string title, string message, Action onClickAction = null)
        {
            ShowNotification(title, message, NotificationType.Mission, 6.0f, false, onClickAction);
        }
        
        public void ShowEventNotification(string title, string message, Action onClickAction = null)
        {
            ShowNotification(title, message, NotificationType.Event, 5.0f, false, onClickAction);
        }
        
        public void ShowRashNotification(string characterName, Action onClickAction = null)
        {
            ShowNotification(
                "Rash Infection", 
                $"{characterName} has developed a rash infection. This will increase their stress and reduce their effectiveness.", 
                NotificationType.Warning, 
                8.0f, 
                true, 
                onClickAction
            );
        }
        
        public void ShowEmotionalShiftNotification(string characterName, string emotion, float change, Action onClickAction = null)
        {
            string direction = change > 0 ? "increased" : "decreased";
            string color = change > 0 ? "positive" : "negative";
            
            ShowNotification(
                "Emotional Shift", 
                $"{characterName}'s {emotion} has {direction} by {Math.Abs(change)}.", 
                NotificationType.Emotional, 
                5.0f, 
                false, 
                onClickAction
            );
        }
        
        public void ShowMissionFailNotification(string missionName, string reason, Action onClickAction = null)
        {
            ShowNotification(
                "Mission Failed", 
                $"The mission '{missionName}' failed: {reason}", 
                NotificationType.Error, 
                7.0f, 
                true, 
                onClickAction
            );
        }
    }
} 