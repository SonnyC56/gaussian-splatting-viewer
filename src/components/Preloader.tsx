import React from 'react';
import styled, { keyframes } from 'styled-components';

interface PreloaderProps {
  isLoading: boolean;
}

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const PreloaderContainer = styled.div<{ isLoading: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  flex-direction: column;
  height: 100%; 
  background-color: #1e1e1e;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: ${({ isLoading }) => isLoading ? 'auto' : 'none'};
  animation: ${({ isLoading }) => !isLoading && fadeOut} 0.5s ease-out forwards;
`;

const Title = styled.h1`
  font-size: 48px;
  color: #ffffff;
  text-align: center;
  font-family: 'Courier New', monospace;
    
`;

const Spinner = styled.div`
  width: 25px;
  height: 25px;
  border: 5px solid #ffffff;
  border-top: 5px solid #F76900;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Preloader: React.FC<PreloaderProps> = ({ isLoading }) => {
  return (
    <PreloaderContainer isLoading={isLoading}>
 
        <Title>Story Splat</Title>
        <Spinner />
 
    </PreloaderContainer>
  );
};

export default Preloader;