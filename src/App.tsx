import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/core/Loading/sceneLoader";
import Draggable from "react-draggable";

interface Hotspot {
  id: string;
  position: BABYLON.Vector3;
  rotation: BABYLON.Quaternion;
  content: string;
  type: "Info" | "Pause" | "Animate";
  triggerContent?: string;
  triggered: boolean;
}
// Define the LightingSettings interface
interface LightingSettings {
  type: "PointLight" | "DirectionalLight" | "SpotLight" | "HemisphericLight";
  intensity: number;
  color: string; // Hex color code, e.g., "#FFFFFF"
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface Waypoint {
  x: number;
  y: number;
  z: number;
  rotation: BABYLON.Quaternion;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoTextRef = useRef<HTMLDivElement | null>(null);

  // State for waypoints
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
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

  // State for hotspots (Feature 1: Dynamic Hotspot System)
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  // State for UI visibility
  const [showControlsInfo, setShowControlsInfo] = useState(true);
  const [showScrollControls, setShowScrollControls] = useState(true);

  // State for model loading
  const [loadedModelUrl, setLoadedModelUrl] = useState<string | null>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string>("");
  const [isModelLocal, setIsModelLocal] = useState<boolean>(false);

  // State for adjustable parameters
  const [scrollSpeed, setScrollSpeed] = useState(0.1);
  const [animationFrames, setAnimationFrames] = useState(120);
  const [cameraMovementSpeed, setCameraMovementSpeed] = useState(0.2);
  const [cameraRotationSensitivity, setCameraRotationSensitivity] =
    useState(4000);

  // State for scroll percentage
  const [scrollPercentage, setScrollPercentage] = useState(0);

  // State for background color
  const [backgroundColor, setBackgroundColor] = useState<string>("#7D7D7D");

  // State for model animations (Feature 2: Model Animation Control Board)
  const [modelAnimations, setModelAnimations] = useState<
    BABYLON.AnimationGroup[]
  >([]);

  // Refs for scene, camera, and other Babylon.js objects
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const scrollTargetRef = useRef<number>(0.01);
  const pathRef = useRef<BABYLON.Vector3[]>([]);
  const rotationsRef = useRef<BABYLON.Quaternion[]>([]);
  const userControlRef = useRef<boolean>(false);
  const animatingToPathRef = useRef<boolean>(false);

  // State for lighting (Feature 3: Lighting Control Panel)
  const [lighting, setLighting] = useState({
    type: "HemisphericLight" as
      | "PointLight"
      | "DirectionalLight"
      | "SpotLight"
      | "HemisphericLight",
    intensity: 1,
    color: "#ffffff",
    position: { x: 0, y: 1, z: 0 },
  });

  // Ref for current light
  const currentLightRef = useRef<BABYLON.Light | null>(null);

  // Function to adjust scroll via buttons
  const adjustScroll = (direction: number) => {
    const increment = 10;
    const pathLength = pathRef.current.length;
    if (pathLength > 1) {
      const scrollIncrement = (pathLength - 1) * (increment / 100) * direction;
      scrollTargetRef.current += scrollIncrement;
      scrollTargetRef.current = Math.max(
        0,
        Math.min(scrollTargetRef.current, pathLength - 1)
      );
      userControlRef.current = false;
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    scene.clearColor =
      BABYLON.Color3.FromHexString(backgroundColor).toColor4(1);

    // WebXR setup
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

    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    // Gamepad support
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

    // Initial light setup (will be updated by lighting control panel)
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    let loadedMeshes: BABYLON.AbstractMesh[] = [];
    let isComponentMounted = true;

    // Function to add hover interaction
    const addHoverInteraction = (mesh: BABYLON.AbstractMesh) => {
      mesh.actionManager = new BABYLON.ActionManager(scene);

      let tooltip: HTMLDivElement | null = null;
      let pointerMoveHandler: ((evt: PointerEvent) => void) | null = null;

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            tooltip = document.createElement("div");
            tooltip.id = "tooltip";
            tooltip.innerText = "Hot spot example";
            tooltip.style.position = "absolute";
            tooltip.style.backgroundColor = "rgba(0,0,0,0.7)";
            tooltip.style.color = "white";
            tooltip.style.padding = "5px";
            tooltip.style.borderRadius = "5px";
            tooltip.style.pointerEvents = "none";
            tooltip.style.zIndex = "15";
            document.body.appendChild(tooltip);

            pointerMoveHandler = function (evt) {
              if (tooltip) {
                tooltip.style.left = evt.clientX + 10 + "px";
                tooltip.style.top = evt.clientY + 10 + "px";
              }
            };
            window.addEventListener("pointermove", pointerMoveHandler);
          }
        )
      );

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
            }
            if (pointerMoveHandler) {
              window.removeEventListener("pointermove", pointerMoveHandler);
              pointerMoveHandler = null;
            }
          }
        )
      );

      mesh.onDisposeObservable.add(() => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
        if (pointerMoveHandler) {
          window.removeEventListener("pointermove", pointerMoveHandler);
          pointerMoveHandler = null;
        }
      });
    };

    // Function to load model file
    const loadModelFile = async (fileOrUrl: File | string) => {
      loadedMeshes.forEach((mesh) => mesh.dispose());
      loadedMeshes = [];

      const loadExtensions = [".splat", ".ply", ".gltf", ".glb"];

      let fileExtension = "";
      if (typeof fileOrUrl === "string") {
        fileExtension = "." + fileOrUrl.split(".").pop()?.toLowerCase();
      } else {
        fileExtension = "." + fileOrUrl.name.split(".").pop()?.toLowerCase();
      }

      if (!loadExtensions.includes(fileExtension)) {
        alert(
          "Unsupported file format. Please load a .splat, .ply, .gltf, or .glb file."
        );
        return;
      }

      try {
        let result;
        if (typeof fileOrUrl === "string") {
          result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "",
            fileOrUrl,
            scene
          );
        } else {
          result = await BABYLON.SceneLoader.ImportMeshAsync(
            null,
            "",
            fileOrUrl,
            scene,
            null,
            fileExtension
          );
        }

        if (!isComponentMounted) return;
        loadedMeshes = result.meshes;
        loadedMeshes.forEach((mesh) => {
          if (mesh instanceof BABYLON.Mesh) {
            mesh.position = BABYLON.Vector3.Zero();
            addHoverInteraction(mesh);
          }
        });

        if (infoTextRef.current) infoTextRef.current.style.display = "none";
        setIsModelLocal(typeof fileOrUrl !== "string");

        // Feature 2: Model Animation Control Board
        const animations = scene.animationGroups;
        if (animations && animations.length > 0) {
          setModelAnimations(animations);
        } else {
          setModelAnimations([]);
        }
      } catch (error) {
        console.error("Error loading model file:", error);
        alert("Error loading model file: " + (error as Error).message);
      }
    };

    if (loadedModelUrl) {
      loadModelFile(loadedModelUrl);
    }

    // Drag-and-Drop functionality
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
          loadModelFile(file);
        } else {
          alert("Please drop a .splat, .ply, .gltf, or .glb file.");
        }
      }
    };

    document.addEventListener("dragover", preventDefault, false);
    document.addEventListener("drop", handleDrop, false);

    // Camera Path Setup
    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );
    const rotations = waypoints.map((wp) => wp.rotation);

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

    // User interaction detection
    const pointerObservable = scene.onPointerObservable.add(function (evt) {
      if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        userControlRef.current = true;
        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          (camera as any).rotationQuaternion = null;
        }
      }
    });

    const keydownHandler = () => {
      userControlRef.current = true;
      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        (camera as any).rotationQuaternion = null;
      }
    };
    window.addEventListener("keydown", keydownHandler);

    // Scroll handler
    const wheelHandler = (event: WheelEvent) => {
      if (animatingToPathRef.current) return;

      if (userControlRef.current) {
        animatingToPathRef.current = true;
        userControlRef.current = false;

        if (!camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
          );
          camera.rotation.set(0, 0, 0);
        }

        const closestPointInfo = getClosestPointOnPath(
          camera.position,
          pathRef.current
        );
        const startIndex = closestPointInfo.index;
        const targetPosition = pathRef.current[startIndex];

        let targetRotation = camera.rotationQuaternion.clone();
        if (rotations.length >= 2 && pathRef.current.length >= 2) {
          const t = startIndex / (pathRef.current.length - 1);
          const totalSegments = waypoints.length - 1;
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          const r1 = rotations[clampedSegmentIndex];
          const r2 =
            rotations[clampedSegmentIndex + 1] ||
            rotations[rotations.length - 1];
          targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);
        } else if (rotations.length === 1) {
          targetRotation = rotations[0];
        }

        const positionAnimation = new BABYLON.Animation(
          "cameraPositionAnimation",
          "position",
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const positionKeys = [];
        positionKeys.push({ frame: 0, value: camera.position.clone() });
        positionKeys.push({
          frame: animationFrames,
          value: targetPosition.clone(),
        });

        positionAnimation.setKeys(positionKeys);

        const easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(
          BABYLON.EasingFunction.EASINGMODE_EASEINOUT
        );
        positionAnimation.setEasingFunction(easingFunction);

        const rotationAnimation = new BABYLON.Animation(
          "cameraRotationAnimation",
          "rotationQuaternion",
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

        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        scene.beginAnimation(camera, 0, animationFrames, false, 1, function () {
          animatingToPathRef.current = false;
          scrollPositionRef.current = startIndex;
          scrollTargetRef.current = scrollPositionRef.current;
        });
      } else {
        scrollTargetRef.current += event.deltaY * scrollSpeed;
        scrollTargetRef.current = Math.max(
          0,
          Math.min(scrollTargetRef.current, pathRef.current.length - 1)
        );
      }
    };
    window.addEventListener("wheel", wheelHandler);

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

    // Render loop
    engine.runRenderLoop(function () {
      if (isComponentMounted) {
        const scrollInterpolationSpeed = 0.1;
        scrollPositionRef.current +=
          (scrollTargetRef.current - scrollPositionRef.current) *
          scrollInterpolationSpeed;

        scrollPositionRef.current = Math.max(
          0,
          Math.min(scrollPositionRef.current, pathRef.current.length - 1)
        );

        const newScrollPercentage =
          pathRef.current.length > 1
            ? (scrollPositionRef.current / (pathRef.current.length - 1)) * 100
            : 0;
        setScrollPercentage(newScrollPercentage);

        if (!userControlRef.current && pathRef.current.length >= 1) {
          const t =
            scrollPositionRef.current / (pathRef.current.length - 1 || 1);

          const totalSegments = waypoints.length - 1;
          if (totalSegments >= 1) {
            const segmentT = t * totalSegments;
            const segmentIndex = Math.floor(segmentT);
            const clampedSegmentIndex = Math.min(
              segmentIndex,
              totalSegments - 1
            );
            const lerpFactor = segmentT - clampedSegmentIndex;

            const newPosition =
              pathRef.current[Math.floor(scrollPositionRef.current)];

            const r1 = rotationsRef.current[clampedSegmentIndex];
            const r2 =
              rotationsRef.current[clampedSegmentIndex + 1] ||
              rotationsRef.current[rotationsRef.current.length - 1];

            const newRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

            camera.position.copyFrom(newPosition);

            if (!camera.rotationQuaternion) {
              camera.rotationQuaternion = new BABYLON.Quaternion();
            }
            camera.rotationQuaternion.copyFrom(newRotation);
          } else if (rotationsRef.current.length === 1) {
            camera.position.copyFrom(pathRef.current[0]);
            if (!camera.rotationQuaternion) {
              camera.rotationQuaternion = new BABYLON.Quaternion();
            }
            camera.rotationQuaternion.copyFrom(rotationsRef.current[0]);
          }
        }

        // Feature 1: Dynamic Hotspot System - Check for hotspot triggers
        hotspots.forEach((hotspot, index) => {
          const distance = BABYLON.Vector3.Distance(
            camera.position,
            hotspot.position
          );
          if (distance < 1 && !hotspot.triggered) {
            handleHotspotTrigger(hotspot, index);
          }
        });

        scene.render();
      }
    });

    const resizeHandler = () => {
      engine.resize();
    };
    window.addEventListener("resize", resizeHandler);

    // Feature 3: Lighting Control Panel
    const updateLighting = () => {
      if (currentLightRef.current) {
        currentLightRef.current.dispose();
        currentLightRef.current = null;
      }

      let newLight: BABYLON.Light;
      switch (lighting.type) {
        case "PointLight":
          newLight = new BABYLON.PointLight(
            "pointLight",
            new BABYLON.Vector3(
              lighting.position.x,
              lighting.position.y,
              lighting.position.z
            ),
            scene
          );
          break;
        case "DirectionalLight":
          newLight = new BABYLON.DirectionalLight(
            "directionalLight",
            new BABYLON.Vector3(
              lighting.position.x,
              lighting.position.y,
              lighting.position.z
            ),
            scene
          );
          break;
        case "SpotLight":
          newLight = new BABYLON.SpotLight(
            "spotLight",
            new BABYLON.Vector3(
              lighting.position.x,
              lighting.position.y,
              lighting.position.z
            ),
            new BABYLON.Vector3(0, -1, 0),
            Math.PI / 3,
            2,
            scene
          );
          break;
        case "HemisphericLight":
        default:
          newLight = new BABYLON.HemisphericLight(
            "hemisphericLight",
            new BABYLON.Vector3(0, 1, 0),
            scene
          );
          break;
      }

      newLight.intensity = lighting.intensity;
      newLight.diffuse = BABYLON.Color3.FromHexString(lighting.color);

      currentLightRef.current = newLight;
    };

    updateLighting();

    return () => {
      isComponentMounted = false;
      document.removeEventListener("dragover", preventDefault, false);
      document.removeEventListener("drop", handleDrop, false);
      window.removeEventListener("keydown", keydownHandler);
      window.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("resize", resizeHandler);

      scene.onPointerObservable.remove(pointerObservable);

      canvas.removeEventListener("wheel", preventCanvasScroll);
      canvas.removeEventListener("touchmove", preventCanvasTouchMove);

      if (currentLightRef.current) {
        currentLightRef.current.dispose();
      }

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
    backgroundColor,
    lighting,
    hotspots,
  ]);

  // Feature 1: Dynamic Hotspot System - Hotspot trigger handler
  const handleHotspotTrigger = (hotspot: Hotspot, index: number) => {
    switch (hotspot.type) {
      case "Info":
        if (infoTextRef.current) {
          infoTextRef.current.innerHTML = hotspot.content;
          infoTextRef.current.style.display = "block";
        }
        break;
      case "Pause":
        scrollTargetRef.current = scrollPositionRef.current;
        break;
      case "Animate":
        const animGroup = modelAnimations.find(
          (anim) => anim.name === hotspot.triggerContent
        );
        if (animGroup) {
          animGroup.start(true);
        }
        break;
    }

    setHotspots((prevHotspots) =>
      prevHotspots.map((h, idx) =>
        idx === index ? { ...h, triggered: true } : h
      )
    );
  };

  // Feature 4: Visual Path Editing in 3D
  const createDraggableWaypoint = (waypoint: Waypoint, index: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const waypointMesh = BABYLON.MeshBuilder.CreateSphere(
      `waypoint-${index}`,
      { diameter: 0.3 },
      scene
    );
    waypointMesh.position = new BABYLON.Vector3(
      waypoint.x,
      waypoint.y,
      waypoint.z
    );
    waypointMesh.material = new BABYLON.StandardMaterial(
      `waypointMat-${index}`,
      scene
    );
    (waypointMesh.material as BABYLON.StandardMaterial).diffuseColor =
      BABYLON.Color3.Yellow();
    waypointMesh.isPickable = true;

    waypointMesh.actionManager = new BABYLON.ActionManager(scene);

    let isDragging = false;

    waypointMesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        isDragging = true;
      })
    );

    scene.onPointerObservable.add((pointerInfo) => {
      const { type, pickInfo } = pointerInfo;
      if (type === BABYLON.PointerEventTypes.POINTERUP) {
        isDragging = false;
      }
      if (isDragging && pickInfo?.pickedPoint) {
        setWaypoints((prevWaypoints) =>
          prevWaypoints.map((wp, idx) =>
            idx === index
              ? {
                  ...wp,
                  x: pickInfo.pickedPoint?.x ?? 0,
                  y: pickInfo.pickedPoint?.y ?? 0,
                  z: pickInfo.pickedPoint?.z ?? 0,
                }
              : wp
          )
        );
      }
    });

    return waypointMesh;
  };

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Render path
    const points = waypoints.map((wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z));
    const pathLines = BABYLON.MeshBuilder.CreateLines(
      "pathLines",
      { points, updatable: false },
      scene
    );
    pathLines.color = BABYLON.Color3.Blue();

    // Create draggable waypoints
    const waypointMeshes = waypoints.map((wp, index) =>
      createDraggableWaypoint(wp, index)
    );

    return () => {
      pathLines.dispose();
      waypointMeshes.forEach((mesh) => mesh?.dispose());
    };
  }, [waypoints]);

  // Feature 5: Waypoint Types and Triggers
  const updateWaypointType = (index: number, type: string) => {
    setWaypoints((prevWaypoints) =>
      prevWaypoints.map((wp, idx) => (idx === index ? { ...wp, type } : wp))
    );
  };

  const updateWaypointContent = (index: number, content: string) => {
    setWaypoints((prevWaypoints) =>
      prevWaypoints.map((wp, idx) => (idx === index ? { ...wp, content } : wp))
    );
  };
  // Waypoint management functions
  const handleWaypointChange = (
    index: number,
    axis: "x" | "y" | "z",
    value: string
  ) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index][axis] = parseFloat(value);
    setWaypoints(newWaypoints);
  };
  const baseURL = "https://assets.babylonjs.com/splats/";

  // Add this declaration for models
  const models = [
    "gs_Sqwakers_trimed.splat",
    "gs_Skull.splat",
    "gs_Plants.splat",
    "gs_Fire_Pit.splat",
  ];
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

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  const resetWaypointTriggers = () => {
    setWaypoints((prevWaypoints) =>
      prevWaypoints.map((wp) => ({ ...wp, triggered: false }))
    );
    if (infoTextRef.current) {
      infoTextRef.current.style.display = "none";
    }
  };

  // Add this function for HTML export
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
      hotspots,
      lighting,
      cameraMovementSpeed,
      cameraRotationSensitivity
    );

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "exported_scene.html";
    a.click();
    URL.revokeObjectURL(url);
  };
  const generateExportedHTML = (
    modelUrl: string,
    includeUI: boolean,
    waypoints: Waypoint[],
    hotspots: Hotspot[],
    lighting: LightingSettings,
    cameraMovementSpeed: number,
    cameraRotationSensitivity: number
  ) => {
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

    // Prepare the hotspots data
    const hotspotsData = hotspots.map((hs) => ({
      id: hs.id,
      position: {
        x: hs.position.x,
        y: hs.position.y,
        z: hs.position.z,
      },
      rotation: {
        x: hs.rotation.x,
        y: hs.rotation.y,
        z: hs.rotation.z,
        w: hs.rotation.w,
      },
      content: hs.content,
      type: hs.type,
      triggerContent: hs.triggerContent || "",
      triggered: hs.triggered,
    }));

    // Prepare the lighting data
    const lightingData = {
      type: lighting.type,
      intensity: lighting.intensity,
      color: lighting.color,
      position: lighting.position,
    };

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
      max-width: 300px;
      font-family: Arial, sans-serif;
    }
    `
        : ""
    }
    /* Tooltip styling */
    #tooltip {
      position: absolute;
      background-color: rgba(0,0,0,0.7);
      color: white;
      padding: 5px;
      border-radius: 5px;
      pointer-events: none;
      z-index: 15;
      display: none;
      font-family: Arial, sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  ${
    includeUI
      ? `
  <div class="ui-overlay">
    <p><strong>Controls:</strong></p>
    <ul>
      <li>W/A/S/D: Move camera</li>
      <li>Mouse: Look around</li>
      <li>Scroll: Move along path</li>
      <li>Click on hotspots for more information</li>
    </ul>
  </div>
  `
      : ""
  }
  <!-- Tooltip Element -->
  <div id="tooltip"></div>

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
    scene.clearColor = BABYLON.Color3.FromHexString('${
      lightingData.color
    }').toColor4(1);

    // Create a universal camera and position it
    const camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(${waypointsData[0].x}, ${waypointsData[0].y}, ${
      waypointsData[0].z
    }),
      scene
    );
    camera.attachControl(canvas, true);

    // Adjust camera sensitivity
    camera.speed = ${cameraMovementSpeed};
    camera.angularSensibility = ${cameraRotationSensitivity};

    // Enable WASD keys for movement
    camera.keysUp.push(87);    // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68); // D

    // Create a basic light based on exported lighting data
    let exportedLight;
    switch ('${lightingData.type}') {
      case 'PointLight':
        exportedLight = new BABYLON.PointLight('exportedPointLight', new BABYLON.Vector3(${
          lightingData.position.x
        }, ${lightingData.position.y}, ${lightingData.position.z}), scene);
        break;
      case 'DirectionalLight':
        exportedLight = new BABYLON.DirectionalLight('exportedDirectionalLight', new BABYLON.Vector3(${
          lightingData.position.x
        }, ${lightingData.position.y}, ${lightingData.position.z}), scene);
        break;
      case 'SpotLight':
        exportedLight = new BABYLON.SpotLight('exportedSpotLight', new BABYLON.Vector3(${
          lightingData.position.x
        }, ${lightingData.position.y}, ${
      lightingData.position.z
    }), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
        break;
      case 'HemisphericLight':
      default:
        exportedLight = new BABYLON.HemisphericLight('exportedHemisphericLight', new BABYLON.Vector3(0, 1, 0), scene);
        break;
    }
    exportedLight.intensity = ${lightingData.intensity};
    exportedLight.diffuse = BABYLON.Color3.FromHexString('${
      lightingData.color
    }');

    // Prepare waypoints and rotations
    const waypoints = ${JSON.stringify(waypointsData)};
    const hotspots = ${JSON.stringify(hotspotsData)};
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

    // Function to add hover interaction
    const addHoverInteraction = (mesh, content) => {
      mesh.actionManager = new BABYLON.ActionManager(scene);

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
              tooltip.innerText = content;
              tooltip.style.display = 'block';
            }
          }
        )
      );

      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
              tooltip.style.display = 'none';
            }
          }
        )
      );
    };

    // Load the model file
    BABYLON.SceneLoader.ImportMeshAsync('', '', '${modelUrl}', scene)
      .then((result) => {
        const loadedMeshes = result.meshes;
        loadedMeshes.forEach((mesh) => {
          if (mesh instanceof BABYLON.Mesh) {
            mesh.position = BABYLON.Vector3.Zero();
            addHoverInteraction(mesh, "Hot spot example");
          }
        });
      })
      .catch((error) => {
        console.error('Error loading model file:', error);
        alert('Error loading model file: ' + error.message);
      });

    // Add hotspots to the scene
    hotspots.forEach((hs) => {
      const hotspotMesh = BABYLON.MeshBuilder.CreateSphere(\`hotspot-\${hs.id}\`, { diameter: 0.3 }, scene);
      hotspotMesh.position = new BABYLON.Vector3(hs.position.x, hs.position.y, hs.position.z);
      hotspotMesh.rotationQuaternion = new BABYLON.Quaternion(hs.rotation.x, hs.rotation.y, hs.rotation.z, hs.rotation.w);

      const hotspotMaterial = new BABYLON.StandardMaterial(\`mat-\${hs.id}\`, scene);
      hotspotMaterial.diffuseColor = BABYLON.Color3.Red();
      hotspotMesh.material = hotspotMaterial;

      addHoverInteraction(hotspotMesh, hs.content);
    });

    // Variables to manage camera control state
    let userControl = false;
    let animatingToPath = false;

    // Variables for scroll position and target
    let scrollPosition = 0;
    let scrollTarget = 0.01; // Start with a small value to enable scrolling

    // Handle scroll events to move the camera along the path or animate it back
    window.addEventListener('wheel', (event) => {
      if (animatingToPath) return;

      if (userControl) {
        // Animate the camera back to the path
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

        // Find the closest point on the path
        const closestPointInfo = getClosestPointOnPath(camera.position, path);
        const startIndex = closestPointInfo.index;

        // Compute the desired position
        const targetPosition = path[startIndex];

        // Get the corresponding rotation
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

        // Create an animation for position
        const positionAnimation = new BABYLON.Animation(
          'cameraPositionAnimation',
          'position',
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const animationFrames = 120; // Adjust as needed
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

        const currentRotation = camera.rotationQuaternion.clone();
        rotationAnimation.setKeys([
          { frame: 0, value: currentRotation },
          { frame: animationFrames, value: targetRotation },
        ]);

        rotationAnimation.setEasingFunction(easingFunction);

        // Add animations to the camera
        camera.animations = [];
        camera.animations.push(positionAnimation);
        camera.animations.push(rotationAnimation);

        // Begin animations
        scene.beginAnimation(camera, 0, animationFrames, false, 1, function () {
          animatingToPath = false;
          scrollPosition = startIndex;
          scrollTarget = scrollPosition;
        });
      } else {
        // Adjust scrollTarget instead of scrollPosition directly
        const scrollSpeed = 0.1; // Adjust as needed
        scrollTarget += event.deltaY * scrollSpeed;

        // Clamp scrollTarget to the path length
        if (scrollTarget < 0) scrollTarget = 0;
        if (scrollTarget > path.length - 1) scrollTarget = path.length - 1;
      }
    });

    // Helper function to find the closest point on the path to the camera
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

    // Smoothly interpolate scrollPosition towards scrollTarget
    function updateCameraPosition() {
      const scrollInterpolationSpeed = 0.1; // Adjust for desired smoothness
      scrollPosition += (scrollTarget - scrollPosition) * scrollInterpolationSpeed;

      // Ensure scrollPosition stays within bounds
      if (scrollPosition < 0) scrollPosition = 0;
      if (scrollPosition > path.length - 1) scrollPosition = path.length - 1;

      // Update camera position if not animating back to path
      if (!userControl && path.length >= 1) {
        const t = scrollPosition / (path.length - 1 || 1); // Avoid division by zero

        // Calculate segment index and lerp factor
        const totalSegments = waypoints.length - 1;
        if (totalSegments >= 1) {
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          // Interpolate position along the path
          const newPosition = path[Math.floor(scrollPosition)];

          // Interpolate rotations
          const r1 = rotations[clampedSegmentIndex];
          const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];
          const newRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor);

          camera.position.copyFrom(newPosition);

          // Set the camera's rotationQuaternion
          if (!camera.rotationQuaternion) {
            camera.rotationQuaternion = new BABYLON.Quaternion();
          }
          camera.rotationQuaternion.copyFrom(newRotation);
        } else if (rotations.length === 1) {
          // Only one waypoint
          camera.position.copyFrom(path[0]);
          if (!camera.rotationQuaternion) {
            camera.rotationQuaternion = new BABYLON.Quaternion();
          }
          camera.rotationQuaternion.copyFrom(rotations[0]);
        }
      }

      scene.render();
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(() => {
      updateCameraPosition();
    });

    // Prevent default scrolling behavior on the canvas
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
    }, { passive: false });

    // Detect user interaction to enable free camera control
    scene.onPointerObservable.add(function (evt) {
      if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        userControl = true;

        // Switch to Euler angles (rotation) when user takes control
        if (camera.rotationQuaternion) {
          camera.rotation = camera.rotationQuaternion.toEulerAngles();
          camera.rotationQuaternion = null;
        }
      }
    });

    window.addEventListener("keydown", () => {
      userControl = true;

      // Switch to Euler angles (rotation) when user takes control
      if (camera.rotationQuaternion) {
        camera.rotation = camera.rotationQuaternion.toEulerAngles();
        camera.rotationQuaternion = null;
      }
    });

    // Resize the engine on window resize
    window.addEventListener("resize", () => {
      engine.resize();
    });
  </script>
</body>
</html>
  `;
  };

  // UI Components and event handlers (unchanged)
  // ...

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Existing UI components */}
      {/* ... */}

      {/* Feature 1: Dynamic Hotspot System UI */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            top: "10px",
            right: "250px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <h3>Manage Hotspots</h3>
          <button
            onClick={() => {
              const newHotspot: Hotspot = {
                id: `hotspot-${Date.now()}`,
                position:
                  cameraRef.current?.position.clone() ||
                  new BABYLON.Vector3(0, 0, 0),
                rotation:
                  cameraRef.current?.rotationQuaternion?.clone() ||
                  BABYLON.Quaternion.Identity(),
                content: "New Hotspot",
                type: "Info",
                triggered: false,
              };
              setHotspots([...hotspots, newHotspot]);
            }}
          >
            Add Hotspot
          </button>
          {hotspots.map((hotspot, index) => (
            <div key={hotspot.id}>
              <strong>Hotspot {index + 1}</strong>
              <button
                onClick={() =>
                  setHotspots(hotspots.filter((h) => h.id !== hotspot.id))
                }
              >
                Delete
              </button>
              <select
                value={hotspot.type}
                onChange={(e) =>
                  setHotspots(
                    hotspots.map((h) =>
                      h.id === hotspot.id
                        ? {
                            ...h,
                            type: e.target.value as
                              | "Info"
                              | "Pause"
                              | "Animate",
                          }
                        : h
                    )
                  )
                }
              >
                <option value="Info">Info</option>
                <option value="Pause">Pause</option>
                <option value="Animate">Animate</option>
              </select>
              <textarea
                value={hotspot.content}
                onChange={(e) =>
                  setHotspots(
                    hotspots.map((h) =>
                      h.id === hotspot.id
                        ? { ...h, content: e.target.value }
                        : h
                    )
                  )
                }
              />
              {hotspot.type === "Animate" && (
                <select
                  value={hotspot.triggerContent}
                  onChange={(e) =>
                    setHotspots(
                      hotspots.map((h) =>
                        h.id === hotspot.id
                          ? { ...h, triggerContent: e.target.value }
                          : h
                      )
                    )
                  }
                >
                  <option value="">Select Animation</option>
                  {modelAnimations.map((anim, idx) => (
                    <option key={idx} value={anim.name}>
                      {anim.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </Draggable>

      {/* Feature 2: Model Animation Control Board */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            top: "10px",
            left: "450px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <h3>Animation Controls</h3>
          {modelAnimations.map((animGroup, index) => (
            <div key={index}>
              <span>{animGroup.name}</span>
              <button
                onClick={() => animGroup.start(true)}
                disabled={animGroup.isPlaying}
              >
                Play
              </button>
              <button
                onClick={() => animGroup.stop()}
                disabled={!animGroup.isPlaying}
              >
                Stop
              </button>
              <button onClick={() => animGroup.pause()}>Pause</button>
              <button
                onClick={() => {
                  animGroup.stop();
                  animGroup.play();
                }}
              >
                Reset
              </button>
            </div>
          ))}
        </div>
      </Draggable>

      {/* Feature 3: Lighting Control Panel */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            top: "10px",
            right: "450px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <h3>Lighting Controls</h3>
          <div>
            <label>
              Light Type:
              <select
                value={lighting.type}
                onChange={(e) =>
                  setLighting({
                    ...lighting,
                    type: e.target.value as
                      | "PointLight"
                      | "DirectionalLight"
                      | "SpotLight"
                      | "HemisphericLight",
                  })
                }
              >
                <option value="HemisphericLight">Hemispheric Light</option>
                <option value="PointLight">Point Light</option>
                <option value="DirectionalLight">Directional Light</option>
                <option value="SpotLight">Spot Light</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Intensity:
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={lighting.intensity}
                onChange={(e) =>
                  setLighting({
                    ...lighting,
                    intensity: parseFloat(e.target.value),
                  })
                }
              />
              <span>{lighting.intensity}</span>
            </label>
          </div>
          <div>
            <label>
              Color:
              <input
                type="color"
                value={lighting.color}
                onChange={(e) =>
                  setLighting({ ...lighting, color: e.target.value })
                }
              />
            </label>
          </div>
          <div>
            <label>
              Position X:
              <input
                type="number"
                step="0.1"
                value={lighting.position.x}
                onChange={(e) =>
                  setLighting({
                    ...lighting,
                    position: {
                      ...lighting.position,
                      x: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                step="0.1"
                value={lighting.position.y}
                onChange={(e) =>
                  setLighting({
                    ...lighting,
                    position: {
                      ...lighting.position,
                      y: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Z:
              <input
                type="number"
                step="0.1"
                value={lighting.position.z}
                onChange={(e) =>
                  setLighting({
                    ...lighting,
                    position: {
                      ...lighting.position,
                      z: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        </div>
      </Draggable>

      {/* Feature 5: Waypoint Types and Triggers */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            bottom: "70px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            maxHeight: "50vh",
            overflowY: "auto",
            cursor: "move",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>
            Edit Waypoints
          </h3>
          {waypoints.map((wp, index) => (
            <div key={index} style={{ marginBottom: "5px" }}>
              <span>Waypoint {index + 1}: </span>
              <label>
                X:
                <input
                  type="number"
                  step="0.1"
                  value={wp.x}
                  onChange={(e) =>
                    handleWaypointChange(index, "x", e.target.value)
                  }
                  style={{ width: "60px", marginLeft: "5px" }}
                />
              </label>
              <label style={{ marginLeft: "10px" }}>
                Y:
                <input
                  type="number"
                  step="0.1"
                  value={wp.y}
                  onChange={(e) =>
                    handleWaypointChange(index, "y", e.target.value)
                  }
                  style={{ width: "60px", marginLeft: "5px" }}
                />
              </label>
              <label style={{ marginLeft: "10px" }}>
                Z:
                <input
                  type="number"
                  step="0.1"
                  value={wp.z}
                  onChange={(e) =>
                    handleWaypointChange(index, "z", e.target.value)
                  }
                  style={{ width: "60px", marginLeft: "5px" }}
                />
              </label>
              <select
                value={(wp as any).type || "None"}
                onChange={(e) => updateWaypointType(index, e.target.value)}
                style={{ marginLeft: "10px" }}
              >
                <option value="None">None</option>
                <option value="Info">Info</option>
                <option value="Pause">Pause</option>
                <option value="Animate">Animate</option>
              </select>
              {(wp as any).type === "Info" && (
                <textarea
                  value={(wp as any).content || ""}
                  onChange={(e) => updateWaypointContent(index, e.target.value)}
                  placeholder="Info Content"
                  style={{ marginLeft: "10px", width: "200px" }}
                />
              )}
              {(wp as any).type === "Animate" && (
                <select
                  value={(wp as any).triggerContent || ""}
                  onChange={(e) => updateWaypointContent(index, e.target.value)}
                  style={{ marginLeft: "10px" }}
                >
                  <option value="">Select Animation</option>
                  {modelAnimations.map((anim, idx) => (
                    <option key={idx} value={anim.name}>
                      {anim.name}
                    </option>
                  ))}
                </select>
              )}
              {waypoints.length > 1 && (
                <button
                  onClick={() => removeWaypoint(index)}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
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
              marginTop: "10px",
              padding: "5px 10px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Waypoint at Current Position
          </button>
          <button
            onClick={resetWaypointTriggers}
            style={{
              marginTop: "10px",
              marginLeft: "10px",
              padding: "5px 10px",
              backgroundColor: "blue",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reset Waypoint Triggers
          </button>
        </div>
      </Draggable>

      {/* Existing UI components */}
      {/* Controls Info Section */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <button
            onClick={() => setShowControlsInfo(!showControlsInfo)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            {showControlsInfo ? "Hide Controls" : "Show Controls"}
          </button>
          {showControlsInfo && (
            <div style={{ marginTop: "10px" }}>
              <p>
                <strong>Controls:</strong>
              </p>
              <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
                <li>W/A/S/D: Move camera</li>
                <li>Mouse: Look around</li>
                <li>Scroll: Move along path</li>
                <li>
                  Drag and drop a .splat, .ply, .gltf, or .glb file to load
                </li>
                <li>
                  Click "Add Waypoint at Current Position" to add waypoint
                </li>
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
            position: "absolute",
            bottom: "10px",
            left: "10px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>Adjust Parameters</h3>
          <div style={{ marginBottom: "10px" }}>
            <label>
              Scroll Speed:
              <input
                type="number"
                step="0.01"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                style={{ width: "60px", marginLeft: "5px" }}
              />
            </label>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>
              Animation Frames:
              <input
                type="number"
                step="1"
                value={animationFrames}
                onChange={(e) =>
                  setAnimationFrames(parseInt(e.target.value, 10))
                }
                style={{ width: "60px", marginLeft: "5px" }}
              />
            </label>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>
              Camera Speed:
              <input
                type="number"
                step="0.01"
                value={cameraMovementSpeed}
                onChange={(e) =>
                  setCameraMovementSpeed(parseFloat(e.target.value))
                }
                style={{ width: "60px", marginLeft: "5px" }}
              />
            </label>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>
              Camera Rotation Sensitivity:
              <input
                type="number"
                step="1"
                value={cameraRotationSensitivity}
                onChange={(e) =>
                  setCameraRotationSensitivity(parseFloat(e.target.value))
                }
                style={{ width: "60px", marginLeft: "5px" }}
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
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <button
            onClick={() => setShowScrollControls(!showScrollControls)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            {showScrollControls
              ? "Hide Scroll Controls"
              : "Show Scroll Controls"}
          </button>
          {showScrollControls && (
            <div style={{ marginTop: "10px" }}>
              <p>Scroll Position: {Math.round(scrollPercentage)}%</p>
              <button
                onClick={() => adjustScroll(-1)}
                style={{
                  marginRight: "5px",
                  padding: "5px 10px",
                  backgroundColor: "#555",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Backward
              </button>
              <button
                onClick={() => adjustScroll(1)}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#555",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
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
            position: "absolute",
            top: "10px",
            left: "250px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>Load Models</h3>
          {models.map((model, index) => (
            <button
              key={index}
              onClick={() => {
                const url = baseURL + model;
                setLoadedModelUrl(url);
                if (infoTextRef.current)
                  infoTextRef.current.style.display = "none";
                setIsModelLocal(false);
              }}
              style={{
                display: "block",
                marginBottom: "5px",
                padding: "5px 10px",
                backgroundColor: "#555",
                color: "white",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {model}
            </button>
          ))}
          {/* Custom URL Input */}
          <div style={{ marginTop: "10px" }}>
            <input
              type="text"
              placeholder="Enter custom model URL"
              value={customModelUrl}
              onChange={(e) => setCustomModelUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "5px",
                marginBottom: "5px",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => {
                if (customModelUrl) {
                  setLoadedModelUrl(customModelUrl);
                  if (infoTextRef.current)
                    infoTextRef.current.style.display = "none";
                  setIsModelLocal(false);
                } else {
                  alert("Please enter a valid URL.");
                }
              }}
              style={{
                width: "100%",
                padding: "5px 10px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Load Custom Model
            </button>
          </div>
        </div>
      </Draggable>

      {/* Background Color Selector */}
      <Draggable handle=".handle">
        <div
          className="handle"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
            cursor: "move",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>Background Color</h3>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{
              width: "100%",
              height: "40px",
              border: "none",
              cursor: "pointer",
            }}
          />
        </div>
      </Draggable>

      {/* Export Button */}
      <button
        onClick={handleExport}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
          zIndex: 10,
          marginTop: "120px",
        }}
      >
        Export Scene
      </button>

      {/* GitHub link to repository */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "5px 10px",
          borderRadius: "5px",
          color: "white",
          fontSize: "12px",
          zIndex: 10,
        }}
      >
        <a
          href="https://github.com/SonnyC56/gaussian-splatting-viewer"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          Go to Git Repo
        </a>
      </div>

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
        }}
      >
        Please drag and drop a <br /> .splat, .ply, .gltf, or .glb file to load.
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />
    </div>
  );
};

export default App;
