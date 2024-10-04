// src/App.tsx
import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import Cookies from "js-cookie"; // Importing js-cookie

import WaypointControls from "./components/WaypointControls";
import ParameterControls from "./components/ParameterControls";
import ScrollControls from "./components/ScrollControls";
import Controls from "./components/Controls";
import LoadSaveExportMenu from "./components/LoadSaveExportMenu";
import BackgroundColorSelector from "./components/BackgroundColorSelector";
import GitHubLink from "./components/GithubCTA";
import InfoPopup from "./components/InfoPopup"; // Importing InfoPopup

import { generateExportedHTML } from "./tools/GenerateExportedHtml";
import loadModelFile from "./tools/LoadModelFile";
import { wheelHandler } from "./tools/WheelHandler";
import WaypointVisualizer from './components/WaypointVisualizer';

// Define cookie keys
const COOKIE_KEYS = {
  scrollSpeed: "scrollSpeed",
  animationFrames: "animationFrames",
  cameraMovementSpeed: "cameraMovementSpeed",
  cameraRotationSensitivity: "cameraRotationSensitivity",
  backgroundColor: "backgroundColor",
  // Add more keys if needed
};

// Define default settings
const DEFAULT_SETTINGS = {
  scrollSpeed: 0.1,
  animationFrames: 120,
  cameraMovementSpeed: 0.2,
  cameraRotationSensitivity: 4000,
  backgroundColor: "#7D7D7D",
};

// Type Definitions
export interface Interaction {
  id: string; // Unique identifier for the interaction
  type: "audio" | "info" | "animation" | "custom"; // Supported interaction types
  data: any; // Interaction-specific data
}

export interface Waypoint {
  x: number;
  y: number;
  z: number;
  rotation: BABYLON.Quaternion;
  interactions: Interaction[]; // Array of interactions
}

export interface AudioInteractionData {
  url: string; // URL of the audio file to play
}

export interface InfoInteractionData {
  text: string; // Text to display in the info pop-up
}

export interface AnimationInteractionData {
  animationName: string; // Name of the animation to trigger
  // Add additional properties as needed
}

export interface CustomInteractionData {
  script: string; // Custom JavaScript code to execute
  // Add additional properties as needed
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoTextRef = useRef<HTMLDivElement | null>(null);

  // State to hold waypoint coordinates and rotations
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      x: 0,
      y: 0,
      z: -10,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0, 0),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -8,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.1, 0),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -6,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.2, 0),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -4,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.3, 0),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -2,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.4, 0),
      interactions: [],
    },
  ]);

  // State to manage the loaded model file URL
  const [loadedModelUrl, setLoadedModelUrl] = useState<string | null>(null);

  // State variables for adjustable parameters
  const [scrollSpeed, setScrollSpeed] = useState<number>(DEFAULT_SETTINGS.scrollSpeed);
  const [animationFrames, setAnimationFrames] = useState<number>(DEFAULT_SETTINGS.animationFrames);
  const [cameraMovementSpeed, setCameraMovementSpeed] = useState<number>(DEFAULT_SETTINGS.cameraMovementSpeed);
  const [cameraRotationSensitivity, setCameraRotationSensitivity] = useState<number>(
    DEFAULT_SETTINGS.cameraRotationSensitivity
  );

  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // State for scroll percentage
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);

  // State for scroll controls visibility
  const [showScrollControls, setShowScrollControls] = useState<boolean>(true);

  // State for background color
  const [backgroundColor, setBackgroundColor] = useState<string>(DEFAULT_SETTINGS.backgroundColor);

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
  const [customModelUrl, setCustomModelUrl] = useState<string>("");
  const [isModelLocal, setIsModelLocal] = useState<boolean>(false);

  // State for Info Popup
  const [infoPopupText, setInfoPopupText] = useState<string | null>(null);

  // Refs to track active interactions
  const activeAudioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const activeAnimationsRef = useRef<{ [key: string]: BABYLON.Animation }>({});

