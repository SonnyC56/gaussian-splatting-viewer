// src/components/InteractionEditor.tsx
import React, { useState } from "react";
import Draggable from "react-draggable";
import { Interaction, AudioInteractionData } from "../App";

interface InteractionEditorProps {
  waypointIndex: number;
  interactions: Interaction[];
  setInteractions: (interactions: Interaction[]) => void;
  onClose: () => void;
}

const InteractionEditor: React.FC<InteractionEditorProps> = ({
  waypointIndex,
  interactions,
  setInteractions,
  onClose,
}) => {
  const [newInteractionType, setNewInteractionType] = useState<
    "audio" | "info"
  >("audio");
  const [newInteractionData, setNewInteractionData] = useState<any>({});

  // Handler to add a new interaction
  const addInteraction = () => {
    // Validation based on interaction type
    if (newInteractionType === "audio" && !newInteractionData.url) {
      alert("Please provide an Audio URL.");
      return;
    }
    if (newInteractionType === "info" && !newInteractionData.text) {
      alert("Please provide Info Text.");
      return;
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
    const filteredInteractions = interactions.filter(
      (interaction) => interaction.id !== id
    );
    setInteractions(filteredInteractions);
  };

  return (
    <Draggable handle=".handle">
      <div
        className="interaction-editor handle"
        style={{
          position: "absolute",
          top: "50px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.9)",
          padding: "20px",
          borderRadius: "8px",
          color: "white",
          zIndex: 20,
          maxHeight: "80vh",
          overflowY: "auto",
          cursor: "move",
          width: "450px",
          boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          className="editor-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ margin: "0", fontSize: "20px" }}>
            Edit Interactions - Waypoint {waypointIndex + 1}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#E74C3C",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            Close
          </button>
        </div>

        {/* List Existing Interactions */}
        <div className="existing-interactions">
          {interactions.length > 0 ? (
            interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="interaction-card"
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="interaction-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      textTransform: "capitalize",
                      fontSize: "16px",
                    }}
                  >
                    {interaction.type} Interaction
                  </span>
                  <button
                    onClick={() => removeInteraction(interaction.id)}
                    style={{
                      backgroundColor: "#E74C3C",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    Remove
                  </button>
                </div>

                {/* Render form based on interaction type */}
                <div className="interaction-content">
                  {interaction.type === "audio" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {/* Audio URL */}
                      <div>
                        <label
                          style={{ marginBottom: "5px", fontSize: "14px" }}
                        >
                          Audio URL:
                        </label>
                        <input
                          type="text"
                          value={interaction.data.url || ""}
                          onChange={(e) =>
                            updateInteraction(interaction.id, {
                              ...interaction.data,
                              url: e.target.value,
                            })
                          }
                          placeholder="Enter Audio URL"
                          style={{
                            width: "96%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      </div>

                      {/* Spatial Sound */}
                      <div>
                        <label
                          style={{
                            marginBottom: "5px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={interaction.data.spatialSound || false}
                            onChange={(e) =>
                              updateInteraction(interaction.id, {
                                ...interaction.data,
                                spatialSound: e.target.checked,
                              })
                            }
                            style={{ marginRight: "8px" }}
                          />
                          Enable Spatial Sound
                        </label>
                      </div>

                      {/* Stop On Exit (only for non-spatial sounds) */}
                      {!interaction.data.spatialSound && (
                        <div>
                          <label
                            style={{
                              marginBottom: "5px",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={interaction.data.stopOnExit || false}
                              onChange={(e) =>
                                updateInteraction(interaction.id, {
                                  ...interaction.data,
                                  stopOnExit: e.target.checked,
                                })
                              }
                              style={{ marginRight: "8px" }}
                            />
                            Stop Sound When Leaving Waypoint
                          </label>
                        </div>
                      )}

                      {/* Autoplay */}
                      <div>
                        <label
                          style={{
                            marginBottom: "5px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              interaction.data.autoplay !== undefined
                                ? interaction.data.autoplay
                                : true
                            }
                            onChange={(e) =>
                              updateInteraction(interaction.id, {
                                ...interaction.data,
                                autoplay: e.target.checked,
                              })
                            }
                            style={{ marginRight: "8px" }}
                          />
                          Autoplay
                        </label>
                      </div>

                      {/* Volume */}
                      <div>
                        <label
                          style={{ marginBottom: "5px", fontSize: "14px" }}
                        >
                          Volume:
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={
                            interaction.data.volume !== undefined
                              ? interaction.data.volume
                              : 1
                          }
                          onChange={(e) =>
                            updateInteraction(interaction.id, {
                              ...interaction.data,
                              volume: parseFloat(e.target.value),
                            })
                          }
                          style={{ width: "100%" }}
                        />
                      </div>

                      {/* Loop */}
                      <div>
                        <label
                          style={{
                            marginBottom: "5px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              interaction.data.loop !== undefined
                                ? interaction.data.loop
                                : true
                            }
                            onChange={(e) =>
                              updateInteraction(interaction.id, {
                                ...interaction.data,
                                loop: e.target.checked,
                              })
                            }
                            style={{ marginRight: "8px" }}
                          />
                          Loop
                        </label>
                      </div>

                      {/* If Spatial Sound is enabled, show spatial properties */}
                      {interaction.data.spatialSound && (
                        <>
                          {/* Distance Model */}
                          <div>
                            <label
                              style={{ marginBottom: "5px", fontSize: "14px" }}
                            >
                              Distance Model:
                            </label>
                            <select
                              value={
                                interaction.data.distanceModel || "exponential"
                              }
                              onChange={(e) =>
                                updateInteraction(interaction.id, {
                                  ...interaction.data,
                                  distanceModel: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                              }}
                            >
                              <option value="linear">Linear</option>
                              <option value="exponential">Exponential</option>
                            </select>
                          </div>

                          {/* Max Distance */}
                          <div>
                            <label
                              style={{ marginBottom: "5px", fontSize: "14px" }}
                            >
                              Max Distance:
                            </label>
                            <input
                              type="number"
                              value={
                                interaction.data.maxDistance !== undefined
                                  ? interaction.data.maxDistance
                                  : 100
                              }
                              onChange={(e) =>
                                updateInteraction(interaction.id, {
                                  ...interaction.data,
                                  maxDistance: parseFloat(e.target.value),
                                })
                              }
                              placeholder="Max Distance"
                              min="0"
                              step="1"
                              style={{
                                width: "96%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                              }}
                            />
                          </div>

                          {/* Reference Distance */}
                          <div>
                            <label
                              style={{ marginBottom: "5px", fontSize: "14px" }}
                            >
                              Reference Distance:
                            </label>
                            <input
                              type="number"
                              value={
                                interaction.data.refDistance !== undefined
                                  ? interaction.data.refDistance
                                  : 1
                              }
                              onChange={(e) =>
                                updateInteraction(interaction.id, {
                                  ...interaction.data,
                                  refDistance: parseFloat(e.target.value),
                                })
                              }
                              placeholder="Reference Distance"
                              min="0"
                              step="1"
                              style={{
                                width: "96%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                              }}
                            />
                          </div>

                          {/* Rolloff Factor */}
                          <div>
                            <label
                              style={{ marginBottom: "5px", fontSize: "14px" }}
                            >
                              Rolloff Factor:
                            </label>
                            <input
                              type="number"
                              value={
                                interaction.data.rolloffFactor !== undefined
                                  ? interaction.data.rolloffFactor
                                  : 1
                              }
                              onChange={(e) =>
                                updateInteraction(interaction.id, {
                                  ...interaction.data,
                                  rolloffFactor: parseFloat(e.target.value),
                                })
                              }
                              placeholder="Rolloff Factor"
                              min="0"
                              step="0.1"
                              style={{
                                width: "96%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {interaction.type === "info" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <label
                          style={{ marginBottom: "5px", fontSize: "14px" }}
                        >
                          Info Text:
                        </label>
                        <textarea
                          value={interaction.data.text || ""}
                          onChange={(e) =>
                            updateInteraction(interaction.id, {
                              ...interaction.data,
                              text: e.target.value,
                            })
                          }
                          placeholder="Enter Info Text"
                          style={{
                            width: "96%", // Adjusted width
                            minHeight: "80px",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            resize: "vertical",
                            marginBottom: "10px",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontStyle: "italic" }}>
              No interactions added for this waypoint.
            </p>
          )}
        </div>

        {/* Add New Interaction */}
        <div
          className="add-new-interaction"
          style={{
            marginTop: "30px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: "20px",
          }}
        >
          <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>
            Add New Interaction
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <div>
              <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                Interaction Type:
              </label>
              <select
                value={newInteractionType}
                onChange={(e) => {
                  setNewInteractionType(e.target.value as any);
                  setNewInteractionData({});
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="audio">Audio</option>
                <option value="info">Info Pop-up</option>
              </select>
            </div>

            {/* Render input fields based on selected type */}
            {newInteractionType === "audio" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {/* Audio URL */}
                <div>
                  <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                    Audio URL:
                  </label>
                  <input
                    type="text"
                    value={newInteractionData.url || ""}
                    onChange={(e) =>
                      setNewInteractionData({
                        ...newInteractionData,
                        url: e.target.value,
                      })
                    }
                    placeholder="Enter Audio URL"
                    style={{
                      width: "96%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                {/* Spatial Sound */}
                <div>
                  <label
                    style={{
                      marginBottom: "5px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newInteractionData.spatialSound || false}
                      onChange={(e) =>
                        setNewInteractionData({
                          ...newInteractionData,
                          spatialSound: e.target.checked,
                        })
                      }
                      style={{ marginRight: "8px" }}
                    />
                    Enable Spatial Sound
                  </label>
                </div>

                {/* Stop On Exit (only for non-spatial sounds) */}
                {!newInteractionData.spatialSound && (
                  <div>
                    <label
                      style={{
                        marginBottom: "5px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newInteractionData.stopOnExit || false}
                        onChange={(e) =>
                          setNewInteractionData({
                            ...newInteractionData,
                            stopOnExit: e.target.checked,
                          })
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Stop Sound When Leaving Waypoint
                    </label>
                  </div>
                )}

                {/* Autoplay */}
                <div>
                  <label
                    style={{
                      marginBottom: "5px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        newInteractionData.autoplay !== undefined
                          ? newInteractionData.autoplay
                          : true
                      }
                      onChange={(e) =>
                        setNewInteractionData({
                          ...newInteractionData,
                          autoplay: e.target.checked,
                        })
                      }
                      style={{ marginRight: "8px" }}
                    />
                    Autoplay
                  </label>
                </div>

                {/* Volume */}
                <div>
                  <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                    Volume:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      newInteractionData.volume !== undefined
                        ? newInteractionData.volume
                        : 1
                    }
                    onChange={(e) =>
                      setNewInteractionData({
                        ...newInteractionData,
                        volume: parseFloat(e.target.value),
                      })
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Loop */}
                <div>
                  <label
                    style={{
                      marginBottom: "5px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        newInteractionData.loop !== undefined
                          ? newInteractionData.loop
                          : true
                      }
                      onChange={(e) =>
                        setNewInteractionData({
                          ...newInteractionData,
                          loop: e.target.checked,
                        })
                      }
                      style={{ marginRight: "8px" }}
                    />
                    Loop
                  </label>
                </div>

                {/* If Spatial Sound is enabled, show spatial properties */}
                {newInteractionData.spatialSound && (
                  <>
                    {/* Distance Model */}
                    <div>
                      <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                        Distance Model:
                      </label>
                      <select
                        value={
                          newInteractionData.distanceModel || "exponential"
                        }
                        onChange={(e) =>
                          setNewInteractionData({
                            ...newInteractionData,
                            distanceModel: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <option value="linear">Linear</option>
                        <option value="exponential">Exponential</option>
                      </select>
                    </div>

                    {/* Max Distance */}
                    <div>
                      <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                        Max Distance:
                      </label>
                      <input
                        type="number"
                        value={
                          newInteractionData.maxDistance !== undefined
                            ? newInteractionData.maxDistance
                            : 100
                        }
                        onChange={(e) =>
                          setNewInteractionData({
                            ...newInteractionData,
                            maxDistance: parseFloat(e.target.value),
                          })
                        }
                        placeholder="Max Distance"
                        min="0"
                        step="1"
                        style={{
                          width: "96%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </div>

                    {/* Reference Distance */}
                    <div>
                      <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                        Reference Distance:
                      </label>
                      <input
                        type="number"
                        value={
                          newInteractionData.refDistance !== undefined
                            ? newInteractionData.refDistance
                            : 1
                        }
                        onChange={(e) =>
                          setNewInteractionData({
                            ...newInteractionData,
                            refDistance: parseFloat(e.target.value),
                          })
                        }
                        placeholder="Reference Distance"
                        min="0"
                        step="1"
                        style={{
                          width: "96%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </div>

                    {/* Rolloff Factor */}
                    <div>
                      <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                        Rolloff Factor:
                      </label>
                      <input
                        type="number"
                        value={
                          newInteractionData.rolloffFactor !== undefined
                            ? newInteractionData.rolloffFactor
                            : 1
                        }
                        onChange={(e) =>
                          setNewInteractionData({
                            ...newInteractionData,
                            rolloffFactor: parseFloat(e.target.value),
                          })
                        }
                        placeholder="Rolloff Factor"
                        min="0"
                        step="0.1"
                        style={{
                          width: "96%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {newInteractionType === "info" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div>
                  <label style={{ marginBottom: "5px", fontSize: "14px" }}>
                    Info Text:
                  </label>
                  <textarea
                    value={newInteractionData.text || ""}
                    onChange={(e) =>
                      setNewInteractionData({
                        ...newInteractionData,
                        text: e.target.value,
                      })
                    }
                    placeholder="Enter Info Text"
                    style={{
                      width: "96%", // Adjusted width
                      minHeight: "80px",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      resize: "vertical",
                      marginBottom: "10px",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={addInteraction}
              style={{
                padding: "10px 16px",
                backgroundColor: "#27AE60",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "16px",
                alignSelf: "flex-start",
                marginTop: "10px",
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
