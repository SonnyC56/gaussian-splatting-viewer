// ParameterControls.tsx
import React, { useState } from "react";
import Draggable from "react-draggable";
import styled from "styled-components";
import { FiSettings } from "react-icons/fi";
import BackgroundColorSelector from "./BackgroundColorSelector"; // Adjust the import path as needed

// Extend the interface to include backgroundColor props
interface ParameterControlsProps {
  scrollSpeed: number;
  setScrollSpeed: React.Dispatch<React.SetStateAction<number>>;
  animationFrames: number;
  setAnimationFrames: React.Dispatch<React.SetStateAction<number>>;
  cameraMovementSpeed: number;
  setCameraMovementSpeed: React.Dispatch<React.SetStateAction<number>>;
  cameraRotationSensitivity: number;
  setCameraRotationSensitivity: React.Dispatch<React.SetStateAction<number>>;
  backgroundColor: string; // New prop
  setBackgroundColor: (color: string) => void; // New prop
}

const Handle = styled.div<{ isDraggingDisabled: boolean }>`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: #1e1e1e; /* Dark background */
  padding: 16px; /* Reduced padding for tighter layout */
  border-radius: 8px;
  color: #ffffff; /* Light text */
  z-index: 1000;
  cursor: ${({ isDraggingDisabled }) => (isDraggingDisabled ? "not-allowed" : "move")};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  width: 280px; /* Adjusted width */
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
  font-size: 18px;
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

const ControlsContainer = styled.div`
  margin-top: 12px;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* Reduced margin */
`;

const Label = styled.label`
  flex: 1;
  font-size: 14px;
  color: #dddddd;
`;

const Input = styled.input`
  width: 60px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #555555;
  background-color: #2c2c2c;
  color: #ffffff;
  font-size: 14px;
  margin-left: 8px;

  &:focus {
    border-color: #1e90ff;
    outline: none;
    box-shadow: 0 0 5px rgba(30, 144, 255, 0.5);
  }
`;

const ParameterControls: React.FC<ParameterControlsProps> = ({
  scrollSpeed,
  setScrollSpeed,
  animationFrames,
  setAnimationFrames,
  cameraMovementSpeed,
  setCameraMovementSpeed,
  cameraRotationSensitivity,
  setCameraRotationSensitivity,
  backgroundColor, // New prop
  setBackgroundColor, // New prop
}) => {
  // Internal state to manage visibility
  const [showControls, setShowControls] = useState<boolean>(true);

  // State to manage draggable behavior
  const [isDraggingDisabled, setIsDraggingDisabled] = useState<boolean>(false);

  // Handlers to disable dragging when focusing on inputs
  const handleFocus = () => setIsDraggingDisabled(true);
  const handleBlur = () => setIsDraggingDisabled(false);

  return (
    <Draggable handle=".handle" disabled={isDraggingDisabled}>
      <Handle className="handle" isDraggingDisabled={isDraggingDisabled}>
        <Header>
          <Title>
            <FiSettings style={{ marginRight: "8px" }} />
            Adjust Parameters
          </Title>
          <ToggleButton
            onClick={() => setShowControls(!showControls)}
            aria-label="Toggle Controls Visibility"
            aria-expanded={showControls}
          >
            {showControls ? "▲" : "▼"}
          </ToggleButton>
        </Header>
        {showControls && (
          <ControlsContainer>
            {/* Scroll Speed */}
            <ControlRow>
              <Label htmlFor="scrollSpeed">Scroll Speed:</Label>
              <Input
                id="scrollSpeed"
                type="number"
                step="0.01"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </ControlRow>

            {/* Animation Frames */}
            <ControlRow>
              <Label htmlFor="animationFrames">Animation Frames:</Label>
              <Input
                id="animationFrames"
                type="number"
                step="1"
                value={animationFrames}
                onChange={(e) => setAnimationFrames(parseInt(e.target.value, 10))}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </ControlRow>

            {/* Camera Fly Speed */}
            <ControlRow>
              <Label htmlFor="cameraMovementSpeed">Camera Fly Speed:</Label>
              <Input
                id="cameraMovementSpeed"
                type="number"
                step="0.01"
                value={cameraMovementSpeed}
                onChange={(e) => setCameraMovementSpeed(parseFloat(e.target.value))}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </ControlRow>

            {/* Camera Rotation Sensitivity */}
            <ControlRow>
              <Label htmlFor="cameraRotationSensitivity">Camera Rotation Sensitivity:</Label>
              <Input
                id="cameraRotationSensitivity"
                type="number"
                step="1"
                value={cameraRotationSensitivity}
                onChange={(e) => setCameraRotationSensitivity(parseFloat(e.target.value))}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </ControlRow>

            {/* Background Color Selector */}
            <BackgroundColorSelector
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
            />
          </ControlsContainer>
        )}
      </Handle>
    </Draggable>
  );
};

export default ParameterControls;
