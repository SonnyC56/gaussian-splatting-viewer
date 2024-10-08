import React, { useState } from 'react';
import styled from 'styled-components';

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
`;

const Title = styled.h2`
  margin-top: 0;
`;

const Input = styled.input`
  width: 100%;
  padding: 5px;
  margin-bottom: 10px;
`;

const Checkbox = styled.input`
  margin-right: 5px;
`;

const Button = styled.button`
  padding: 10px;
  margin-right: 10px;
  cursor: pointer;
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
        <div>
          <Checkbox
            type="checkbox"
            checked={includeScrollControls}
            onChange={() => setIncludeScrollControls(!includeScrollControls)}
            id="includeScrollControls"
          />
          <label htmlFor="includeScrollControls">Include scroll controls</label>
        </div>
        <div>
          <Checkbox
            type="checkbox"
            checked={includeMovementInstructions}
            onChange={() => setIncludeMovementInstructions(!includeMovementInstructions)}
            id="includeMovementInstructions"
          />
          <label htmlFor="includeMovementInstructions">Include movement instructions</label>
        </div>
        <div>
          <Button onClick={handleExport}>Export</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </PopupContent>
    </PopupOverlay>
  );
};

export default ExportPopup;