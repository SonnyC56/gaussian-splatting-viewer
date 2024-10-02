import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import '@babylonjs/core/Loading/sceneLoader';
import Draggable from 'react-draggable';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoTextRef = useRef<HTMLDivElement | null>(null);

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

  // State to manage the loaded model file URL
  const [loadedModelUrl, setLoadedModelUrl] = useState<string | null>(null);

  // State variables for adjustable parameters
  const [scrollSpeed, setScrollSpeed] = useState(0.1);
  const [animationFrames, setAnimationFrames] = useState(120);
  const [cameraMovementSpeed, setCameraMovementSpeed] = useState(0.2);
  const [cameraRotationSensitivity, setCameraRotationSensitivity] = useState(4000);

  // State for scroll percentage
  const [scrollPercentage, setScrollPercentage] = useState(0);

  // State for scroll controls visibility
  const [showScrollControls, setShowScrollControls] = useState(true);

  // State for background color
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');

  // Refs for scene and camera
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);

  // Refs for scroll position and target
  const scrollPositionRef = useRef<number>(0);
  const scrollTargetRef = useRef<number>(0.01); // Start with a small value to kickstart scrolling

  // Refs for path and rotations
  const pathRef = useRef<BABYLON.Vector3[]>([]);
  const rotationsRef = useRef<BABYLON.Quaternion[]>([]);

  // Refs for user control state
  const userControlRef = useRef<boolean>(false);
  const animatingToPathRef = useRef<boolean>(false);

  // New state variables
  const [customModelUrl, setCustomModelUrl] = useState<string>('');
  const [isModelLocal, setIsModelLocal] = useState<boolean>(false);

  // Function to adjust scroll via buttons
  const adjustScroll = (direction: number) => {
    const increment = 10; // Percentage increment
    const pathLength = pathRef.current.length;
    if (pathLength > 1) {
      const scrollIncrement = (pathLength - 1) * (increment / 100) * direction;
      scrollTargetRef.current += scrollIncrement;

      // Clamp scrollTarget to valid range
      if (scrollTargetRef.current < 0) scrollTargetRef.current = 0;
      if (scrollTargetRef.current > pathLength - 1)
        scrollTargetRef.current = pathLength - 1;

      // Reset userControl to allow camera movement along the path
      userControlRef.current = false;
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get the canvas element
    const canvas = canvasRef.current;

    // Generate the Babylon.js 3D engine
    const engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Set the initial background color
    scene.clearColor = BABYLON.Color3.FromHexString(backgroundColor).toColor4(1);

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

    // Adjust camera sensitivity using state variables
    camera.speed = cameraMovementSpeed; // Movement speed
    camera.angularSensibility = cameraRotationSensitivity; // Mouse rotation sensitivity

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
          camera.cameraDirection.z += values.y * 0.05; // Forward/backward
          camera.cameraDirection.x += values.x * 0.05; // Left/right
        });
      }
    });

    // Create a basic light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Variables for Loaded Meshes
    let loadedMeshes: BABYLON.AbstractMesh[] = [];
    let isComponentMounted = true; // Flag to check if component is still mounted

    // Function to add hover interaction
    const addHoverInteraction = (mesh: BABYLON.AbstractMesh) => {
      mesh.actionManager = new BABYLON.ActionManager(scene);

      let tooltip: HTMLDivElement | null = null;
      let pointerMoveHandler: ((evt: PointerEvent) => void) | null = null;

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            // Show tooltip
            tooltip = document.createElement('div');
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

            pointerMoveHandler = function (evt) {
              if (tooltip) {
                tooltip.style.left = evt.clientX + 10 + 'px';
                tooltip.style.top = evt.clientY + 10 + 'px';
              }
            };
            window.addEventListener('pointermove', pointerMoveHandler);
          }
        )
      );

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            // Hide tooltip
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
            }
            if (pointerMoveHandler) {
              window.removeEventListener('pointermove', pointerMoveHandler);
              pointerMoveHandler = null;
            }
          }
        )
      );

      // Cleanup when the mesh is disposed
      mesh.onDisposeObservable.add(() => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
        if (pointerMoveHandler) {
          window.removeEventListener('pointermove', pointerMoveHandler);
          pointerMoveHandler = null;
        }
      });
    };

    // Function to load model file
    const loadModelFile = function (fileOrUrl: File | string) {
      // Dispose of existing meshes
      loadedMeshes.forEach((mesh) => mesh.dispose());
      loadedMeshes = [];

      const loadExtensions = ['.splat', '.ply', '.gltf', '.glb'];

      let fileExtension = '';
      if (typeof fileOrUrl === 'string') {
        fileExtension = '.' + fileOrUrl.split('.').pop()?.toLowerCase();
      } else {
        fileExtension = '.' + fileOrUrl.name.split('.').pop()?.toLowerCase();
      }

      if (!loadExtensions.includes(fileExtension)) {
        alert('Unsupported file format. Please load a .splat, .ply, .gltf, or .glb file.');
        return;
      }

      if (typeof fileOrUrl === 'string') {
        // Load from URL
        BABYLON.SceneLoader.ImportMeshAsync('', '', fileOrUrl, scene)
          .then((result) => {
            if (!isComponentMounted) return; // Prevent setting state if unmounted
            loadedMeshes = result.meshes;
            loadedMeshes.forEach((mesh) => {
              if (mesh instanceof BABYLON.Mesh) {
                mesh.position = BABYLON.Vector3.Zero();
                addHoverInteraction(mesh);
              }
            });

            // Hide the info text
            if (infoTextRef.current) infoTextRef.current.style.display = 'none';

            setIsModelLocal(false); // Model is from URL
          })
          .catch((error) => {
            console.error('Error loading model file:', error);
            alert('Error loading model file: ' + error.message);
          });
      } else {
        // Load from File
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
            loadedMeshes = result.meshes;
            loadedMeshes.forEach((mesh) => {
              if (mesh instanceof BABYLON.Mesh) {
                mesh.position = BABYLON.Vector3.Zero();
                addHoverInteraction(mesh);
              }
            });

            // Hide the info text
            if (infoTextRef.current) infoTextRef.current.style.display = 'none';

            setIsModelLocal(true); // Model is from local file
          })
          .catch((error) => {
            console.error('Error loading model file:', error);
            alert('Error loading model file: ' + error.message);
          });
      }
    };

    // Load model if URL is provided
    if (loadedModelUrl) {
      loadModelFile(loadedModelUrl);
    }

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
        if (ext === 'splat' || ext === 'ply' || ext === 'gltf' || ext === 'glb') {
          loadModelFile(file);
        } else {
          alert('Please drop a .splat, .ply, .gltf, or .glb file.');
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

    let path: BABYLON.Vector3[] = [];

    // Check if we have at least two waypoints
    if (controlPoints.length >= 2) {
      // Create paths for position
      const positionCurve = BABYLON.Curve3.CreateCatmullRomSpline(
        controlPoints,
        (waypoints.length - 1) * 10,
        false
      );
      path = positionCurve.getPoints();
    } else if (controlPoints.length === 1) {
      // If only one waypoint, set path to the single point
      path = [controlPoints[0]];
    } else {
      // No waypoints, path remains empty
      path = [];
    }

    // Store path and rotations in refs
    pathRef.current = path;
    rotationsRef.current = rotations;

    // Detect user interaction to enable free camera control
    const pointerObservable = scene.onPointerObservable.add(function (evt) {
      if (
        evt.type === BABYLON.PointerEventTypes.POINTERDOWN ||
        evt.type === BABYLON.PointerEventTypes.POINTERMOVE
      ) {
        userControlRef.current = true;

        // Switch to Euler angles (rotation) when user takes control
        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          (camera as any).rotationQuaternion = null; // Use type assertion to assign null
        }
      }
    });

    const keydownHandler = () => {
      userControlRef.current = true;

      // Switch to Euler angles (rotation) when user takes control
      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        (camera as any).rotationQuaternion = null; // Use type assertion to assign null
      }
    };
    window.addEventListener('keydown', keydownHandler);

    // Handle scroll events to move the camera along the path or animate it back
    const wheelHandler = (event: WheelEvent) => {
      if (animatingToPathRef.current) return;

      if (userControlRef.current) {
        // Animate the camera back to the path
        animatingToPathRef.current = true;
        userControlRef.current = false;

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
          pathRef.current
        );
        const startIndex = closestPointInfo.index;

        // Compute the desired position
        const targetPosition = pathRef.current[startIndex];

        // Get the corresponding rotation
        let targetRotation = camera.rotationQuaternion.clone();
        if (rotations.length >= 2 && pathRef.current.length >= 2) {
          const t = startIndex / (pathRef.current.length - 1);
          const totalSegments = waypoints.length - 1;
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(
            segmentIndex,
            totalSegments - 1
          );
          const lerpFactor = segmentT - clampedSegmentIndex;

          const r1 = rotations[clampedSegmentIndex];
          const r2 =
            rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];
          targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);
        } else if (rotations.length === 1) {
          targetRotation = rotations[0];
        }

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
        positionKeys.push({ frame: animationFrames, value: targetPosition.clone() });

        positionAnimation.setKeys(positionKeys);

        // Add easing function
        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        positionAnimation.setEasingFunction(easingFunction);

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
          { frame: animationFrames, value: targetRotation },
        ]);

        rotationAnimation.setEasingFunction(easingFunction);

        // Add animations to the camera
        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        scene.beginAnimation(camera, 0, animationFrames, false, 1, function () {
          animatingToPathRef.current = false;
          // Update scrollPosition to match the camera's position on the path
          scrollPositionRef.current = startIndex;
          scrollTargetRef.current = scrollPositionRef.current;
        });
      } else {
        // Adjust scrollTarget instead of scrollPosition directly
        scrollTargetRef.current += event.deltaY * scrollSpeed;

        // Clamp scrollTarget to the path length
        if (scrollTargetRef.current < 0) scrollTargetRef.current = 0;
        if (scrollTargetRef.current > pathRef.current.length - 1)
          scrollTargetRef.current = pathRef.current.length - 1;
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

    // Prevent default scrolling behavior on the canvas
    const preventCanvasScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventCanvasTouchMove = (event: Event) => {
      event.preventDefault();
    };

    canvas.addEventListener('wheel', preventCanvasScroll, { passive: false });
    canvas.addEventListener('touchmove', preventCanvasTouchMove, { passive: false });

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
      if (isComponentMounted) {
        // Smoothly interpolate scrollPosition towards scrollTarget
        const scrollInterpolationSpeed = 0.1; // Adjust for desired smoothness
        scrollPositionRef.current +=
          (scrollTargetRef.current - scrollPositionRef.current) *
          scrollInterpolationSpeed;

        // Ensure scrollPosition stays within bounds
        if (scrollPositionRef.current < 0) scrollPositionRef.current = 0;
        if (scrollPositionRef.current > pathRef.current.length - 1)
          scrollPositionRef.current = pathRef.current.length - 1;

        // Update scroll percentage
        const newScrollPercentage =
          pathRef.current.length > 1
            ? (scrollPositionRef.current / (pathRef.current.length - 1)) * 100
            : 0;
        setScrollPercentage(newScrollPercentage);

        // Only update camera position if not animating back to path
        if (!userControlRef.current && pathRef.current.length >= 1) {
          // Calculate t based on scrollPosition
          const t =
            scrollPositionRef.current / (pathRef.current.length - 1 || 1); // Avoid division by zero

          // Calculate segment index and lerp factor
          const totalSegments = waypoints.length - 1;
          if (totalSegments >= 1) {
            const segmentT = t * totalSegments;
            const segmentIndex = Math.floor(segmentT);
            const clampedSegmentIndex = Math.min(
              segmentIndex,
              totalSegments - 1
            );
            const lerpFactor = segmentT - clampedSegmentIndex;

            // Interpolate position along the path
            const newPosition =
              pathRef.current[Math.floor(scrollPositionRef.current)];

            // Interpolate rotations
            const r1 = rotationsRef.current[clampedSegmentIndex];
            const r2 =
              rotationsRef.current[clampedSegmentIndex + 1] ||
              rotationsRef.current[rotationsRef.current.length - 1];

            const newRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

            camera.position.copyFrom(newPosition);

            // Set the camera's rotationQuaternion
            if (!camera.rotationQuaternion) {
              camera.rotationQuaternion = new BABYLON.Quaternion();
            }
            camera.rotationQuaternion.copyFrom(newRotation);
          } else if (rotationsRef.current.length === 1) {
            // Only one waypoint
            camera.position.copyFrom(pathRef.current[0]);
            if (!camera.rotationQuaternion) {
              camera.rotationQuaternion = new BABYLON.Quaternion();
            }
            camera.rotationQuaternion.copyFrom(rotationsRef.current[0]);
          }
        }

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

      // Remove the event listeners from the canvas
      canvas.removeEventListener('wheel', preventCanvasScroll);
      canvas.removeEventListener('touchmove', preventCanvasTouchMove);

      // Dispose of the scene and engine
      scene.dispose();
      engine.dispose();
    };
  }, [
    waypoints,
    loadedModelUrl,
    scrollSpeed,
    animationFrames,
    cameraMovementSpeed,
    cameraRotationSensitivity,
    backgroundColor, // Include backgroundColor in dependencies
  ]); // Re-run effect when dependencies change

  // Effect to update background color when it changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.clearColor = BABYLON.Color3.FromHexString(backgroundColor).toColor4(1);
    }
  }, [backgroundColor]);

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

  // List of default models
  const baseURL = 'https://assets.babylonjs.com/splats/';
  const models = [
    'gs_Sqwakers_trimed.splat',
    'gs_Skull.splat',
    'gs_Plants.splat',
    'gs_Fire_Pit.splat',
  ];

  // Function to handle exporting the scene
  const handleExport = async () => {
    let modelUrl = loadedModelUrl || customModelUrl;

    if (isModelLocal) {
      // Prompt the user for a hosted URL
      modelUrl = prompt(
        'Please provide a URL where the model is hosted:',
        ''
      ) ?? '';
      if (!modelUrl) {
        alert('Export cancelled. You must provide a URL for the model.');
        return;
      }
    }

    // Ask the user whether to include the controls UI
    const includeUI = window.confirm(
      'Do you want to include the controls UI in the exported HTML?'
    );

    // Generate the HTML content
    const htmlContent = generateExportedHTML(modelUrl, includeUI);

    // Create a blob and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported_scene.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to generate the exported HTML
  const generateExportedHTML = (modelUrl: string, includeUI: boolean) => {
    // Prepare the waypoints and rotations data
    const waypointsData = waypoints.map((wp) => ({
      x: wp.x,
      y: wp.y,
      z: wp.z,
      rotation: {
        x: wp.rotation.x,
        y: wp.rotation.y,
        z: wp.rotation.z,
        w: wp.rotation.w,
      },
    }));

    // Generate the HTML content
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Scene</title>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
    #renderCanvas { width: 100%; height: 100%; touch-action: none; }
    ${
      includeUI
        ? `
    .ui-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(0,0,0,0.7);
      padding: 10px;
      border-radius: 5px;
      color: white;
      z-index: 10;
    }
    `
        : ''
    }
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  ${
    includeUI
      ? `
  <div class="ui-overlay">
    <p>Use W/A/S/D to move, mouse to look around.</p>
    <p>Scroll to move along the path.</p>
  </div>
  `
      : ''
  }
  <!-- Babylon.js CDN -->
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
  <script>
    // Get the canvas element
    const canvas = document.getElementById('renderCanvas');

    // Generate the Babylon.js 3D engine
    const engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    const scene = new BABYLON.Scene(engine);

    // Set the background color
    scene.clearColor = BABYLON.Color3.FromHexString('${backgroundColor}').toColor4(1);

    // Create a universal camera and position it
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(${waypoints[0].x}, ${waypoints[0].y}, ${waypoints[0].z}),
      scene
    );
    camera.attachControl(canvas, true);

    // Adjust camera sensitivity
    camera.speed = ${cameraMovementSpeed};
    camera.angularSensibility = ${cameraRotationSensitivity};

    // Enable WASD keys for movement
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    // Create a basic light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Variables to manage camera control state
    let userControl = false;
    let animatingToPath = false;

    // Variables for scroll position and target
    let scrollPosition = 0;
    let scrollTarget = 0.01; // Start with a small value to enable scrolling

    // Function to add hover interaction
    const addHoverInteraction = (mesh) => {
      mesh.actionManager = new BABYLON.ActionManager(scene);

      let tooltip = null;
      let pointerMoveHandler = null;

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            // Show tooltip
            tooltip = document.createElement('div');
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

            pointerMoveHandler = function (evt) {
              if (tooltip) {
                tooltip.style.left = evt.clientX + 10 + 'px';
                tooltip.style.top = evt.clientY + 10 + 'px';
              }
            };
            window.addEventListener('pointermove', pointerMoveHandler);
          }
        )
      );

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            // Hide tooltip
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
            }
            if (pointerMoveHandler) {
              window.removeEventListener('pointermove', pointerMoveHandler);
              pointerMoveHandler = null;
            }
          }
        )
      );

      // Cleanup when the mesh is disposed
      mesh.onDisposeObservable.add(() => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
        if (pointerMoveHandler) {
          window.removeEventListener('pointermove', pointerMoveHandler);
          pointerMoveHandler = null;
        }
      });
    };

    // Load the model file
    BABYLON.SceneLoader.ImportMeshAsync('', '', '${modelUrl}', scene)
      .then((result) => {
        const loadedMeshes = result.meshes;
        loadedMeshes.forEach((mesh) => {
          if (mesh instanceof BABYLON.Mesh) {
            mesh.position = BABYLON.Vector3.Zero();
            addHoverInteraction(mesh);
          }
        });
      })
      .catch((error) => {
        console.error('Error loading model file:', error);
        alert('Error loading model file: ' + error.message);
      });

    // Prepare waypoints and rotations
    const waypoints = ${JSON.stringify(waypointsData)};
    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );
    const rotations = waypoints.map(
      (wp) => new BABYLON.Quaternion(wp.rotation.x, wp.rotation.y, wp.rotation.z, wp.rotation.w)
    );

    let path = [];

    if (controlPoints.length >= 2) {
      const positionCurve = BABYLON.Curve3.CreateCatmullRomSpline(
        controlPoints,
        (waypoints.length - 1) * 10,
        false
      );
      path = positionCurve.getPoints();
    } else if (controlPoints.length === 1) {
      path = [controlPoints[0]];
    }

    // Handle scroll events
    window.addEventListener('wheel', (event) => {
      if (animatingToPath) return;

      if (userControl) {
        animatingToPath = true;
        userControl = false;

        if (!camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
          );
          camera.rotation.set(0, 0, 0);
        }

        const closestPointInfo = getClosestPointOnPath(camera.position, path);
        const startIndex = closestPointInfo.index;

        const targetPosition = path[startIndex];

        let targetRotation = camera.rotationQuaternion.clone();
        if (rotations.length >= 2 && path.length >= 2) {
          const t = startIndex / (path.length - 1);
          const totalSegments = waypoints.length - 1;
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          const r1 = rotations[clampedSegmentIndex];
          const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];
          targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);
        } else if (rotations.length === 1) {
          targetRotation = rotations[0];
        }

        const positionAnimation = new BABYLON.Animation(
          'cameraPositionAnimation',
          'position',
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const positionKeys = [];
        positionKeys.push({ frame: 0, value: camera.position.clone() });
        positionKeys.push({ frame: ${animationFrames}, value: targetPosition.clone() });

        positionAnimation.setKeys(positionKeys);

        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        positionAnimation.setEasingFunction(easingFunction);

        const rotationAnimation = new BABYLON.Animation(
          'cameraRotationAnimation',
          'rotationQuaternion',
          60,
          BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const currentRotation = camera.rotationQuaternion.clone();
        rotationAnimation.setKeys([
          { frame: 0, value: currentRotation },
          { frame: ${animationFrames}, value: targetRotation },
        ]);

        rotationAnimation.setEasingFunction(easingFunction);

        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        scene.beginAnimation(camera, 0, ${animationFrames}, false, 1, function () {
          animatingToPath = false;
          scrollPosition = startIndex;
          scrollTarget = scrollPosition;
        });
      } else {
        scrollTarget += event.deltaY * ${scrollSpeed};

        if (scrollTarget < 0) scrollTarget = 0;
        if (scrollTarget > path.length - 1) scrollTarget = path.length - 1;
      }
    });

    // Helper function
    function getClosestPointOnPath(position, path) {
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

    // Render loop
    engine.runRenderLoop(function () {
      // Smoothly interpolate scrollPosition towards scrollTarget
      const scrollInterpolationSpeed = 0.1;
      scrollPosition += (scrollTarget - scrollPosition) * scrollInterpolationSpeed;

      if (scrollPosition < 0) scrollPosition = 0;
      if (scrollPosition > path.length - 1) scrollPosition = path.length - 1;

      if (!userControl && path.length >= 1) {
        const t = scrollPosition / (path.length - 1 || 1);

        const totalSegments = waypoints.length - 1;
        if (totalSegments >= 1) {
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          const newPosition = path[Math.floor(scrollPosition)];

          const r1 = rotations[clampedSegmentIndex];
          const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];

          const newRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

          camera.position.copyFrom(newPosition);

          if (!camera.rotationQuaternion) {
            camera.rotationQuaternion = new BABYLON.Quaternion();
          }
          camera.rotationQuaternion.copyFrom(newRotation);
        } else if (rotations.length === 1) {
          camera.position.copyFrom(path[0]);
          if (!camera.rotationQuaternion) {
            camera.rotationQuaternion = new BABYLON.Quaternion();
          }
          camera.rotationQuaternion.copyFrom(rotations[0]);
        }
      }

      scene.render();
    });

    // Resize
    window.addEventListener('resize', function () {
      engine.resize();
    });

    // User interaction detection
    scene.onPointerObservable.add(function (evt) {
      if (
        evt.type === BABYLON.PointerEventTypes.POINTERDOWN ||
        evt.type === BABYLON.PointerEventTypes.POINTERMOVE
      ) {
        userControl = true;

        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          camera.rotationQuaternion = null;
        }
      }
    });

    window.addEventListener('keydown', function () {
      userControl = true;

      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        camera.rotationQuaternion = null;
      }
    });
  </script>
