import React from "react";
import Draggable from "react-draggable";

interface ScrollControlsProps {
  scrollPercentage: number;
  adjustScroll: (direction: number) => void;
  showScrollControls: boolean;
  setShowScrollControls: React.Dispatch<React.SetStateAction<boolean>>;
}

const ScrollControls: React.FC<ScrollControlsProps> = ({
  scrollPercentage,
  adjustScroll,
  showScrollControls,
  setShowScrollControls,
}) => {

  return (
    <Draggable handle=".handle">
      <div
        className="handle"
        style={{
          position: "absolute",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          zIndex: 10,
          cursor: "move",
        }}
      >
        <button
          onClick={() => setShowScrollControls(!showScrollControls)}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {showScrollControls ? "Hide Scroll Controls" : "Show Scroll Controls"}
        </button>
        {showScrollControls && (
          <div style={{ marginTop: "10px" }}>
            <p>Scroll Position: {Math.round(scrollPercentage)}%</p>
            <button
              onClick={() => adjustScroll(-1)}
              style={{
                marginRight: "5px",
                padding: "5px 10px",
                backgroundColor: "#555",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Backward
            </button>
            <button
              onClick={() => adjustScroll(1)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#555",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Forward
            </button>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default ScrollControls;