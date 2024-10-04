interface ExportButtonProps {
    handleExport: () => void;
  }
  
  const ExportButton: React.FC<ExportButtonProps> = ({ handleExport }) => {
    return (
      <button
        onClick={handleExport}
        style={{
          position: 'absolute',
          top: '130px', // Positioned below Background Color Selector
          left: '10px',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        Export Scene
      </button>
    );
  };

    export default ExportButton;