</body>
</html>
    `;
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Drag and Drop Info Text */}
      <div
        ref={infoTextRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '24px',
          textAlign: 'center',
          zIndex: 5,
        }}
      >
        Please drag and drop a <br /> .splat, .ply, .gltf, or .glb file to load.
      </div>
      {/* Waypoint Input Form */}
      {/* ... existing UI components ... */}

      {/* Include all existing UI components as before */}
      {/* Waypoint Input Form */}
      <Draggable handle=".handle">
        <div
          className="handle"
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
            cursor: 'move',
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
      </Draggable>
      {/* Controls Info Section */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            zIndex: 10,
            cursor: 'move',
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
      </Draggable>
      {/* UI Controls for Parameters */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: 'absolute',
            bottom: '10px', // Moved to bottom left corner
            left: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            zIndex: 10,
            cursor: 'move',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>Adjust Parameters</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Scroll Speed:
              <input
                type="number"
                step="0.01"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Animation Frames:
              <input
                type="number"
                step="1"
                value={animationFrames}
                onChange={(e) =>
                  setAnimationFrames(parseInt(e.target.value, 10))
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Camera Speed:
              <input
                type="number"
                step="0.01"
                value={cameraMovementSpeed}
                onChange={(e) =>
                  setCameraMovementSpeed(parseFloat(e.target.value))
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Camera Rotation Sensitivity:
              <input
                type="number"
                step="1"
                value={cameraRotationSensitivity}
                onChange={(e) =>
                  setCameraRotationSensitivity(parseFloat(e.target.value))
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
          </div>
        </div>
      </Draggable>
      {/* Scroll Controls */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: 'absolute',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            zIndex: 10,
            cursor: 'move',
          }}
        >
          <button
            onClick={() => setShowScrollControls(!showScrollControls)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            {showScrollControls ? 'Hide Scroll Controls' : 'Show Scroll Controls'}
          </button>
          {showScrollControls && (
            <div style={{ marginTop: '10px' }}>
              <p>Scroll Position: {Math.round(scrollPercentage)}%</p>
              <button
                onClick={() => adjustScroll(-1)}
                style={{
                  marginRight: '5px',
                  padding: '5px 10px',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Backward
              </button>
              <button
                onClick={() => adjustScroll(1)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Forward
              </button>
            </div>
          )}
        </div>
      </Draggable>
      {/* Splat Loading Buttons with Custom URL Input */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: 'absolute',
            top: '10px',
            left: '250px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            zIndex: 10,
            cursor: 'move',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>Load Splats</h3>
          {models.map((splat, index) => (
            <button
              key={index}
              onClick={() => {
                const url = baseURL + splat;
                setLoadedModelUrl(url);
                if (infoTextRef.current) infoTextRef.current.style.display = 'none';
                setIsModelLocal(false); // Model is from URL
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
          {/* Custom URL Input */}
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Enter custom splat URL"
              value={customModelUrl}
              onChange={(e) => setCustomModelUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '5px',
                marginBottom: '5px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => {
                if (customModelUrl) {
                  setLoadedModelUrl(customModelUrl);
                  if (infoTextRef.current) infoTextRef.current.style.display = 'none';
                  setIsModelLocal(false); // Model is from URL
                } else {
                  alert('Please enter a valid URL.');
                }
              }}
              style={{
                width: '100%',
                padding: '5px 10px',
                backgroundColor: 'green',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Load Custom Splat
            </button>
          </div>
        </div>
      </Draggable>

      {/* Export Button */}
      <button
        onClick={handleExport}
        style={{
          position: 'absolute',
          top: '10px',
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

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
    </div>
  );
};

export default App;
