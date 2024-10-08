import React, { useState } from 'react';
import styled from 'styled-components';

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background-color: #1e1e1e;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin-top: 0;
  color: #ffffff;
  font-size: 18px;
  margin-bottom: 15px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  background-color: #2c2c2c;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const Checkbox = styled.input`
  margin-right: 10px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  cursor: pointer;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  margin-left: 10px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.3s;

  background-color: ${props => props.primary ? '#4CAF50' : '#555555'};
  color: #ffffff;

  &:hover {
    background-color: ${props => props.primary ? '#45a049' : '#666666'};
  }
`;

interface ExportPopupProps {
  onExport: (modelUrl: string, includeScrollControls: boolean, includeMovementInstructions: boolean) => void;
  onCancel: () => void;
  isModelLocal: boolean;
}

const ExportPopup: React.FC<ExportPopupProps> = ({ onExport, onCancel, isModelLocal }) => {
  const [modelUrl, setModelUrl] = useState('');
  const [includeScrollControls, setIncludeScrollControls] = useState(true);
  const [includeMovementInstructions, setIncludeMovementInstructions] = useState(true);

  const handleExport = () => {
    if (isModelLocal && !modelUrl) {
      alert('Please provide a URL for the model.');
      return;
    }
    onExport(modelUrl, includeScrollControls, includeMovementInstructions);
  };

  return (
    <PopupOverlay>
      <PopupContent>
        <Title>Export Scene</Title>
        {isModelLocal && (
          <>
            <p>Please provide a URL where the model is hosted:</p>
            <Input
              type="text"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              placeholder="Enter model URL"
            />
          </>
        )}
        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={includeScrollControls}
            onChange={() => setIncludeScrollControls(!includeScrollControls)}
            id="includeScrollControls"
          />
          <CheckboxLabel htmlFor="includeScrollControls">Include scroll controls</CheckboxLabel>
        </CheckboxContainer>
        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={includeMovementInstructions}
            onChange={() => setIncludeMovementInstructions(!includeMovementInstructions)}
            id="includeMovementInstructions"
          />
          <CheckboxLabel htmlFor="includeMovementInstructions">Include movement instructions</CheckboxLabel>
        </CheckboxContainer>
        <ButtonContainer>
          <Button onClick={onCancel}>Cancel</Button>
          <Button primary onClick={handleExport}>Export</Button>
        </ButtonContainer>
      </PopupContent>
    </PopupOverlay>
  );
};

export default ExportPopup;