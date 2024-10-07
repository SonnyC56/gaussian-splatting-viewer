// src/App.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

import WaypointControls from "./components/WaypointControls";
import ParameterControls from "./components/ParameterControls";
import ScrollControls from "./components/ScrollControls";
import Controls from "./components/Controls";
import LoadSaveExportMenu from "./components/LoadSaveExportMenu";
import BackgroundColorSelector from "./components/BackgroundColorSelector";
import GitHubLink from "./components/GithubCTA";
import InfoPopup from "./components/InfoPopup";

import { generateExportedHTML } from "./tools/GenerateExportedHtml";
import loadModelFile from "./tools/LoadModelFile";
import { wheelHandler } from "./tools/WheelHandler";
import WaypointVisualizer from './components/WaypointVisualizer';
import HotspotManager from "./components/HotspotManager";
import { Hotspot } from "./components/HotspotManager";

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
  id: string;
  type: "audio" | "info" | "animation" | "custom";
  data: any;
}

export interface Waypoint {
  x: number;
  y: number;
  z: number;
  rotation: BABYLON.Quaternion;
  interactions: Interaction[];
}

export interface AudioInteractionData {
  url: string;
}

export interface InfoInteractionData {
  text: string;
}

export interface AnimationInteractionData {
  animationName: string;
}

export interface CustomInteractionData {
  script: string;
}

