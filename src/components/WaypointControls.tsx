import React, { useState } from "react";
import Draggable from "react-draggable";
import * as BABYLON from "@babylonjs/core";
import { Waypoint, Interaction } from "../App";
import InteractionEditor from "./InteractionEditor";

type WaypointControlsProps = {
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
};

const WaypointControls: React.FC<WaypointControlsProps> = ({ waypoints, setWaypoints }) => {
  const [editingWaypointIndex, setEditingWaypointIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const getQuaternionFromRotation = (rotation: any): BABYLON.Quaternion => {
    if (rotation instanceof BABYLON.Quaternion) {
      return rotation;
    } else if (rotation && typeof rotation === 'object' && 'x' in rotation && 'y' in rotation && 'z' in rotation && 'w' in rotation) {
      return new BABYLON.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    } else {
      console.warn('Invalid rotation format, using default Quaternion');
      return BABYLON.Quaternion.Identity();
    }
  };

  const handleWaypointChange = (
    index: number,
    axis: "x" | "y" | "z" | "rotationX" | "rotationY" | "rotationZ",
    value: string
  ) => {
    const newWaypoints = [...waypoints];
    if (axis === "x" || axis === "y" || axis === "z") {
      newWaypoints[index][axis] = parseFloat(value);
    } else {
      const quaternion = getQuaternionFromRotation(newWaypoints[index].rotation);
      const euler = quaternion.toEulerAngles();
      euler[axis.charAt(8).toLowerCase() as 'x' | 'y' | 'z'] = parseFloat(value);
      newWaypoints[index].rotation = BABYLON.Quaternion.FromEulerAngles(euler.x, euler.y, euler.z);
    }
    setWaypoints(newWaypoints);
  };

  const addWaypoint = () => {
    const newWaypoint: Waypoint = {
      x: 0,
      y: 0,
      z: 0,
      rotation: BABYLON.Quaternion.Identity(),
      interactions: [],
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  const updateWaypointInteractions = (interactions: Interaction[]) => {
    if (editingWaypointIndex !== null) {
      const newWaypoints = [...waypoints];
      newWaypoints[editingWaypointIndex].interactions = interactions;
      setWaypoints(newWaypoints);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            bottom: "50px",
            right: "10px",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            width: "320px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            cursor: "move",
            overflow: "hidden",
            transition: "height 0.3s ease",
          }}
        >
          <div
            className="header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              backgroundColor: "rgba(0,0,0,0.8)",
              cursor: "move",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px" }}>Waypoints</h3>
            <button
              onClick={toggleCollapse}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: "1",
              }}
              aria-label={isCollapsed ? "Expand Waypoints" : "Collapse Waypoints"}
            >
              {isCollapsed ? "▼" : "▲"}
            </button>
          </div>

          <div
            className="content"
            style={{
              maxHeight: isCollapsed ? "0px" : "calc(50vh - 50px)",
              opacity: isCollapsed ? 0 : 1,
              padding: isCollapsed ? "0 10px" : "10px",
              transition: "max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease",
              overflowY: "auto",
            }}
          >
            {waypoints.map((wp, index) => (
              <div
                key={index}
                style={{
                  marginTop: "10px",
                  borderBottom: "1px solid #555",
                  paddingBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>Waypoint {index + 1}</span>
                  <div>
                    <button
                      onClick={() => setEditingWaypointIndex(index)}
                      style={{
                        marginRight: "5px",
                        padding: "4px 8px",
                        backgroundColor: "#007BFF",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "3px",
                        fontSize: "12px",
                      }}
                    >
                      Edit Interactions
                    </button>
                    {waypoints.length > 1 && (
                      <button
                        onClick={() => removeWaypoint(index)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "red",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "3px",
                          fontSize: "12px",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: "5px", display: "flex", flexDirection: "column" }}>
                  {["x", "y", "z", "rotationX", "rotationY", "rotationZ"].map((axis) => (
                    <label key={axis} style={{ fontSize: "12px", marginBottom: "5px" }}>
                      {axis.charAt(0).toUpperCase() + axis.slice(1)}:
                      <input
                        type="number"
                        step="0.1"
                        value={axis.startsWith("rotation") 
                          ? getQuaternionFromRotation(wp.rotation).toEulerAngles()[axis.charAt(8).toLowerCase() as 'x' | 'y' | 'z']
                          : wp[axis as "x" | "y" | "z"]}
                        onChange={(e) => handleWaypointChange(index, axis as "x" | "y" | "z" | "rotationX" | "rotationY" | "rotationZ", e.target.value)}
                        style={{
                          width: "70px",
                          marginLeft: "5px",
                          fontSize: "12px",
                          padding: "2px 4px",
                          borderRadius: "3px",
                          border: "none",
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={addWaypoint}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "3px",
                fontSize: "14px",
                width: "100%",
              }}
            >
              Add Waypoint
            </button>
          </div>
        </div>
      </Draggable>

      {editingWaypointIndex !== null && (
        <InteractionEditor
          waypointIndex={editingWaypointIndex}
          interactions={waypoints[editingWaypointIndex].interactions}
          setInteractions={updateWaypointInteractions}
          onClose={() => setEditingWaypointIndex(null)}
        />
      )}
    </>
  );
};

export default WaypointControls;