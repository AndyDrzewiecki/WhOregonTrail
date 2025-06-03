using UnityEngine;
using Cinemachine;

public class CameraController : MonoBehaviour
{
    public static CameraController Instance { get; private set; }

    [Header("Camera Settings")]
    public CinemachineVirtualCamera virtualCamera;
    public float rotationSpeed = 100f;
    public float zoomSpeed = 500f;
    public float minZoom = 10f;
    public float maxZoom = 50f;
    public float smoothSpeed = 5f;

    [Header("View Modes")]
    public bool isTopDown = true;
    public float topDownHeight = 20f;
    public float topDownAngle = 90f;
    public float thirdPersonDistance = 10f;
    public float thirdPersonHeight = 2f;

    private CinemachineTransposer transposer;
    private float currentZoom;
    private Vector3 targetPosition;
    private Quaternion targetRotation;

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
        if (virtualCamera == null)
        {
            virtualCamera = GetComponent<CinemachineVirtualCamera>();
        }

        transposer = virtualCamera.GetCinemachineComponent<CinemachineTransposer>();
        currentZoom = (minZoom + maxZoom) / 2f;
        UpdateCameraPosition();
    }

    private void Update()
    {
        HandleRotation();
        HandleZoom();
        UpdateCameraPosition();
    }

    private void HandleRotation()
    {
        float rotation = Input.GetAxis("Mouse X") * rotationSpeed * Time.deltaTime;
        transform.Rotate(Vector3.up, rotation);
    }

    private void HandleZoom()
    {
        float zoom = Input.GetAxis("Mouse ScrollWheel");
        if (zoom != 0)
        {
            currentZoom = Mathf.Clamp(currentZoom - zoom * zoomSpeed, minZoom, maxZoom);
        }
    }

    private void UpdateCameraPosition()
    {
        if (transposer == null) return;

        if (isTopDown)
        {
            targetPosition = new Vector3(0, topDownHeight, 0);
            targetRotation = Quaternion.Euler(topDownAngle, 0, 0);
        }
        else
        {
            targetPosition = new Vector3(0, thirdPersonHeight, -currentZoom);
            targetRotation = Quaternion.Euler(30f, 0, 0);
        }

        transposer.m_FollowOffset = Vector3.Lerp(transposer.m_FollowOffset, targetPosition, smoothSpeed * Time.deltaTime);
        transform.rotation = Quaternion.Lerp(transform.rotation, targetRotation, smoothSpeed * Time.deltaTime);
    }

    public void SetTarget(Transform target)
    {
        if (virtualCamera != null)
        {
            virtualCamera.Follow = target;
            virtualCamera.LookAt = target;
        }
    }

    public void ToggleViewMode()
    {
        isTopDown = !isTopDown;
    }

    public void SetViewMode(bool topDown)
    {
        isTopDown = topDown;
    }
} 