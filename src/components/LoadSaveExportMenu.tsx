import React from "react";
import Draggable from "react-draggable";
import Cookies from "js-cookie";

// Define cookie keys
const COOKIE_KEYS = {
  scrollSpeed: "scrollSpeed",
  animationFrames: "animationFrames",
  cameraMovementSpeed: "cameraMovementSpeed",
  cameraRotationSensitivity: "cameraRotationSensitivity",
  backgroundColor: "backgroundColor",
  // Add more keys if needed
};

// Define default settings
const DEFAULT_SETTINGS = {
  scrollSpeed: 0.1,
  animationFrames: 120,
  cameraMovementSpeed: 0.2,
  cameraRotationSensitivity: 4000,
  backgroundColor: "#7D7D7D",
};

interface LoadSaveExportMenuProps {
  setLoadedModelUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setIsModelLocal: React.Dispatch<React.SetStateAction<boolean>>;
  customModelUrl: string;
  setCustomModelUrl: React.Dispatch<React.SetStateAction<string>>;
  handleExport: () => void;
  resetSettings: () => void;
}

const LoadSaveExportMenu: React.FC<LoadSaveExportMenuProps> = ({
  setLoadedModelUrl,
  setIsModelLocal,
  customModelUrl,
  setCustomModelUrl,
  handleExport,
  resetSettings,
}) => {
  const baseURL = "https://assets.babylonjs.com/splats/";
  const models = [
    "gs_Sqwakers_trimed.splat",
    "gs_Skull.splat",
    "gs_Plants.splat",
    "gs_Fire_Pit.splat",
  ];

  const loadModel = (url: string) => {
    setLoadedModelUrl(url);
    setIsModelLocal(false);
  };

  const handleClear = () => {
    // Confirm with the user before clearing settings
    const confirmClear = window.confirm("Are you sure you want to clear all settings?");
    if (!confirmClear) return;

    // Remove all relevant cookies
    Object.values(COOKIE_KEYS).forEach((key) => {
      Cookies.remove(key);
    });

    // Reset settings in the app
    resetSettings();

    // Optionally, reload the page to apply default settings immediately
    // window.location.reload();
  };

  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          zIndex: 10,
          cursor: "move",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Load Splats</h3>
        {models.map((splat, index) => (
          <button
            key={index}
            onClick={() => loadModel(baseURL + splat)}
            style={{
              display: "block",
              marginBottom: "5px",
              padding: "5px 10px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {splat}
          </button>
        ))}
        {/* Custom URL Input */}
        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Enter custom splat URL"
            value={customModelUrl}
            onChange={(e) => setCustomModelUrl(e.target.value)}
            style={{
              width: "100%",
              padding: "5px",
              marginBottom: "5px",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => {
              if (customModelUrl) {
                loadModel(customModelUrl);
              } else {
                alert("Please enter a valid URL.");
              }
            }}
            style={{
              width: "100%",
              padding: "5px 10px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Load Custom Splat
          </button>
        </div>
        <hr style={{ border: '1px solid #555', margin: '10px 0' }} />
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={handleExport}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Export Scene
          </button>
        </div>
        {/* Clear Button */}
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={handleClear}
            style={{
              width: "100%",
              padding: "6px 12px",
              backgroundColor: "orange",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "3px",
              fontSize: "14px",
            }}
            title="Clear all settings"
          >
            Clear
          </button>
        </div>
      </div>
    </Draggable>
  );
};

export default LoadSaveExportMenu;