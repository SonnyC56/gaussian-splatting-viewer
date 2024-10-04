// WaypointControls.tsx
import React, { useState } from "react";
import Draggable from "react-draggable";
import * as BABYLON from "@babylonjs/core";
import { Waypoint, Interaction } from "../App";
import InteractionEditor from "./InteractionEditor"; // Ensure the path is correct

// WaypointControls Props
type WaypointControlsProps = {
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
};

const WaypointControls: React.FC<WaypointControlsProps> = ({ waypoints, setWaypoints }) => {
  // State to manage which waypoint's interactions are being edited
  const [editingWaypointIndex, setEditingWaypointIndex] = useState<number | null>(null);
  
  // State to manage collapse
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Handler to update waypoint coordinates
  const handleWaypointChange = (
    index: number,
    axis: "x" | "y" | "z",
    value: string
  ) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index][axis] = parseFloat(value);
    setWaypoints(newWaypoints);
  };

  // Handler to add a new waypoint
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

  // Handler to remove a waypoint
  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  // Handler to update interactions for a waypoint
  const updateWaypointInteractions = (interactions: Interaction[]) => {
    if (editingWaypointIndex !== null) {
      const newWaypoints = [...waypoints];
      newWaypoints[editingWaypointIndex].interactions = interactions;
      setWaypoints(newWaypoints);
    }
  };

  // Toggle collapse
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
            bottom: "10px",
            left: "40%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            width: "320px", // Slightly increased width for better content fit
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            cursor: "move",
            overflow: "hidden",
            transition: "height 0.3s ease",
          }}
        >
          {/* Header */}
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

          {/* Content */}
          <div
            className="content"
            style={{
              maxHeight: isCollapsed ? "0px" : "calc(50vh - 50px)", // Adjust based on header height
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
                <div
                  style={{
                    marginTop: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <label style={{ fontSize: "12px" }}>
                    X:
                    <input
                      type="number"
                      step="0.1"
                      value={wp.x}
                      onChange={(e) => handleWaypointChange(index, "x", e.target.value)}
                      style={{
                        width: "50px",
                        marginLeft: "5px",
                        fontSize: "12px",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        border: "none",
                      }}
                    />
                  </label>
                  <label style={{ fontSize: "12px" }}>
                    Y:
                    <input
                      type="number"
                      step="0.1"
                      value={wp.y}
                      onChange={(e) => handleWaypointChange(index, "y", e.target.value)}
                      style={{
                        width: "50px",
                        marginLeft: "5px",
                        fontSize: "12px",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        border: "none",
                      }}
                    />
                  </label>
                  <label style={{ fontSize: "12px" }}>
                    Z:
                    <input
                      type="number"
                      step="0.1"
                      value={wp.z}
                      onChange={(e) => handleWaypointChange(index, "z", e.target.value)}
                      style={{
                        width: "50px",
                        marginLeft: "5px",
                        fontSize: "12px",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        border: "none",
                      }}
                    />
                  </label>
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

      {/* Conditionally render InteractionEditor */}
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
