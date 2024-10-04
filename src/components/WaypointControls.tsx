import React from "react";
import Draggable from "react-draggable";
import * as BABYLON from "@babylonjs/core";

interface WaypointControlsProps {
  waypoints: { x: number; y: number; z: number; rotation: BABYLON.Quaternion }[];
  setWaypoints: React.Dispatch<
    React.SetStateAction<
      { x: number; y: number; z: number; rotation: BABYLON.Quaternion }[]
    >
  >;
}

const WaypointControls: React.FC<WaypointControlsProps> = ({ waypoints, setWaypoints }) => {
  const handleWaypointChange = (
    index: number,
    axis: "x" | "y" | "z",
    value: string
  ) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index][axis] = parseFloat(value);
    setWaypoints(newWaypoints);
  };

  const addWaypoint = () => {
    const newWaypoint = {
      x: 0,
      y: 0,
      z: 0,
      rotation: BABYLON.Quaternion.Identity(),
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          zIndex: 10,
          maxHeight: "50vh",
          overflowY: "auto",
          cursor: "move",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Edit Waypoints</h3>
        {waypoints.map((wp, index) => (
          <div key={index} style={{ marginBottom: "5px" }}>
            <span>Waypoint {index + 1}: </span>
            <label>
              X:
              <input
                type="number"
                step="0.1"
                value={wp.x}
                onChange={(e) => handleWaypointChange(index, "x", e.target.value)}
                style={{ width: "60px", marginLeft: "5px" }}
              />
            </label>
            <label style={{ marginLeft: "10px" }}>
              Y:
              <input
                type="number"
                step="0.1"
                value={wp.y}
                onChange={(e) => handleWaypointChange(index, "y", e.target.value)}
                style={{ width: "60px", marginLeft: "5px" }}
              />
            </label>
            <label style={{ marginLeft: "10px" }}>
              Z:
              <input
                type="number"
                step="0.1"
                value={wp.z}
                onChange={(e) => handleWaypointChange(index, "z", e.target.value)}
                style={{ width: "60px", marginLeft: "5px" }}
              />
            </label>
            {waypoints.length > 1 && (
              <button
                onClick={() => removeWaypoint(index)}
                style={{
                  marginLeft: "10px",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addWaypoint}
          style={{
            marginTop: "10px",
            padding: "5px 10px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Waypoint
        </button>
      </div>
    </Draggable>
  );
};

export default WaypointControls;