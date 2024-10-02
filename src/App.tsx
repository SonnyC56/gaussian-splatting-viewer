import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import '@babylonjs/core/Loading/sceneLoader';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State to hold waypoint coordinates and rotations
  const [waypoints, setWaypoints] = useState<
    { x: number; y: number; z: number; rotation: BABYLON.Quaternion }[]
  >([
    {
      x: 0,
      y: 0,
      z: -10,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0, 0),
    },
    {
      x: 0,
      y: 0,
      z: -8,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.1, 0),
    },
    {
      x: 0,
      y: 0,
      z: -6,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.2, 0),
    },
    {
      x: 0,
      y: 0,
      z: -4,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.3, 0),
    },
    {
      x: 0,
      y: 0,
      z: -2,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.4, 0),
    },
  ]);

  // State to manage the visibility of the controls info section
  const [showControlsInfo, setShowControlsInfo] = useState(true);

  // State to manage the loaded splat file URL
  const [loadedSplatUrl, setLoadedSplatUrl] = useState<string | null>(null);

  // State to manage the scene and camera references
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get the canvas element
    const canvas = canvasRef.current;

    // Generate the Babylon.js 3D engine
    const engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Check for WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          // Enable WebXR support
          scene.createDefaultXRExperienceAsync().then(() => {
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
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(waypoints[0].x, waypoints[0].y, waypoints[0].z),
      scene
    );
    cameraRef.current = camera;
    camera.attachControl(canvas, true);

    // Adjust camera sensitivity
    camera.speed = 0.2; // Slows down movement speed
    camera.angularSensibility = 4000; // Increases mouse rotation sensitivity (less sensitive)

    // Enable WASD keys for movement
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    // Enable gamepad control
    const gamepadManager = scene.gamepadManager;
    gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
      console.log('Gamepad connected: ' + gamepad.id);
      if (gamepad instanceof BABYLON.GenericPad) {
        // Handle standard gamepads
        gamepad.onleftstickchanged((values) => {
          camera.cameraDirection.z += values.y * 0.05; // Forward/backward (reduced speed)
          camera.cameraDirection.x += values.x * 0.05; // Left/right (reduced speed)
        });
      }
    });

    // Create a basic light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Variables for Gaussian Splatting Mesh
    let gsMesh: BABYLON.AbstractMesh | null = null;
    let isComponentMounted = true; // Flag to check if component is still mounted

    // Function to load Gaussian Splatting file
    const loadSplatFile = function (fileOrUrl: File | string) {
      // Dispose of existing mesh
      if (gsMesh) {
        gsMesh.dispose();
        gsMesh = null;
      }

      if (typeof fileOrUrl === 'string') {
        // Load from URL
        BABYLON.SceneLoader.ImportMeshAsync(
          '',
          '',
          fileOrUrl,
          scene
        )
          .then((result) => {
            if (!isComponentMounted) return; // Prevent setting state if unmounted
            gsMesh = result.meshes[0];
            gsMesh.position = BABYLON.Vector3.Zero();

            // Add hover interaction to the mesh
            addHoverInteraction(gsMesh);
          })
          .catch((error) => {
            console.error('Error loading splat file:', error);
            alert('Error loading splat file: ' + error.message);
          });
      } else {
        // Load from File
        const fileExtension = '.' + fileOrUrl.name.split('.').pop()?.toLowerCase();

        // Pass the File object directly to the loader
        BABYLON.SceneLoader.ImportMeshAsync(
          null,
          '',
          fileOrUrl,
          scene,
          null,
          fileExtension
        )
          .then((result) => {
            if (!isComponentMounted) return; // Prevent setting state if unmounted
            gsMesh = result.meshes[0];
            gsMesh.position = BABYLON.Vector3.Zero();

            // Add hover interaction to the mesh
            addHoverInteraction(gsMesh);
          })
          .catch((error) => {
            console.error('Error loading splat file:', error);
            alert('Error loading splat file: ' + error.message);
          });
      }
    };

    // Load splat if URL is provided
    if (loadedSplatUrl) {
      loadSplatFile(loadedSplatUrl);
    }

    // Function to add hover interaction
    const addHoverInteraction = (mesh: BABYLON.AbstractMesh) => {
      mesh.actionManager = new BABYLON.ActionManager(scene);

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            // Show tooltip
            const tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.innerText = 'Hot spot example';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(0,0,0,0.7)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px';
            tooltip.style.borderRadius = '5px';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '15';
            document.body.appendChild(tooltip);

            scene.onPointerMove = function (evt) {
              if (tooltip) {
                tooltip.style.left = evt.clientX + 10 + 'px';
                tooltip.style.top = evt.clientY + 10 + 'px';
              }
            };
          }
        )
      );

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            // Hide tooltip
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
              tooltip.remove();
            }
            scene.onPointerMove = undefined; // Assign undefined to remove the handler
          }
        )
      );
    };

    // Drag-and-Drop Functionality

    // Event handlers
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
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
    document.addEventListener('dragover', preventDefault, false);
    document.addEventListener('drop', handleDrop, false);

    // Camera Path Setup
    // Convert waypoints to BABYLON.Vector3 and rotations
    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );
    const rotations = waypoints.map((wp) => wp.rotation);

    // Create paths for position and rotation
    const positionCurve = BABYLON.Curve3.CreateCatmullRomSpline(
      controlPoints,
      (waypoints.length - 1) * 10,
      false
    );
    const path = positionCurve.getPoints();

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

        // Switch to Euler angles (rotation) when user takes control
        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          (camera as any).rotationQuaternion = null; // Use type assertion to assign null
        }
      }
    });

    const keydownHandler = () => {
      userControl = true;

      // Switch to Euler angles (rotation) when user takes control
      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        (camera as any).rotationQuaternion = null; // Use type assertion to assign null
      }
    };
    window.addEventListener('keydown', keydownHandler);

    // Handle scroll events to move the camera along the path or animate it back
    const wheelHandler = (event: WheelEvent) => {
      if (animatingToPath) return;

      if (userControl) {
        // Animate the camera back to the path
        animatingToPath = true;
        userControl = false;

        // Ensure rotationQuaternion is set
        if (!camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
          );
          camera.rotation.set(0, 0, 0);
        }

        // Find the closest point on the path
        const closestPointInfo = getClosestPointOnPath(
          camera.position,
          path
        );
        const startIndex = closestPointInfo.index;

        // Compute the desired position
        const targetPosition = path[startIndex];

        // Get the corresponding rotation
        const t = startIndex / (path.length - 1);
        const totalSegments = waypoints.length - 1;
        const segmentT = t * totalSegments;
        const segmentIndex = Math.floor(segmentT);
        const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
        const lerpFactor = segmentT - clampedSegmentIndex;

        const r1 = rotations[clampedSegmentIndex];
        const r2 = rotations[clampedSegmentIndex + 1];
        const targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

        // Create an animation for position
        const positionAnimation = new BABYLON.Animation(
          'cameraPositionAnimation',
          'position',
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const positionKeys = [];
        positionKeys.push({ frame: 0, value: camera.position.clone() });
        positionKeys.push({ frame: 60, value: targetPosition.clone() });

        positionAnimation.setKeys(positionKeys);

        // Create an animation for rotationQuaternion
        const rotationAnimation = new BABYLON.Animation(
          'cameraRotationAnimation',
          'rotationQuaternion',
          60,
          BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const currentRotation = camera.rotationQuaternion!.clone();
        rotationAnimation.setKeys([
          { frame: 0, value: currentRotation },
          { frame: 60, value: targetRotation },
        ]);

        // Add animations to the camera
        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        scene.beginAnimation(camera, 0, 60, false, 1, function () {
          animatingToPath = false;
          // Update scrollPosition to match the camera's position on the path
          scrollPosition = startIndex;
        });
      } else {
        // Ensure rotationQuaternion is set
        if (!camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
          );
          camera.rotation.set(0, 0, 0);
        }

        // Move the camera along the path based on scroll position
        scrollPosition += event.deltaY * 0.1;

        // Clamp scrollPosition to the path length
        if (scrollPosition < 0) scrollPosition = 0;
        if (scrollPosition > path.length - 1)
          scrollPosition = path.length - 1;

        // Calculate t based on scrollPosition
        const t = scrollPosition / (path.length - 1);

        // Calculate segment index and lerp factor
        const totalSegments = waypoints.length - 1;
        if (totalSegments <= 0) return; // Need at least two waypoints

        const segmentT = t * totalSegments;
        const segmentIndex = Math.floor(segmentT);
        const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
        const lerpFactor = segmentT - clampedSegmentIndex;

        // Interpolate position along the path
        const newPosition = path[Math.floor(scrollPosition)];

        // Interpolate rotations
        const r1 = rotations[clampedSegmentIndex];
        const r2 = rotations[clampedSegmentIndex + 1];

        const newRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

        camera.position.copyFrom(newPosition);

        // Set the camera's rotationQuaternion
        camera.rotationQuaternion!.copyFrom(newRotation);
      }
    };
    window.addEventListener('wheel', wheelHandler);

    // Helper function to find the closest point on the path to the camera
    function getClosestPointOnPath(
      position: BABYLON.Vector3,
      path: BABYLON.Vector3[]
    ) {
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
      document.removeEventListener('dragover', preventDefault, false);
      document.removeEventListener('drop', handleDrop, false);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('resize', resizeHandler);

      scene.onPointerObservable.remove(pointerObservable);

      // Dispose of the scene and engine
      scene.dispose();
      engine.dispose();
    };
  }, [waypoints, loadedSplatUrl]); // Re-run effect when waypoints or loaded splat URL change

  // Function to handle waypoint input changes
  const handleWaypointChange = (
    index: number,
    axis: 'x' | 'y' | 'z',
    value: string
  ) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index][axis] = parseFloat(value);
    setWaypoints(newWaypoints);
  };

  // Function to add a new waypoint
  const addWaypoint = () => {
    const camera = cameraRef.current;
    if (camera) {
      const newWaypoint = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        rotation: camera.rotationQuaternion
          ? camera.rotationQuaternion.clone()
          : BABYLON.Quaternion.FromEulerAngles(
              camera.rotation.x,
              camera.rotation.y,
              camera.rotation.z
            ),
      };
      setWaypoints([...waypoints, newWaypoint]);
    }
  };

  // Function to remove a waypoint
  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  // List of default splats
  const baseURL = 'https://assets.babylonjs.com/splats/';
  const splats = [
    'gs_Sqwakers_trimed.splat',
    'gs_Skull.splat',
    'gs_Plants.splat',
    'gs_Fire_Pit.splat',
  ];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Waypoint Input Form */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          zIndex: 10,
          maxHeight: '50vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>
          Edit Waypoints
        </h3>
        {waypoints.map((wp, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <span>Waypoint {index + 1}: </span>
            <label>
              X:
              <input
                type="number"
                step="0.1"
                value={wp.x}
                onChange={(e) =>
                  handleWaypointChange(index, 'x', e.target.value)
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
            <label style={{ marginLeft: '10px' }}>
              Y:
              <input
                type="number"
                step="0.1"
                value={wp.y}
                onChange={(e) =>
                  handleWaypointChange(index, 'y', e.target.value)
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
            <label style={{ marginLeft: '10px' }}>
              Z:
              <input
                type="number"
                step="0.1"
                value={wp.z}
                onChange={(e) =>
                  handleWaypointChange(index, 'z', e.target.value)
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
            {waypoints.length > 1 && (
              <button
                onClick={() => removeWaypoint(index)}
                style={{
                  marginLeft: '10px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addWaypoint}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Add Waypoint at Current Position
        </button>
      </div>
      {/* Controls Info Section */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setShowControlsInfo(!showControlsInfo)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {showControlsInfo ? 'Hide Controls' : 'Show Controls'}
        </button>
        {showControlsInfo && (
          <div style={{ marginTop: '10px' }}>
            <p>
              <strong>Controls:</strong>
            </p>
            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
              <li>W/A/S/D: Move camera</li>
              <li>Mouse: Look around</li>
              <li>Scroll: Move along path</li>
              <li>Drag and drop a .splat or .ply file to load</li>
              <li>Click "Add Waypoint at Current Position" to add waypoint</li>
            </ul>
          </div>
        )}
      </div>
      {/* Splat Loading Buttons */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          zIndex: 10,
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Load Default Splats</h3>
        {splats.map((splat, index) => (
          <button
            key={index}
            onClick={() => {
              const url = baseURL + splat;
              setLoadedSplatUrl(url);
            }}
            style={{
              display: 'block',
              marginBottom: '5px',
              padding: '5px 10px',
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {splat}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
    </div>
  );
};

export default App;
