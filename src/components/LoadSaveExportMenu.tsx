// LoadSaveExportMenu.tsx
import React from "react";
import Draggable from "react-draggable";
import styled from "styled-components";
import { FiFolder, FiSave, FiUpload, FiDownload, FiTrash2 } from "react-icons/fi"; // Corrected Icon

// Define the interface for custom props
interface LoadSaveExportMenuProps {
  setLoadedModelUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setIsModelLocal: React.Dispatch<React.SetStateAction<boolean>>;
  customModelUrl: string;
  setCustomModelUrl: React.Dispatch<React.SetStateAction<string>>;
  handleExport: () => void;
  resetSettings: () => void;
  saveToJson: () => void;
  loadFromJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Styled Components

const MenuContainer = styled.div<{ isDraggingDisabled: boolean }>`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #1e1e1e; /* Dark background */
  padding: 16px; /* Consistent padding */
  border-radius: 8px;
  color: #ffffff; /* Light text */
  z-index: 1000;
  cursor: ${({ isDraggingDisabled }) => (isDraggingDisabled ? "not-allowed" : "move")};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  width: 280px; /* Consistent width */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: background-color 0.3s ease, cursor 0.3s ease;

  @media (max-width: 480px) {
    width: 90%;
    left: 5%;
    padding: 12px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px; /* Adjusted for consistency */
  display: flex;
  align-items: center;
  color: #ffffff;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  outline: none;
  transition: color 0.3s ease;

  &:hover {
    color: #1e90ff; /* DodgerBlue on hover */
  }
`;

const Section = styled.div`
  margin-top: 12px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 16px; /* Consistent with Load/Save title */
  color: #ffffff;
  display: flex;
  align-items: center;
`;

const Button = styled.button<{ variant?: string; }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding:  6px 10px; /* Adjust padding based on requirement */
  margin-bottom: 8px;
  background-color: ${({ variant }) => {
    switch (variant) {
      case "primary":
        return "#007bff";
      case "success":
        return "#28a745";
      case "info":
        return "#17a2b8";
      case "danger":
        return "#dc3545";
      case "secondary":
        return "#555555";
      default:
        return "#555555";
    }
  }};
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  height: 40px; /* Fixed height for Save/Load buttons */

  &:hover {
    opacity: 0.9;
  }

  svg {
    margin-right: 8px;
    flex-shrink: 0;
    /* Consistent icon size */
    width: 18px;
    height: 18px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 8px;
  box-sizing: border-box;
  border: 1px solid #555555;
  border-radius: 4px;
  background-color: #2c2c2c;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    border-color: #1e90ff;
    outline: none;
    box-shadow: 0 0 5px rgba(30, 144, 255, 0.5);
  }
`;

const FileInputLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 12px;
  background-color: #17a2b8;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  height: 24px; /* Fixed height for consistency */

  &:hover {
    opacity: 0.9;
  }

  svg {
    margin-right: 8px;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const HorizontalLine = styled.hr`
  border: 1px solid #555555;
  margin: 16px 0;
`;

// Main Component

const LoadSaveExportMenu: React.FC<LoadSaveExportMenuProps> = ({
  setLoadedModelUrl,
  setIsModelLocal,
  customModelUrl,
  setCustomModelUrl,
  handleExport,
  resetSettings,
  saveToJson,
  loadFromJson,
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
    const confirmClear = window.confirm("Are you sure you want to clear all settings?");
    if (!confirmClear) return;
    resetSettings();
  };

  // Internal state to manage draggable behavior
  const [isDraggingDisabled, setIsDraggingDisabled] = React.useState<boolean>(false);

  // Handlers to disable dragging when interacting with inputs
  const handleFocus = () => setIsDraggingDisabled(true);
  const handleBlur = () => setIsDraggingDisabled(false);

  return (
    <Draggable handle=".handle" disabled={isDraggingDisabled}>
      <MenuContainer className="handle" isDraggingDisabled={isDraggingDisabled}>

        {/* Load Splats Section */}
  
          <SectionTitle>
            <FiFolder size={18} style={{ marginRight: "8px" }} /> Load Splats
          </SectionTitle>
          {models.map((splat, index) => (
            <Button
              key={index}
              variant="secondary"
              onClick={() => loadModel(baseURL + splat)}
              onMouseDown={handleFocus}
              onMouseUp={handleBlur}
              style={{ padding: "6px 10px" }} // Slightly shorter buttons
            >
              {splat}
            </Button>
          ))}

          <Input
            type="text"
            placeholder="Enter custom splat URL"
            value={customModelUrl}
            onChange={(e) => setCustomModelUrl(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <Button
            variant="success"
            onClick={() => {
              if (customModelUrl) {
                loadModel(customModelUrl);
              } else {
                alert("Please enter a valid URL.");
              }
            }}
            onMouseDown={handleFocus}
            onMouseUp={handleBlur}
          >
            <FiUpload size={18} /> Load Custom Splat
          </Button>
   

        <HorizontalLine />

        {/* "Load/Save" Title Below Horizontal Line */}
        <Header>
          <Title>
            <FiFolder size={20} style={{ marginRight: "8px" }} /> Load/Save
          </Title>
        </Header>

        {/* Export and Save Section */}
        <Section>
          <Button variant="primary" onClick={handleExport}>
            <FiDownload size={18} /> Export Scene
          </Button>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
            <Button
              variant="success"
              style={{ flex: 1 }}
              onClick={saveToJson}
              onMouseDown={handleFocus}
              onMouseUp={handleBlur}
            >
              <FiSave size={18} /> Save Project
            </Button>
            <FileInputLabel htmlFor="load-json">
              <FiUpload size={18} /> Load Project
            </FileInputLabel>
            <HiddenFileInput
              id="load-json"
              type="file"
              accept=".json"
              onChange={loadFromJson}
            />
          </div>
        </Section>

        {/* Reset Section */}
      
          <Button variant="danger" onClick={handleClear}>
            <FiTrash2 size={18} /> Reset All
          </Button>
    
      </MenuContainer>
    </Draggable>
  );
};

export default LoadSaveExportMenu;
