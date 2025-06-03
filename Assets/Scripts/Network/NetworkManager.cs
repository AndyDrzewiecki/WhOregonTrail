using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System;
using UnityEngine.Networking;
using Newtonsoft.Json;

public class NetworkManager : MonoBehaviour
{
    public static NetworkManager Instance { get; private set; }

    [Header("API Settings")]
    public string baseUrl = "http://localhost:8000";
    public float requestTimeout = 10f;

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

    public IEnumerator GenerateCharacter(Action<Character> onSuccess, Action<string> onError)
    {
        string url = $"{baseUrl}/api/characters/generate";
        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            request.timeout = (int)(requestTimeout * 1000);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                Character character = JsonConvert.DeserializeObject<Character>(request.downloadHandler.text);
                onSuccess?.Invoke(character);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }

    public IEnumerator GenerateEvent(List<Character> characters, Action<GameEvent> onSuccess, Action<string> onError)
    {
        string url = $"{baseUrl}/api/events/generate";
        string jsonData = JsonConvert.SerializeObject(new { characters });
        
        using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData))
        {
            request.SetRequestHeader("Content-Type", "application/json");
            request.timeout = (int)(requestTimeout * 1000);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                GameEvent gameEvent = JsonConvert.DeserializeObject<GameEvent>(request.downloadHandler.text);
                onSuccess?.Invoke(gameEvent);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }

    public IEnumerator GenerateDialog(Character character, string context, Action<string> onSuccess, Action<string> onError)
    {
        string url = $"{baseUrl}/api/dialog/generate";
        string jsonData = JsonConvert.SerializeObject(new { character, context });
        
        using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData))
        {
            request.SetRequestHeader("Content-Type", "application/json");
            request.timeout = (int)(requestTimeout * 1000);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                string dialog = JsonConvert.DeserializeObject<string>(request.downloadHandler.text);
                onSuccess?.Invoke(dialog);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }

    public IEnumerator GenerateRelationshipEvent(Character character1, Character character2, 
        Action<RelationshipEvent> onSuccess, Action<string> onError)
    {
        string url = $"{baseUrl}/api/relationships/generate";
        string jsonData = JsonConvert.SerializeObject(new { character1, character2 });
        
        using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData))
        {
            request.SetRequestHeader("Content-Type", "application/json");
            request.timeout = (int)(requestTimeout * 1000);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                RelationshipEvent relationshipEvent = JsonConvert.DeserializeObject<RelationshipEvent>(request.downloadHandler.text);
                onSuccess?.Invoke(relationshipEvent);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }

    public IEnumerator SaveGameState(GameState gameState, Action onSuccess, Action<string> onError)
    {
        string url = $"{baseUrl}/api/game/save";
        string jsonData = JsonConvert.SerializeObject(gameState);
        
        using (UnityWebRequest request = UnityWebRequest.Post(url, jsonData))
        {
            request.SetRequestHeader("Content-Type", "application/json");
            request.timeout = (int)(requestTimeout * 1000);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                onSuccess?.Invoke();
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }

    public IEnumerator LoadGameState(Action<GameState> onSuccess, Action<string> onError)
    {
        string url = $"{baseUrl}/api/game/load";
        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            request.timeout = (int)(requestTimeout * 1000);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                GameState gameState = JsonConvert.DeserializeObject<GameState>(request.downloadHandler.text);
                onSuccess?.Invoke(gameState);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }
} 