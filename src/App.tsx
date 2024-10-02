import React, { useRef, useEffect } from 'react';
import './App.css';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import '@babylonjs/core/Loading/sceneLoader';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropOverlayRef = useRef<HTMLDivElement | null>(null);
  const infoTextRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get the canvas element
    const canvas = canvasRef.current;

    // Generate the Babylon.js 3D engine
    const engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    const scene = new BABYLON.Scene(engine);

    // Check for WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          // Enable WebXR support
          scene.createDefaultXRExperienceAsync().then((xrExperience) => {
            console.log('WebXR enabled');
          });
        } else {
          console.warn('immersive-vr mode is not supported in this browser.');
        }
      });
    } else {
      console.warn('WebXR is not supported in this browser.');
    }

    // Create a universal camera and position it
    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, -10), scene);
    camera.rotationQuaternion = new BABYLON.Quaternion();
    camera.attachControl(canvas, true);

    // Enable WASD keys for movement
    camera.keysUp.push(87);    // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68); // D

    // Enable gamepad control
    const gamepadManager = scene.gamepadManager;
    gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
      console.log("Gamepad connected: " + gamepad.id);
      if (gamepad instanceof BABYLON.GenericPad) {
        // Handle standard gamepads
        gamepad.onleftstickchanged((values) => {
          camera.cameraDirection.z += values.y * 0.1; // Forward/backward
          camera.cameraDirection.x += values.x * 0.1; // Left/right
        });
      }
    });

    // Create a basic light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

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
          if (infoTextRef.current) infoTextRef.current.style.display = 'none';
        })
        .catch((error) => {
          console.error('Error loading splat file:', error);
          alert('Error loading splat file: ' + error.message);
        });
    };

    // Drag-and-Drop Functionality
    const dropOverlay = dropOverlayRef.current;
    const infoText = infoTextRef.current;

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
          if (infoText) infoText.style.display = 'none';
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
      new BABYLON.Vector3(0, 0, -10),
      new BABYLON.Vector3(0, 0, -8),
      new BABYLON.Vector3(0, 0, -6),
      new BABYLON.Vector3(0, 0, -4),
      new BABYLON.Vector3(0, 0, -2),
    ];

    const curve = BABYLON.Curve3.CreateCatmullRomSpline(controlPoints, 100, false); // Open spline
    const path = curve.getPoints();

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

        // Compute the desired position and rotation
        const targetPosition = path[startIndex];

        // Compute the tangent at the closest point
        let tangent: BABYLON.Vector3;
        if (startIndex < path.length - 1) {
          tangent = path[startIndex + 1].subtract(path[startIndex]).normalize();
        } else if (startIndex > 0) {
          tangent = path[startIndex].subtract(path[startIndex - 1]).normalize();
        } else {
          tangent = new BABYLON.Vector3(0, 0, 1);
        }

        // Compute the desired rotation quaternion
        const desiredRotation = BABYLON.Quaternion.FromLookDirectionLH(tangent, BABYLON.Vector3.Up());

        // Create animations for position and rotationQuaternion
        const positionAnimation = new BABYLON.Animation(
          'cameraPositionAnimation',
          'position',
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const rotationAnimation = new BABYLON.Animation(
          'cameraRotationAnimation',
          'rotationQuaternion',
          60,
          BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const positionKeys = [
          { frame: 0, value: camera.position.clone() },
          { frame: 60, value: targetPosition.clone() }
        ];

        const rotationKeys = [
          { frame: 0, value: camera.rotationQuaternion.clone() },
          { frame: 60, value: desiredRotation }
        ];

        positionAnimation.setKeys(positionKeys);
        rotationAnimation.setKeys(rotationKeys);

        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        scene.beginAnimation(camera, 0, 60, false, 1, function () {
          animatingToPath = false;

          // Update scrollPosition to match the camera's position on the path
          scrollPosition = startIndex;
        });
      } else {
        // Move the camera along the path based on scroll position
        scrollPosition += event.deltaY;

        // Clamp scrollPosition to the path length
        if (scrollPosition < 0) scrollPosition = 0;
        if (scrollPosition > path.length - 1) scrollPosition = path.length - 1;

        const t = scrollPosition / (path.length - 1);

        const index = Math.floor(t * (path.length - 1));
        const nextIndex = Math.min(index + 1, path.length - 1);

        const p1 = path[index];
        const p2 = path[nextIndex];

        const lerpFactor = (t * (path.length - 1)) % 1;

        const newPosition = BABYLON.Vector3.Lerp(p1, p2, lerpFactor);

        camera.position.copyFrom(newPosition);

        // Compute tangent vector
        const tangent = p2.subtract(p1).normalize();

        // Compute rotation quaternion
        const desiredRotation = BABYLON.Quaternion.FromLookDirectionLH(tangent, BABYLON.Vector3.Up());

        camera.rotationQuaternion.copyFrom(desiredRotation);
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

    // Synchronize rotationQuaternion with rotation during user control
    camera.onAfterCheckInputsObservable.add(() => {
      if (camera.rotationQuaternion) {
        BABYLON.Quaternion.RotationYawPitchRollToRef(
          camera.rotation.y,
          camera.rotation.x,
          camera.rotation.z,
          camera.rotationQuaternion
        );
        camera.rotation.set(0, 0, 0);
      }
    });

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
      <div
        ref={infoTextRef}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          fontSize: '18px',
          zIndex: 5,
        }}
      >
        Please drag and drop a .splat or .ply file to load.
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
    </div>
  );
};

export default App;