//loaded meshes ref 
const loadedMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);


  // Track active waypoints in the buffer zone
  const activeWaypointsRef = useRef<Set<number>>(new Set());

  // Define reset settings function
  const resetSettings = () => {
    setScrollSpeed(DEFAULT_SETTINGS.scrollSpeed);
    setAnimationFrames(DEFAULT_SETTINGS.animationFrames);
    setCameraMovementSpeed(DEFAULT_SETTINGS.cameraMovementSpeed);
    setCameraRotationSensitivity(DEFAULT_SETTINGS.cameraRotationSensitivity);
    setBackgroundColor(DEFAULT_SETTINGS.backgroundColor);
  };

  // Function to adjust scroll via buttons
  const adjustScroll = (direction: number) => {
    const increment = 10; // Percentage increment
    const pathLength = pathRef.current.length;
    if (pathLength > 1) {
      const scrollIncrement = (pathLength - 1) * (increment / 100) * direction;
      scrollTargetRef.current += scrollIncrement;

      // Clamp scrollTarget to valid range
      if (scrollTargetRef.current < 0) scrollTargetRef.current = 0;
      if (scrollTargetRef.current > pathRef.current.length - 1)
        scrollTargetRef.current = pathRef.current.length - 1;

      // Reset userControl to allow camera movement along the path
      userControlRef.current = false;
    }
  };

  // Load settings from cookies on mount
  useEffect(() => {
    // Load settings from cookies or use default values
    const savedScrollSpeed = parseFloat(Cookies.get(COOKIE_KEYS.scrollSpeed) || "0.1");
    const savedAnimationFrames = parseInt(Cookies.get(COOKIE_KEYS.animationFrames) || "120");
    const savedCameraMovementSpeed = parseFloat(Cookies.get(COOKIE_KEYS.cameraMovementSpeed) || "0.2");
    const savedCameraRotationSensitivity = parseFloat(Cookies.get(COOKIE_KEYS.cameraRotationSensitivity) || "4000");
    const savedBackgroundColor = Cookies.get(COOKIE_KEYS.backgroundColor) || "#7D7D7D";

    // Update state with saved settings
    setScrollSpeed(savedScrollSpeed);
    setAnimationFrames(savedAnimationFrames);
    setCameraMovementSpeed(savedCameraMovementSpeed);
    setCameraRotationSensitivity(savedCameraRotationSensitivity);
    setBackgroundColor(savedBackgroundColor);
  }, []);

  // Save settings to cookies when they change
  useEffect(() => {
    Cookies.set(COOKIE_KEYS.scrollSpeed, scrollSpeed.toString(), { expires: 365 });
  }, [scrollSpeed]);

  useEffect(() => {
    Cookies.set(COOKIE_KEYS.animationFrames, animationFrames.toString(), { expires: 365 });
  }, [animationFrames]);

  useEffect(() => {
    Cookies.set(COOKIE_KEYS.cameraMovementSpeed, cameraMovementSpeed.toString(), { expires: 365 });
  }, [cameraMovementSpeed]);

  useEffect(() => {
    Cookies.set(COOKIE_KEYS.cameraRotationSensitivity, cameraRotationSensitivity.toString(), { expires: 365 });
  }, [cameraRotationSensitivity]);

  useEffect(() => {
    Cookies.set(COOKIE_KEYS.backgroundColor, backgroundColor, { expires: 365 });
  }, [backgroundColor]);


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
      navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
        if (supported) {
          // Enable WebXR support
          scene.createDefaultXRExperienceAsync().then(() => {
            console.log("WebXR enabled");
          });
        } else {
          console.warn("immersive-vr mode is not supported in this browser.");
        }
      });
    } else {
      console.warn("WebXR is not supported in this browser.");
    }

    // Create a universal camera and position it
    const camera = new BABYLON.UniversalCamera(
      "camera",
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

    camera.keysUpward.push(81); // Q
    camera.keysDownward.push(69); // E

    // Enable gamepad control
    const gamepadManager = scene.gamepadManager;
    gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
      console.log("Gamepad connected: " + gamepad.id);
      if (gamepad instanceof BABYLON.GenericPad) {
        // Handle standard gamepads
        gamepad.onleftstickchanged((values) => {
          camera.cameraDirection.z += values.y * 0.05; // Forward/backward
          camera.cameraDirection.x += values.x * 0.05; // Left/right
        });
      }
    });

    // Create a basic light
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    // Variables for Loaded Meshes
    let loadedMeshes: BABYLON.AbstractMesh[] = [];
    let isComponentMounted = true; // Flag to check if component is still mounted

    // Load model if URL is provided
    if (loadedModelUrl) {
       const loadedMeshes =   loadModelFile(
        loadedModelUrl,
        loadedMeshesRef.current,
        scene,
        isComponentMounted,
        setIsModelLocal,
        infoTextRef
      );
      if(loadedMeshes){
          loadedMeshesRef.current = loadedMeshes;
      }
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
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (
          ext === "splat" ||
          ext === "ply" ||
          ext === "gltf" ||
          ext === "glb"
        ) {
        const loadedMeshes =  loadModelFile(
            file,
            loadedMeshesRef.current,
            scene,
            isComponentMounted,
            setIsModelLocal,
            infoTextRef
          );
          if(loadedMeshes){
              loadedMeshesRef.current = loadedMeshes;
          }
        } else {
          alert("Please drop a .splat, .ply, .gltf, or .glb file.");
        }
      }
    };

    // Add event listeners
    document.addEventListener("dragover", preventDefault, false);
    document.addEventListener("drop", handleDrop, false);

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
      if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        userControlRef.current = true;

        // Switch to Euler angles (rotation) when user takes control
        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          (camera as any).rotationQuaternion = null; // Use type assertion to assign null
        }
      }
    });

    const keydownHandlerInternal = () => {
      userControlRef.current = true;

      // Switch to Euler angles (rotation) when user takes control
      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        (camera as any).rotationQuaternion = null; // Use type assertion to assign null
      }
    };
    window.addEventListener("keydown", keydownHandlerInternal);

    // Handle scroll events to move the camera along the path or animate it back
    const wheelHandlerLocal = (event: WheelEvent) => {
      wheelHandler(
        event,
        animatingToPathRef,
        userControlRef,
        camera,
        pathRef,
        rotations,
        waypoints,
        animationFrames,
        scrollSpeed,
        scrollTargetRef,
        scrollPositionRef
      );
    };
    window.addEventListener("wheel", wheelHandlerLocal);
    // Prevent default scrolling behavior on the canvas
    const preventCanvasScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventCanvasTouchMove = (event: Event) => {
      event.preventDefault();
    };

    canvas.addEventListener("wheel", preventCanvasScroll, { passive: false });
    canvas.addEventListener("touchmove", preventCanvasTouchMove, {
      passive: false,
    });

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
        if (!userControlRef.current && pathRef.current.length >= 1  && !isEditMode) {
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

        // Check for waypoint triggers
        waypoints.forEach((wp, index) => {
          const distance = BABYLON.Vector3.Distance(
            camera.position,
            new BABYLON.Vector3(wp.x, wp.y, wp.z)
          );
          const triggerDistance = 1.0; // Define a suitable trigger distance

          if (distance <= triggerDistance) {
            if (!activeWaypointsRef.current.has(index)) {
              // Entering the buffer zone
              activeWaypointsRef.current.add(index);
              executeInteractions(wp.interactions, scene);
            }
          } else {
            if (activeWaypointsRef.current.has(index)) {
              // Exiting the buffer zone
              activeWaypointsRef.current.delete(index);
              reverseInteractions(wp.interactions, scene);
            }
          }
        });

        scene.render();
      }
    });

    // Watch for browser/canvas resize events
    const resizeHandler = () => {
      engine.resize();
    };
    window.addEventListener("resize", resizeHandler);

    // Cleanup on component unmount
    return () => {
      isComponentMounted = false; // Update the flag
      // Remove event listeners
      document.removeEventListener("dragover", preventDefault, false);
      document.removeEventListener("drop", handleDrop, false);
      window.removeEventListener("keydown", keydownHandlerInternal);
      window.removeEventListener("wheel", wheelHandlerLocal);
      window.removeEventListener("resize", resizeHandler);

      scene.onPointerObservable.remove(pointerObservable);

      // Remove the event listeners from the canvas
      canvas.removeEventListener("wheel", preventCanvasScroll);
      canvas.removeEventListener("touchmove", preventCanvasTouchMove);

      // Dispose of the scene and engine
      scene.dispose();
      engine.dispose();
    };
  }, [
    scrollSpeed,
    animationFrames,
  ]); // Re-run effect when dependencies change

