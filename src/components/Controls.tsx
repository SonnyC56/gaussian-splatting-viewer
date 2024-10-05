// Controls.jsx
import React, { useState } from "react";
import Draggable from "react-draggable";
import styled from "styled-components";
import { FiChevronUp, FiChevronDown, FiInfo } from "react-icons/fi";

// Define the interface for custom props
interface ControlsInfoProps {
  isVisible: boolean;
}

// Styled Components
const Handle = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #222; /* Dark background */
  padding: 12px; /* Reduced padding for tighter layout */
  border-radius: 8px;
  color: #fff; /* Light text */
  z-index: 1000;
  cursor: move;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: background-color 0.3s ease;

  @media (max-width: 480px) {
    width: 90%;
    right: 5%;
    padding: 10px;
  }
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  color: #fff; /* Light text */
  font-size: 16px; /* Slightly smaller font */
  cursor: pointer;
  display: flex;
  align-items: center; /* Vertically center items */
  outline: none;
  transition: color 0.3s ease;
  width: 100%;
justify-content: space-between;


  &:hover {
    color: #1e90ff; /* DodgerBlue on hover */
  }
`;

const ControlsInfo = styled.div<ControlsInfoProps>`
  max-height: ${({ isVisible }) => (isVisible ? "300px" : "0")};
  opacity: ${({ isVisible }) => (isVisible ? "1" : "0")};
  overflow: hidden;
  transition: all 0.3s ease;
`;

const Title = styled.p`
  font-size: 14px; /* Slightly smaller font */
  font-weight: bold;
  margin-bottom: 8px; /* Reduced margin */
`;

const ControlsList = styled.ul`
  list-style: none;
  padding-left: 0;
  margin: 0;
`;

const ListItem = styled.li`
  margin-bottom: 6px; /* Tighter margin */
  position: relative;
  padding-left: 18px; /* Adjusted padding for bullet alignment */
  font-size: 13px; /* Slightly smaller font */
  color: #ddd; /* Light gray text */

  &::before {
    content: "•";
    color: #1e90ff; /* DodgerBlue bullets */
    position: absolute;
    left: 0;
    top: 0;
  }
`;

const Controls = () => {
  // State to manage the visibility of the controls info section
  const [showControlsInfo, setShowControlsInfo] = useState<boolean>(true);

  return (
    <Draggable handle=".handle">
      <Handle className="handle">
        <ToggleButton
          onClick={() => setShowControlsInfo(!showControlsInfo)}
          aria-label={showControlsInfo ? "Hide Controls Information" : "Show Controls Information"}
          aria-expanded={showControlsInfo}
        >
          <FiInfo style={{ marginRight: "6px" }} />
          {showControlsInfo ? "Hide Controls" : "Show Controls"}
          {showControlsInfo ? (
            <FiChevronUp style={{ marginLeft: "6px" }} />
          ) : (
            <FiChevronDown style={{ marginLeft: "6px" }} />
          )}
        </ToggleButton>
        <ControlsInfo isVisible={showControlsInfo}>
          <Title>Controls:</Title>
          <ControlsList>
            <ListItem>W/A/S/D: Move camera</ListItem>
            <ListItem>Q/E: Up/Down</ListItem>
            <ListItem>Mouse: Look around</ListItem>
            <ListItem>Scroll: Move along path</ListItem>
            <ListItem>Drag and drop a .splat or .ply file to load</ListItem>
          </ControlsList>
        </ControlsInfo>
      </Handle>
    </Draggable>
  );
};

export default Controls;
