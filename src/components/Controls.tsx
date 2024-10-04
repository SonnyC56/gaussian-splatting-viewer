import React, { useState } from "react";
import Draggable from "react-draggable";

  const Controls: React.FC = () => {
  // State to manage the visibility of the controls info section
  const [showControlsInfo, setShowControlsInfo] = useState(true);

    return (
<Draggable handle=".handle">
<div
  className="handle"
  style={{
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "10px",
    borderRadius: "5px",
    color: "white",
    zIndex: 10,
    cursor: "move",
  }}
>
  <button
    onClick={() => setShowControlsInfo(!showControlsInfo)}
    style={{
      backgroundColor: "transparent",
      border: "none",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    {showControlsInfo ? "Hide Controls" : "Show Controls"}
  </button>
  {showControlsInfo && (
    <div style={{ marginTop: "10px" }}>
      <p>
        <strong>Controls:</strong>
      </p>
      <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
        <li>W/A/S/D: Move camera</li>
        <li>Q/E: Up/Down</li>
        <li>Mouse: Look around</li>
        <li>Scroll: Move along path</li>
        <li>Drag and drop a .splat or .ply file to load</li>
        <li>
          Click "Add Waypoint at Current Position" to add waypoint
        </li>
      </ul>
    </div>
  )}
</div>
</Draggable>
    );
  }
    export default Controls;