//useEffect for loadedModelUrl
useEffect(() => {

  //dispose of old meshes
  console.log("Disposing old meshes: ", loadedMeshesRef.current);
   sceneRef.current?.meshes.forEach(mesh => mesh.dispose());
 

  if (loadedModelUrl && sceneRef.current) {
  const loadedModels =  loadModelFile(
      loadedModelUrl,
      loadedMeshesRef.current,
      sceneRef.current,
      true,
      setIsModelLocal,
      infoTextRef
    );
    if(loadedModels){
        loadedMeshesRef.current = loadedModels;
    }

  }
}, [loadedModelUrl]);

//useEffect for cameraRotationSensitivity
useEffect(() => {
  if (cameraRef.current) {
    cameraRef.current.angularSensibility = cameraRotationSensitivity;
  }
}
, [cameraRotationSensitivity]);

//useEffect for cameraMovementSpeed
useEffect(() => {
  if (cameraRef.current) {
    cameraRef.current.speed = cameraMovementSpeed;
  }
} , [cameraMovementSpeed]);


 // Update waypoints
 useEffect(() => {
  if (!sceneRef.current) return;

  // Update path and rotations
  const controlPoints = waypoints.map(wp => new BABYLON.Vector3(wp.x, wp.y, wp.z));
  const rotations = waypoints.map(wp => wp.rotation);

  let path: BABYLON.Vector3[] = [];
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

  pathRef.current = path;
  rotationsRef.current = rotations;

}, [waypoints]);

  // Effect to update background color when it changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.clearColor =
        BABYLON.Color3.FromHexString(backgroundColor).toColor4(1);
    }
  }, [backgroundColor]);

  // Function to handle exporting the scene
  const handleExport = async () => {
    let modelUrl = loadedModelUrl || customModelUrl;

    if (isModelLocal) {
      // Prompt the user for a hosted URL
      modelUrl =
        prompt("Please provide a URL where the model is hosted:", "") ?? "";
      if (!modelUrl) {
        alert("Export cancelled. You must provide a URL for the model.");
        return;
      }
    }

    // Ask the user whether to include the controls UI
    const includeUI = window.confirm(
      "Do you want to include the controls UI in the exported HTML?"
    );

    // Generate the HTML content
    const htmlContent = generateExportedHTML(
      modelUrl,
      includeUI,
      waypoints,
      backgroundColor,
      cameraMovementSpeed,
      cameraRotationSensitivity,
      scrollSpeed,
      animationFrames
    );

    // Create a blob and trigger download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "exported_scene.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to execute interactions
  const executeInteractions = (interactions: Interaction[], scene: BABYLON.Scene) => {
    interactions.forEach((interaction) => {
      switch (interaction.type) {
        case "audio":
          playAudioInteraction(interaction.data as AudioInteractionData);
          break;
        case "info":
          showInfoInteraction(interaction.data as InfoInteractionData);
          break;
        case "animation":
          triggerAnimationInteraction(
            interaction.data as AnimationInteractionData,
            scene
          );
          break;
        default:
          console.warn(`Unsupported interaction type: ${interaction.type}`);
      }
    });
  };

  // Function to reverse interactions (when exiting buffer zone)
  const reverseInteractions = (interactions: Interaction[], scene: BABYLON.Scene) => {
    interactions.forEach((interaction) => {
      switch (interaction.type) {
        case "audio":
          stopAudioInteraction(interaction.id);
          break;
        case "info":
          hideInfoInteraction();
          break;
        case "animation":
          stopAnimationInteraction(
            interaction.id,
            scene
          );
          break;
        default:
          console.warn(`Unsupported interaction type: ${interaction.type}`);
      }
    });
  };

  // Function to play audio interactions
  const playAudioInteraction = (data: AudioInteractionData) => {
    const audioData = data;
    const audio = new Audio(audioData.url);
    audio.loop = true; // Loop the audio if needed
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
    activeAudioRefs.current[audioData.url] = audio;
  };

  // Function to stop audio interactions
  const stopAudioInteraction = (id: string) => {
    // Assuming id corresponds to the audio URL for simplicity
    const audio = activeAudioRefs.current[id];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete activeAudioRefs.current[id];
    }
  };

  // Function to show info interactions
  const showInfoInteraction = (data: InfoInteractionData) => {
    const infoData = data;
    setInfoPopupText(infoData.text);
  };

  // Function to hide info interactions
  const hideInfoInteraction = () => {
    setInfoPopupText(null);
  };

  // Function to trigger animation interactions
  const triggerAnimationInteraction = (
    data: AnimationInteractionData,
    scene: BABYLON.Scene
  ) => {
    const animationData = data;
    console.log("Triggering animation:", animationData.animationName);
    // Example: Play an animation on a specific mesh
    const mesh = scene.getMeshByName(animationData.animationName);
    if (mesh && mesh.animations.length > 0) {
      //play animations assiocaited with the mesh 
      mesh.beginAnimation(mesh.animations[0].name, false, 1);
      activeAnimationsRef.current[animationData.animationName] = mesh.animations[0];
    }
  };

  // Function to stop animation interactions
  const stopAnimationInteraction = (
    id: string,
    scene: BABYLON.Scene
  ) => {
    // Assuming id corresponds to the mesh name
    const mesh = scene.getMeshByName(id);
    if (mesh) {
      scene.stopAnimation(mesh);
      delete activeAnimationsRef.current[id];
    }
  };



  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Drag and Drop Info Text */}
      <div
        ref={infoTextRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "24px",
          textAlign: "center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        Please drag and drop a <br /> .splat, .ply, .gltf, or .glb file to load.
      </div>

      {/* Control Panels */}
      <WaypointControls waypoints={waypoints} setWaypoints={setWaypoints} />
      <Controls />
      <ParameterControls
        scrollSpeed={scrollSpeed}
        setScrollSpeed={setScrollSpeed}
        animationFrames={animationFrames}
        setAnimationFrames={setAnimationFrames}
        cameraMovementSpeed={cameraMovementSpeed}
        setCameraMovementSpeed={setCameraMovementSpeed}
        cameraRotationSensitivity={cameraRotationSensitivity}
        setCameraRotationSensitivity={setCameraRotationSensitivity}
        scrollPercentage={scrollPercentage}
        adjustScroll={adjustScroll}
        showScrollControls={showScrollControls}
        setShowScrollControls={setShowScrollControls}
      />
      <ScrollControls
        scrollPercentage={scrollPercentage}
        adjustScroll={adjustScroll}
        showScrollControls={showScrollControls}
        setShowScrollControls={setShowScrollControls}
      />
      <LoadSaveExportMenu
        setLoadedModelUrl={setLoadedModelUrl}
        setIsModelLocal={setIsModelLocal}
        customModelUrl={customModelUrl}
        setCustomModelUrl={setCustomModelUrl}
        handleExport={handleExport}
        resetSettings={resetSettings}
      />
      <BackgroundColorSelector
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
      />
      <GitHubLink repoUrl="https://github.com/SonnyC56/gaussian-splatting-viewer" />

      {sceneRef.current && (
        <WaypointVisualizer
          scene={sceneRef.current}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          isEditMode={isEditMode}
         />
       )}

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />

      {/* Info Popup */}
      {infoPopupText && (
        <InfoPopup
          text={infoPopupText}
          onClose={() => setInfoPopupText(null)}
        />
      )}
      <div style={{ position: 'absolute', top: '10px', left: '50%', zIndex: 10 }}>
        <button onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
      </div>
    </div>
  );
};

export default App;
