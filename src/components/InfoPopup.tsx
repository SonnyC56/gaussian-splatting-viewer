// src/components/InfoPopup.tsx
import React from "react";
import styled from "styled-components";

interface InfoPopupProps {
  text: string;
  onClose: () => void;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ text, onClose }) => {
  return (
    <Overlay>
      <Popup>
        <Text>{text}</Text>
        <CloseButton onClick={onClose}>Close</CloseButton>
      </Popup>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Popup = styled.div`
  background-color: #222; /* Grey background */
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const Text = styled.p`
  margin: 0;
  font-size: 16px;
`;

const CloseButton = styled.button`
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #0056b3;
  }
`;

export default InfoPopup;
