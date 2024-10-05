// BackgroundColorSelector.tsx
import React from 'react';
import styled from 'styled-components';

interface BackgroundColorSelectorProps {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

// Styled container to match ParameterControls styling
const ColorSelectorContainer = styled.div`
  margin-top: 10px;
  padding: 8px;
  background-color: #2c2c2c;
  border-radius: 4px;
`;

const Title = styled.h4`
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #ffffff;
`;

const ColorInput = styled.input`
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: none;
  padding: 0;

  &:focus {
    outline: none;
  }
`;

const BackgroundColorSelector: React.FC<BackgroundColorSelectorProps> = ({
  backgroundColor,
  setBackgroundColor,
}) => {
  return (
    <ColorSelectorContainer>
      <Title>Background Color</Title>
      <ColorInput
        type="color"
        value={backgroundColor}
        onChange={(e) => setBackgroundColor(e.target.value)}
      />
    </ColorSelectorContainer>
  );
};

export default BackgroundColorSelector;
