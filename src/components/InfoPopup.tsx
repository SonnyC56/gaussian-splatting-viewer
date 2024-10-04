// src/components/InfoPopup.tsx
import React from "react";

interface InfoPopupProps {
  text: string;
  onClose: () => void;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ text, onClose }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <p>{text}</p>
        <button onClick={onClose} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popup: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
  closeButton: {
    marginTop: "15px",
    padding: "8px 16px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default InfoPopup;