interface SaveFile {
  scrollSpeed: number;
  animationFrames: number;
  cameraMovementSpeed: number;
  cameraRotationSensitivity: number;
  backgroundColor: string;
  waypoints: Waypoint[];
  loadedModelUrl: string | null;
  hotspots: Hotspot[];
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoTextRef = useRef<HTMLDivElement | null>(null);

  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      x: 0,
      y: 0,
      z: -10,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0, 0).normalize(),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -8,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.1, 0).normalize(),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -6,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.2, 0).normalize(),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -4,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.3, 0).normalize(),
      interactions: [],
    },
    {
      x: 0,
      y: 0,
      z: -2,
      rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.4, 0).normalize(),
      interactions: [],
    },
  ]);

  const [loadedModelUrl, setLoadedModelUrl] = useState<string | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState<number>(DEFAULT_SETTINGS.scrollSpeed);
  const [animationFrames, setAnimationFrames] = useState<number>(DEFAULT_SETTINGS.animationFrames);
  const [cameraMovementSpeed, setCameraMovementSpeed] = useState<number>(DEFAULT_SETTINGS.cameraMovementSpeed);
  const [cameraRotationSensitivity, setCameraRotationSensitivity] = useState<number>(
    DEFAULT_SETTINGS.cameraRotationSensitivity
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);
  const [showScrollControls, setShowScrollControls] = useState<boolean>(true);
  const [backgroundColor, setBackgroundColor] = useState<string>(DEFAULT_SETTINGS.backgroundColor);
  const [customModelUrl, setCustomModelUrl] = useState<string>("");
  const [isModelLocal, setIsModelLocal] = useState<boolean>(false);
  const [infoPopupText, setInfoPopupText] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const scrollTargetRef = useRef<number>(0.01);
  const pathRef = useRef<BABYLON.Vector3[]>([]);
  const rotationsRef = useRef<BABYLON.Quaternion[]>([]);
  const userControlRef = useRef<boolean>(false);
  const animatingToPathRef = useRef<boolean>(false);
  const activeAudioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const activeAnimationsRef = useRef<{ [key: string]: BABYLON.Animation }>({});
  const loadedMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const activeWaypointsRef = useRef<Set<number>>(new Set());
  const targetRotationRef = useRef<BABYLON.Quaternion>(waypoints[0].rotation.clone());


  const resetSettings = () => {
    setScrollSpeed(DEFAULT_SETTINGS.scrollSpeed);
    setAnimationFrames(DEFAULT_SETTINGS.animationFrames);
    setCameraMovementSpeed(DEFAULT_SETTINGS.cameraMovementSpeed);
    setCameraRotationSensitivity(DEFAULT_SETTINGS.cameraRotationSensitivity);
    setBackgroundColor(DEFAULT_SETTINGS.backgroundColor);
    setCustomModelUrl("");
    setLoadedModelUrl(null);
    setIsModelLocal(false);
    setWaypoints([
      {
        x: 0,
        y: 0,
        z: -10,
        rotation: BABYLON.Quaternion.FromEulerAngles(0, 0, 0).normalize(),
        interactions: [],
      },
      {
        x: 0,
        y: 0,
        z: -8,
        rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.1, 0).normalize(),
        interactions: [],
      },
      {
        x: 0,
        y: 0,
        z: -6,
        rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.2, 0).normalize(),
        interactions: [],
      },
      {
        x: 0,
        y: 0,
        z: -4,
        rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.3, 0).normalize(),
        interactions: [],
      },
      {
        x: 0,
        y: 0,
        z: -2,
        rotation: BABYLON.Quaternion.FromEulerAngles(0, 0.4, 0).normalize(),
        interactions: [],
      },
    ]);
  };

  const adjustScroll = (direction: number) => {
    const increment = 10;
    const pathLength = pathRef.current.length;
    if (pathLength > 1) {
      const scrollIncrement = (pathLength - 1) * (increment / 100) * direction;
      scrollTargetRef.current += scrollIncrement;

      if (scrollTargetRef.current < 0) scrollTargetRef.current = 0;
      if (scrollTargetRef.current > pathRef.current.length - 1)
        scrollTargetRef.current = pathRef.current.length - 1;

      userControlRef.current = false;
    }
  };

  const saveToJson = () => {
    const saveData: SaveFile = {
      scrollSpeed,
      animationFrames,
      cameraMovementSpeed,
      cameraRotationSensitivity,
      backgroundColor,
      waypoints,
      loadedModelUrl,
      hotspots, // Include hotspots in the save data
    };
  
    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene_save.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const saveData: SaveFile = JSON.parse(e.target?.result as string);
  
          // Reconstruct BABYLON.Vector3 for waypoints
          const reconstructedWaypoints = saveData.waypoints.map(wp => ({
            ...wp,
            rotation: new BABYLON.Quaternion(wp.rotation._x, wp.rotation._y, wp.rotation._z, wp.rotation._w).normalize(),
          }));
          // Reconstruct BABYLON.Vector3 for hotspots
          console.log("saveData: ", saveData);
          const reconstructedHotspots = saveData.hotspots.map(h => ({
            ...h,
            position: new BABYLON.Vector3(h.position._x, h.position._y, h.position._z),
            scale: new BABYLON.Vector3(h.scale._x, h.scale._y, h.scale._z),
          }));
          
          // Update state
          setScrollSpeed(saveData.scrollSpeed);
          setAnimationFrames(saveData.animationFrames);
          setCameraMovementSpeed(saveData.cameraMovementSpeed);
          setCameraRotationSensitivity(saveData.cameraRotationSensitivity);
          setBackgroundColor(saveData.backgroundColor);
          setWaypoints(reconstructedWaypoints);
          setLoadedModelUrl(saveData.loadedModelUrl);
          setHotspots(reconstructedHotspots);
          console.log("Reconstructed waypoints:", reconstructedWaypoints);
          console.log("Reconstructed hotspots:", reconstructedHotspots);
  
          // Optionally, reinitialize other scene elements if necessary
        } catch (error) {
          console.error("Error parsing save file:", error);
          alert("Error loading save file. Please make sure it's a valid JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };
  
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    scene.clearColor = BABYLON.Color3.FromHexString(backgroundColor).toColor4(1);

    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
        if (supported) {
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

    const camera = new BABYLON.UniversalCamera(
      "camera",
      new BABYLON.Vector3(waypoints[0].x, waypoints[0].y, waypoints[0].z),
      scene
    );
    cameraRef.current = camera;
    camera.attachControl(canvas, true);

    camera.speed = cameraMovementSpeed;
    camera.angularSensibility = cameraRotationSensitivity;


    // Initialize rotationQuaternion with the first waypoint's rotation
    camera.rotationQuaternion = waypoints[0].rotation.clone();

    // Optionally, set the Euler rotation to match (if needed)
    // camera.rotation = camera.rotationQuaternion.toEulerAngles();

    camera.keysUp.push(87);
    camera.keysDown.push(83);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);
    camera.keysUpward.push(81);
    camera.keysDownward.push(69);

    const gamepadManager = scene.gamepadManager;
    gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
      console.log("Gamepad connected: " + gamepad.id);
      if (gamepad instanceof BABYLON.GenericPad) {
        gamepad.onleftstickchanged((values) => {
          camera.cameraDirection.z += values.y * 0.05;
          camera.cameraDirection.x += values.x * 0.05;
        });
      }
    });

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    let isComponentMounted = true;

  /*   if (loadedModelUrl) {
      const loadedMeshes = await loadModelFile(
        loadedModelUrl,
        scene,
        isComponentMounted,
        setIsModelLocal,
        infoTextRef
      );
      if(loadedMeshes){
          loadedMeshesRef.current = loadedMeshes;
      }
    } */

    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    
      const files = e.dataTransfer?.files;
    
      if (files && files.length > 0) {
        const file = files[0];
        const ext = file.name.split(".").pop()?.toLowerCase();
    
        if (["splat", "ply", "gltf", "glb"].includes(ext || "")) {
          try {
            const loadedMeshes = await loadModelFile(
              file,
              sceneRef.current!,
              isComponentMounted,
              setIsModelLocal,
              infoTextRef
            );
            if (loadedMeshes) {
              loadedMeshesRef.current = loadedMeshes;
            }
          } catch (error) {
            console.error("Error loading model file:", error);
            alert("Failed to load the model.");
            if (infoTextRef.current) {
              infoTextRef.current.style.display = "block";
              infoTextRef.current.innerText = "Failed to load the model.";
            }
          }
        } else {
          alert("Please drop a .splat, .ply, .gltf, or .glb file.");
        }
      }
    };
    

    document.addEventListener("dragover", preventDefault, false);
    document.addEventListener("drop", handleDrop, false);

    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );
    const rotations = waypoints.map(wp => new BABYLON.Quaternion(wp.rotation._x, wp.rotation._y, wp.rotation._z, wp.rotation._w));

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
    } else {
      path = [];
    }

    pathRef.current = path;
    rotationsRef.current = rotations;

    const pointerObservable = scene.onPointerObservable.add(function (evt) {
      if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        userControlRef.current = true;
      }
    });

    const keydownHandlerInternal = () => {
      userControlRef.current = true;
    };
    window.addEventListener("keydown", keydownHandlerInternal);

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

    engine.runRenderLoop(function () {
      if (isComponentMounted && sceneRef.current && cameraRef.current) {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        
        // Update scroll position smoothly
        const scrollInterpolationSpeed = 0.1;
        scrollPositionRef.current +=
          (scrollTargetRef.current - scrollPositionRef.current) *
          scrollInterpolationSpeed;
        
        // Clamp scroll position
        scrollPositionRef.current = Math.max(
          0,
          Math.min(scrollPositionRef.current, pathRef.current.length - 1)
        );
        
        // Update scroll percentage
        const newScrollPercentage =
          pathRef.current.length > 1
            ? (scrollPositionRef.current / (pathRef.current.length - 1)) * 100
            : 0;
        setScrollPercentage(newScrollPercentage);
        
        if (!userControlRef.current && pathRef.current.length >= 1 && !isEditMode) {
          const t = scrollPositionRef.current / (pathRef.current.length - 1 || 1);
          const totalSegments = waypoints.length - 1;
          
          if (totalSegments >= 1) {
            const segmentT = t * totalSegments;
            const segmentIndex = Math.floor(segmentT);
            const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
            const lerpFactor = segmentT - clampedSegmentIndex;
            
            const r1 = rotationsRef.current[clampedSegmentIndex];
            const r2 = rotationsRef.current[clampedSegmentIndex + 1] || rotationsRef.current[rotationsRef.current.length - 1];
            
            // Calculate the target rotation using Slerp
            const targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);
            targetRotationRef.current = targetRotation;
          } else if (rotationsRef.current.length === 1) {
            targetRotationRef.current = rotationsRef.current[0].clone();
          }
      
        
        // Smoothly interpolate the camera's rotation towards the target rotation
        if (camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.Slerp(
            camera.rotationQuaternion,
            targetRotationRef.current,
            0.05 // Damping factor (adjust between 0 and 1 for smoothness)
          ).normalize();
        }
        
// Calculate the floor and ceil indices based on scrollPositionRef.current
const floorIndex = Math.floor(scrollPositionRef.current);
const ceilIndex = Math.min(floorIndex + 1, pathRef.current.length - 1);

// Calculate the interpolation factor (fractional part)
const lerpFactor = scrollPositionRef.current - floorIndex;

// Interpolate between the two positions
const newPosition = BABYLON.Vector3.Lerp(
  pathRef.current[floorIndex],
  pathRef.current[ceilIndex],
  lerpFactor
);

// Update the camera's position
        camera.position.copyFrom(newPosition);
        
        // Handle interactions based on waypoints
        waypoints.forEach((wp, index) => {
          const distance = BABYLON.Vector3.Distance(
            camera.position,
            new BABYLON.Vector3(wp.x, wp.y, wp.z)
          );
          const triggerDistance = 1.0;
          
          if (distance <= triggerDistance) {
            if (!activeWaypointsRef.current.has(index)) {
              activeWaypointsRef.current.add(index);
              executeInteractions(wp.interactions, scene);
            }
          } else {
            if (activeWaypointsRef.current.has(index)) {
              activeWaypointsRef.current.delete(index);
              reverseInteractions(wp.interactions, scene);
            }
          }
        });
      }
        
        scene.render();
      }
    });
    
    const resizeHandler = () => {
      engine.resize();
    };
    window.addEventListener("resize", resizeHandler);

    return () => {
      isComponentMounted = false;
      document.removeEventListener("dragover", preventDefault, false);
      document.removeEventListener("drop", handleDrop, false);
      window.removeEventListener("keydown", keydownHandlerInternal);
      window.removeEventListener("wheel", wheelHandlerLocal);
      window.removeEventListener("resize", resizeHandler);

      scene.onPointerObservable.remove(pointerObservable);

      canvas.removeEventListener("wheel", preventCanvasScroll);
      canvas.removeEventListener("touchmove", preventCanvasTouchMove);

      scene.dispose();
      engine.dispose();
    };
  }, []);

  const wheelHandlerLocal = useCallback((event: WheelEvent) => {
    if(cameraRef.current){
      wheelHandler(
        event,
        animatingToPathRef,
        userControlRef,
        cameraRef.current,
        pathRef,
        rotationsRef.current,
        waypoints,
        animationFrames,
        scrollSpeed,
        scrollTargetRef,
        scrollPositionRef,
        isEditMode
      );
    }
  }, [waypoints, animationFrames, scrollSpeed, isEditMode]);

  useEffect(() => {
    window.addEventListener("wheel", wheelHandlerLocal);
    return () => {
      window.removeEventListener("wheel", wheelHandlerLocal);
    };
  }, [wheelHandlerLocal]);

  useEffect(() => {
    const loadMeshes = async () => {
      console.log("Disposing old meshes: ", loadedMeshesRef.current);
      loadedMeshesRef.current?.forEach(mesh => mesh.dispose());
  
      console.log("Loading new model: loadedModelUrl: ", loadedModelUrl);
      if (loadedModelUrl && sceneRef.current) {
        try {
          const loadedModels = await loadModelFile(
            loadedModelUrl,
            sceneRef.current,
            true,
            setIsModelLocal,
            infoTextRef
          );
          console.log("Loaded models: ", loadedModels);
          if (loadedModels && Array.isArray(loadedModels)) {
            loadedMeshesRef.current = loadedModels;
      
          }
        } catch (error) {
          console.error("Error loading model:", error);
          // Optionally, update UI or state to reflect the error
        }
      }
    };
  
    loadMeshes();
  }, [loadedModelUrl]);
  

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.angularSensibility = cameraRotationSensitivity;
    }
  }, [cameraRotationSensitivity]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.speed = cameraMovementSpeed;
    }
  }, [cameraMovementSpeed]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const controlPoints = waypoints.map(wp => new BABYLON.Vector3(wp.x, wp.y, wp.z));
    const rotations = waypoints.map(wp => new BABYLON.Quaternion(wp.rotation._x, wp.rotation._y, wp.rotation._z, wp.rotation._w));

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
    console.log("waypints changed, rotationsRef:", rotationsRef.current);



  }, [waypoints]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.clearColor =
        BABYLON.Color3.FromHexString(backgroundColor).toColor4(1);
    }
  }, [backgroundColor]);

  const handleExport = async () => {
    let modelUrl = loadedModelUrl || customModelUrl;

    if (isModelLocal) {
      modelUrl =
        prompt("Please provide a URL where the model is hosted:", "") ?? "";
      if (!modelUrl) {
        alert("Export cancelled. You must provide a URL for the model.");
        return;
      }
    }

    const includeUI = window.confirm(
      "Do you want to include the controls UI in the exported HTML?"
    );

    const htmlContent = generateExportedHTML(
      modelUrl,
      includeUI,
      waypoints,
      backgroundColor,
      cameraMovementSpeed,
      cameraRotationSensitivity,
      scrollSpeed,
      animationFrames,
      hotspots
    );

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "exported_scene.html";
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const playAudioInteraction = (data: AudioInteractionData) => {
    const audioData = data;
    const audio = new Audio(audioData.url);
    audio.loop = true;
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
    activeAudioRefs.current[audioData.url] = audio;
  };

  const stopAudioInteraction = (id: string) => {
    const audio = activeAudioRefs.current[id];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete activeAudioRefs.current[id];
    }
  };

  const showInfoInteraction = (data: InfoInteractionData) => {
    const infoData = data;
    setInfoPopupText(infoData.text);
  };

  const hideInfoInteraction = () => {
    setInfoPopupText(null);
  };

  const triggerAnimationInteraction = (
    data: AnimationInteractionData,
    scene: BABYLON.Scene
  ) => {
    const animationData = data;
    console.log("Triggering animation:", animationData.animationName);
    const mesh = scene.getMeshByName(animationData.animationName);
    if (mesh && mesh.animations.length > 0) {
      mesh.beginAnimation(mesh.animations[0].name, false, 1);
      activeAnimationsRef.current[animationData.animationName] = mesh.animations[0];
    }
  };

  const stopAnimationInteraction = (
    id: string,
    scene: BABYLON.Scene
  ) => {
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

      <WaypointControls waypoints={waypoints} setWaypoints={setWaypoints} isEditMode={isEditMode} setIsEditMode={setIsEditMode} scene={sceneRef.current ?? undefined}/>
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
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
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
        saveToJson={saveToJson}
        loadFromJson={loadFromJson}
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

      {sceneRef.current && cameraRef.current && (
        <HotspotManager scene={sceneRef.current} camera={cameraRef.current}       hotspots={hotspots}
        setHotspots={setHotspots} />
      )}

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />

      {infoPopupText && (
        <InfoPopup
          text={infoPopupText}
          onClose={() => setInfoPopupText(null)}
        />
      )}
    </div>
  );
};

export default App;