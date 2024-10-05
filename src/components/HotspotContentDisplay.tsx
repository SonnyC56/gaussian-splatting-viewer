import React, { useEffect, useRef } from 'react';

interface HotspotContentDisplayProps {
  hotspot: {
    title: string;
    information?: string;
    photoUrl?: string;
  };
  onClose: () => void;
  showCloseButton: boolean;
  mousePosition: { x: number; y: number };
}

const HotspotContentDisplay: React.FC<HotspotContentDisplayProps> = ({ hotspot, onClose, showCloseButton, mousePosition }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      let left = mousePosition.x + 10;
      let top = mousePosition.y + 10;

      if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width - 10;
      }
      if (top + rect.height > window.innerHeight) {
        top = window.innerHeight - rect.height - 10;
      }

      contentRef.current.style.left = `${left}px`;
      contentRef.current.style.top = `${top}px`;
    }
  }, [mousePosition]);

  return (
    <div 
      ref={contentRef}
      style={{
        position: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        zIndex: 1001,
        maxWidth: '300px',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>{hotspot.title}</h3>
      {hotspot.photoUrl && (
        <img src={hotspot.photoUrl} alt={hotspot.title} style={{ width: '100%', marginBottom: '10px', borderRadius: '5px' }} />
      )}
      {hotspot.information && (
        <p style={{ marginBottom: '10px' }}>{hotspot.information}</p>
      )}
      {showCloseButton && (
        <button onClick={onClose} style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>
          Close
        </button>
      )}
    </div>
  );
};

export default HotspotContentDisplay;