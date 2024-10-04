import { useState } from "react";
import { Interaction } from "../App";

// InteractionEditor Component
interface InteractionEditorProps {
    waypointIndex: number;
    interactions: Interaction[];
    setInteractions: (interactions: Interaction[]) => void;
    onClose: () => void;
  }
  
  const InteractionEditor: React.FC<InteractionEditorProps> = ({ waypointIndex, interactions, setInteractions, onClose }) => {
    const [newInteractionType, setNewInteractionType] = useState<'audio' | 'info' | 'animation' | 'custom'>('audio');
    const [newInteractionData, setNewInteractionData] = useState<any>({});
  
    // Handler to add a new interaction
    const addInteraction = () => {
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
      <div className="interaction-editor-modal">
        <h3>Edit Interactions for Waypoint {waypointIndex + 1}</h3>
        <button onClick={onClose}>Close</button>
        
        {/* List Existing Interactions */}
        <ul>
          {interactions.map((interaction) => (
            <li key={interaction.id}>
              <span>{interaction.type}</span>
              {/* Render form based on interaction type */}
              {/* Example for 'audio' */}
              {interaction.type === 'audio' && (
                <input
                  type="text"
                  value={interaction.data.url || ''}
                  onChange={(e) => updateInteraction(interaction.id, { ...interaction.data, url: e.target.value })}
                  placeholder="Audio URL"
                />
              )}
              {interaction.type === 'info' && (
                <textarea
                  value={interaction.data.text || ''}
                  onChange={(e) => updateInteraction(interaction.id, { ...interaction.data, text: e.target.value })}
                  placeholder="Info Text"
                />
              )}
              {/* Add forms for other types as needed */}
              <button onClick={() => removeInteraction(interaction.id)}>Remove</button>
            </li>
          ))}
        </ul>
  
        {/* Add New Interaction */}
        <div className="add-new-interaction">
          <select value={newInteractionType} onChange={(e) => setNewInteractionType(e.target.value as any)}>
            <option value="audio">Audio</option>
            <option value="info">Info Pop-up</option>
            <option value="animation">Animation</option>
            <option value="custom">Custom</option>
          </select>
  
          {/* Render input fields based on selected type */}
          {newInteractionType === 'audio' && (
            <input
              type="text"
              value={newInteractionData.url || ''}
              onChange={(e) => setNewInteractionData({ ...newInteractionData, url: e.target.value })}
              placeholder="Audio URL"
            />
          )}
          {newInteractionType === 'info' && (
            <textarea
              value={newInteractionData.text || ''}
              onChange={(e) => setNewInteractionData({ ...newInteractionData, text: e.target.value })}
              placeholder="Info Text"
            />
          )}
          {/* Add input fields for other types as needed */}
  
          <button onClick={addInteraction}>Add Interaction</button>
        </div>
      </div>
    );
  };
  
  export default InteractionEditor;