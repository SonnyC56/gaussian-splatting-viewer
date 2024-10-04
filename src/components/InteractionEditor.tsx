// src/components/InteractionEditor.tsx
import React, { useState } from "react";
import Draggable from "react-draggable";
import { Interaction } from "../App";

interface InteractionEditorProps {
  waypointIndex: number;
  interactions: Interaction[];
  setInteractions: (interactions: Interaction[]) => void;
  onClose: () => void;
}

const InteractionEditor: React.FC<InteractionEditorProps> = ({ waypointIndex, interactions, setInteractions, onClose }) => {
  const [newInteractionType, setNewInteractionType] = useState<'audio' | 'info' | 'animation'>('audio');
  const [newInteractionData, setNewInteractionData] = useState<any>({});

  // Handler to add a new interaction
  const addInteraction = () => {
    // Validation based on interaction type
    if (newInteractionType === 'audio' && !newInteractionData.url) {
      alert("Please provide an Audio URL.");
      return;
    }
    if (newInteractionType === 'info' && !newInteractionData.text) {
      alert("Please provide Info Text.");
      return;
    }
    if (newInteractionType === 'animation') {
      if (!newInteractionData.animationName || !newInteractionData.targetMeshName) {
        alert("Please provide Animation Name and Target Mesh Name.");
        return;
      }
    }

    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}`,
      type: newInteractionType,
      data: newInteractionData,
    };
    setInteractions([...interactions, newInteraction]);
    setNewInteractionData({});
  };

  // Handler to update an existing interaction
  const updateInteraction = (id: string, updatedData: any) => {
    const updatedInteractions = interactions.map((interaction) =>
      interaction.id === id ? { ...interaction, data: updatedData } : interaction
    );
    setInteractions(updatedInteractions);
  };

  // Handler to remove an interaction
  const removeInteraction = (id: string) => {
    const filteredInteractions = interactions.filter((interaction) => interaction.id !== id);
    setInteractions(filteredInteractions);
  };

  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: "absolute",
          top: "50px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: "15px",
          borderRadius: "5px",
          color: "white",
          zIndex: 20,
          maxHeight: "70vh",
          overflowY: "auto",
          cursor: "move",
          width: "400px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ margin: "0", fontSize: "18px" }}>Edit Interactions - Waypoint {waypointIndex + 1}</h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "red",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: "3px",
              fontSize: "14px",
            }}
          >
            Close
          </button>
        </div>

        {/* List Existing Interactions */}
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {interactions.map((interaction) => (
            <li key={interaction.id} style={{ marginBottom: "15px", padding: "10px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", textTransform: "capitalize" }}>{interaction.type}</span>
                <button
                  onClick={() => removeInteraction(interaction.id)}
                  style={{
                    backgroundColor: "red",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "3px 6px",
                    borderRadius: "3px",
                    fontSize: "12px",
                  }}
                >
                  Remove
                </button>
              </div>

              {/* Render form based on interaction type */}
              <div style={{ marginTop: "10px" }}>
                {interaction.type === 'audio' && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "5px", fontSize: "14px" }}>Audio URL:</label>
                    <input
                      type="text"
                      value={interaction.data.url || ''}
                      onChange={(e) => updateInteraction(interaction.id, { ...interaction.data, url: e.target.value })}
                      placeholder="Enter Audio URL"
                      style={{ padding: "5px", borderRadius: "3px", border: "none" }}
                    />
                  </div>
                )}
                {interaction.type === 'info' && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "5px", fontSize: "14px" }}>Info Text:</label>
                    <textarea
                      value={interaction.data.text || ''}
                      onChange={(e) => updateInteraction(interaction.id, { ...interaction.data, text: e.target.value })}
                      placeholder="Enter Info Text"
                      style={{ padding: "5px", borderRadius: "3px", border: "none", resize: "vertical" }}
                    />
                  </div>
                )}
                {interaction.type === 'animation' && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "5px", fontSize: "14px" }}>Animation Name:</label>
                    <input
                      type="text"
                      value={interaction.data.animationName || ''}
                      onChange={(e) => updateInteraction(interaction.id, { ...interaction.data, animationName: e.target.value })}
                      placeholder="Enter Animation Name"
                      style={{ padding: "5px", borderRadius: "3px", border: "none", marginBottom: "10px" }}
                    />
                    <label style={{ marginBottom: "5px", fontSize: "14px" }}>Target Mesh Name:</label>
                    <input
                      type="text"
                      value={interaction.data.targetMeshName || ''}
                      onChange={(e) => updateInteraction(interaction.id, { ...interaction.data, targetMeshName: e.target.value })}
                      placeholder="Enter Target Mesh Name"
                      style={{ padding: "5px", borderRadius: "3px", border: "none" }}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Add New Interaction */}
        <div className="add-new-interaction" style={{ marginTop: "20px", borderTop: "1px solid #555", paddingTop: "10px" }}>
          <h4 style={{ marginBottom: "10px", fontSize: "16px" }}>Add New Interaction</h4>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "5px", fontSize: "14px" }}>Type:</label>
            <select
              value={newInteractionType}
              onChange={(e) => {
                setNewInteractionType(e.target.value as any);
                setNewInteractionData({});
              }}
              style={{ padding: "5px", borderRadius: "3px", border: "none", marginBottom: "10px" }}
            >
              <option value="audio">Audio</option>
              <option value="info">Info Pop-up</option>
              <option value="animation">Animation</option>
            </select>

            {/* Render input fields based on selected type */}
            {newInteractionType === 'audio' && (
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "10px" }}>
                <label style={{ marginBottom: "5px", fontSize: "14px" }}>Audio URL:</label>
                <input
                  type="text"
                  value={newInteractionData.url || ''}
                  onChange={(e) => setNewInteractionData({ ...newInteractionData, url: e.target.value })}
                  placeholder="Enter Audio URL"
                  style={{ padding: "5px", borderRadius: "3px", border: "none" }}
                />
              </div>
            )}
            {newInteractionType === 'info' && (
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "10px" }}>
                <label style={{ marginBottom: "5px", fontSize: "14px" }}>Info Text:</label>
                <textarea
                  value={newInteractionData.text || ''}
                  onChange={(e) => setNewInteractionData({ ...newInteractionData, text: e.target.value })}
                  placeholder="Enter Info Text"
                  style={{ padding: "5px", borderRadius: "3px", border: "none", resize: "vertical" }}
                />
              </div>
            )}
            {newInteractionType === 'animation' && (
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "10px" }}>
                <label style={{ marginBottom: "5px", fontSize: "14px" }}>Animation Name:</label>
                <input
                  type="text"
                  value={newInteractionData.animationName || ''}
                  onChange={(e) => setNewInteractionData({ ...newInteractionData, animationName: e.target.value })}
                  placeholder="Enter Animation Name"
                  style={{ padding: "5px", borderRadius: "3px", border: "none", marginBottom: "10px" }}
                />
                <label style={{ marginBottom: "5px", fontSize: "14px" }}>Target Mesh Name:</label>
                <input
                  type="text"
                  value={newInteractionData.targetMeshName || ''}
                  onChange={(e) => setNewInteractionData({ ...newInteractionData, targetMeshName: e.target.value })}
                  placeholder="Enter Target Mesh Name"
                  style={{ padding: "5px", borderRadius: "3px", border: "none" }}
                />
              </div>
            )}

            <button
              onClick={addInteraction}
              style={{
                padding: "7px 12px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "3px",
                fontSize: "14px",
                alignSelf: "flex-start",
              }}
            >
              Add Interaction
            </button>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default InteractionEditor;