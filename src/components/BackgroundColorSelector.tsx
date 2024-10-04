import React from 'react';
import Draggable from 'react-draggable';

interface BackgroundColorSelectorProps {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

const BackgroundColorSelector: React.FC<BackgroundColorSelectorProps> = ({ backgroundColor, setBackgroundColor }) => {


  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: 'absolute',
          bottom: '220px',
          width: '200px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          zIndex: 10,
          cursor: 'move',
        }}
      >
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Background Color</h3>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
      </div>
    </Draggable>
  );
};

export default BackgroundColorSelector;