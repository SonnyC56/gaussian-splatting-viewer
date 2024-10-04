import React from "react";
import Draggable from "react-draggable";

interface SplatLoaderProps {
  setLoadedModelUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setIsModelLocal: React.Dispatch<React.SetStateAction<boolean>>;
  customModelUrl: string;
  setCustomModelUrl: React.Dispatch<React.SetStateAction<string>>;
}

const SplatLoader: React.FC<SplatLoaderProps> = ({
  setLoadedModelUrl,
  setIsModelLocal,
  customModelUrl,
  setCustomModelUrl,
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

  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: "absolute",
          top: "10px",
          left: "250px",
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
      </div>
    </Draggable>
  );
};

export default SplatLoader;