import React, { useRef, useEffect } from 'react';
import './App.css';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders'; // Includes all loaders, including Gaussian Splatting
import '@babylonjs/core/Loading/sceneLoader';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropOverlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get the canvas element
    const canvas = canvasRef.current;

    // Generate the Babylon.js 3D engine
    const engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    const scene = new BABYLON.Scene(engine);

    // No need to register the Gaussian Splatting loader anymore

    // Create a universal camera and position it
    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, -10), scene);
    camera.attachControl(canvas, true);

    // Create a basic light
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Variables for Gaussian Splatting Mesh
    let gsMesh: BABYLON.AbstractMesh | null = null;
    let isComponentMounted = true; // Flag to check if component is still mounted

    // Function to load Gaussian Splatting file
    const loadSplatFile = function (file: File) {
      // Dispose of existing mesh
      if (gsMesh) {
        gsMesh.dispose();
        gsMesh = null;
      }

      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      // Pass the File object directly to the loader
      BABYLON.SceneLoader.ImportMeshAsync(
        null,
        '',
        file,
        scene,
        null,
        fileExtension
      )
        .then((result) => {
          if (!isComponentMounted) return; // Prevent setting state if unmounted
          gsMesh = result.meshes[0];
          gsMesh.position = BABYLON.Vector3.Zero();
        })
        .catch((error) => {
          console.error('Error loading splat file:', error);
          alert('Error loading splat file: ' + error.message);
        });
    };

    // Drag-and-Drop Functionality
    const dropOverlay = dropOverlayRef.current;

    // Event handlers
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnterOver = (e: Event) => {
      preventDefault(e);
      if (dropOverlay) dropOverlay.style.display = 'flex';
    };

    const handleDragLeaveDrop = (e: Event) => {
      preventDefault(e);
      if (dropOverlay) dropOverlay.style.display = 'none';
    };

    const handleDrop = (e: DragEvent) => {
      preventDefault(e);
      const dt = e.dataTransfer;
      const files = dt?.files;

      if (files && files.length > 0) {
        const file = files[0];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'splat' || ext === 'ply') {
          loadSplatFile(file);
        } else {
          alert('Please drop a .splat or .ply file.');
        }
      }
    };

    // Add event listeners
    document.addEventListener('dragenter', handleDragEnterOver, false);
    document.addEventListener('dragover', handleDragEnterOver, false);
    document.addEventListener('dragleave', handleDragLeaveDrop, false);
    document.addEventListener('drop', handleDragLeaveDrop, false);
    document.addEventListener('drop', handleDrop, false);

    // Camera Path Setup
    const controlPoints = [
      new BABYLON.Vector3(1, 0, 0),
      new BABYLON.Vector3(2, 0, 0),
      new BABYLON.Vector3(3, 0, 0),
      new BABYLON.Vector3(4, 0, 0),
      new BABYLON.Vector3(5, 0, 0), // Closing the loop
    ];

    const curve = BABYLON.Curve3.CreateCatmullRomSpline(controlPoints, 100, true);
    const path = curve.getPoints();

    // Remove the green line visualization (as per your request)

    // Variables to manage camera control state
    let scrollPosition = 0;
    let userControl = false;
    let animatingToPath = false;

    // Detect user interaction to enable free camera control
    const pointerObservable = scene.onPointerObservable.add(function (evt) {
      if (
        evt.type === BABYLON.PointerEventTypes.POINTERDOWN ||
        evt.type === BABYLON.PointerEventTypes.POINTERMOVE
      ) {
        userControl = true;
      }
    });

    const keydownHandler = () => {
      userControl = true;
    };
    window.addEventListener('keydown', keydownHandler);

    // Handle scroll events to move the camera along the path or animate it back
    const wheelHandler = (event: WheelEvent) => {
      if (animatingToPath) return;

      if (userControl) {
        // Animate the camera back to the path
        animatingToPath = true;
        userControl = false;

        // Find the closest point on the path
        const closestPointInfo = getClosestPointOnPath(camera.position, path);
        const startIndex = closestPointInfo.index;

        // Create an animation to move the camera back to the path
        const animation = new BABYLON.Animation(
          'cameraAnimation',
          'position',
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [];
        keys.push({ frame: 0, value: camera.position.clone() });
        keys.push({ frame: 60, value: path[startIndex].clone() });

        animation.setKeys(keys);

        camera.animations = [];
        camera.animations.push(animation);

        scene.beginAnimation(camera, 0, 60, false, 1, function () {
          animatingToPath = false;
        });
      } else {
        // Move the camera along the path based on scroll position
        scrollPosition += event.deltaY;

        let t = (scrollPosition % path.length) / path.length;
        if (t < 0) t += 1;

        const index = Math.floor(t * (path.length - 1));
        const nextIndex = (index + 1) % path.length;

        const p1 = path[index];
        const p2 = path[nextIndex];

        const lerpFactor = (t * (path.length - 1)) % 1;

        const newPosition = BABYLON.Vector3.Lerp(p1, p2, lerpFactor);

        camera.position.copyFrom(newPosition);

        // Make the camera look at the center of the scene
        camera.setTarget(BABYLON.Vector3.Zero());
      }
    };
    window.addEventListener('wheel', wheelHandler);

    // Helper function to find the closest point on the path to the camera
    function getClosestPointOnPath(position: BABYLON.Vector3, path: BABYLON.Vector3[]) {
      let minDist = Infinity;
      let closestIndex = 0;

      for (let i = 0; i < path.length; i++) {
        const dist = BABYLON.Vector3.DistanceSquared(position, path[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      }

      return { index: closestIndex, distanceSquared: minDist };
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
      if (isComponentMounted) {
        scene.render();
      }
    });

    // Watch for browser/canvas resize events
    const resizeHandler = () => {
      engine.resize();
    };
    window.addEventListener('resize', resizeHandler);

    // Cleanup on component unmount
    return () => {
      isComponentMounted = false; // Update the flag
      // Remove event listeners
      document.removeEventListener('dragenter', handleDragEnterOver, false);
      document.removeEventListener('dragover', handleDragEnterOver, false);
      document.removeEventListener('dragleave', handleDragLeaveDrop, false);
      document.removeEventListener('drop', handleDragLeaveDrop, false);
      document.removeEventListener('drop', handleDrop, false);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('resize', resizeHandler);

      scene.onPointerObservable.remove(pointerObservable);

      // Dispose of the scene and engine
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <div
        ref={dropOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'none',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '24px',
          zIndex: 10,
        }}
      >
        Drop your splat file here
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
    </div>
  );
};

export default App;
