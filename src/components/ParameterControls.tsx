import React from "react";
import Draggable from "react-draggable";

interface ParameterControlsProps {
  scrollSpeed: number;
  setScrollSpeed: React.Dispatch<React.SetStateAction<number>>;
  animationFrames: number;
  setAnimationFrames: React.Dispatch<React.SetStateAction<number>>;
  cameraMovementSpeed: number;
  setCameraMovementSpeed: React.Dispatch<React.SetStateAction<number>>;
  cameraRotationSensitivity: number;
  setCameraRotationSensitivity: React.Dispatch<React.SetStateAction<number>>;
  scrollPercentage: number;
  adjustScroll: (direction: number) => void;
  showScrollControls: boolean;
  setShowScrollControls: React.Dispatch<React.SetStateAction<boolean>>;
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  scrollSpeed,
  setScrollSpeed,
  animationFrames,
  setAnimationFrames,
  cameraMovementSpeed,
  setCameraMovementSpeed,
  cameraRotationSensitivity,
  setCameraRotationSensitivity,
  scrollPercentage,
  adjustScroll,
  showScrollControls,
  setShowScrollControls,
}) => {
  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          height: '180px',
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          zIndex: 10,
          cursor: "move",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Adjust Parameters</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Scroll Speed:
            <input
              type="number"
              step="0.01"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
              style={{ width: "60px", marginLeft: "5px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Animation Frames:
            <input
              type="number"
              step="1"
              value={animationFrames}
              onChange={(e) => setAnimationFrames(parseInt(e.target.value, 10))}
              style={{ width: "60px", marginLeft: "5px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Camera Fly Speed:
            <input
              type="number"
              step="0.01"
              value={cameraMovementSpeed}
              onChange={(e) => setCameraMovementSpeed(parseFloat(e.target.value))}
              style={{ width: "60px", marginLeft: "5px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Camera Rotation Sensitivity:
            <input
              type="number"
              step="1"
              value={cameraRotationSensitivity}
              onChange={(e) => setCameraRotationSensitivity(parseFloat(e.target.value))}
              style={{ width: "60px", marginLeft: "5px" }}
            />
          </label>
        </div>
      </div>
    </Draggable>
  );
};

export default ParameterControls;