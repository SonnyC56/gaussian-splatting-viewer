export const generateExportedHTML = (
  modelUrl: string,
  includeUI: boolean,
  waypoints: Array<{
    x: number;
    y: number;
    z: number;
    rotation: { x: number; y: number; z: number; w: number };
    interactions: Array<{ type: string; data: any }>;
  }>,
  backgroundColor: string,
  cameraMovementSpeed: number,
  cameraRotationSensitivity: number,
  scrollSpeed: number,
  animationFrames: number,
  hotspots: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    title: string;
    information?: string;
    photoUrl?: string;
    activationMode: 'click' | 'hover';
    color: string;
  }>
) => {
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
        : ""
    }
    #hotspotContent {
      position: fixed;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 1001;
      max-width: 300px;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      display: none;
    }
    #infoPopup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 1002;
      max-width: 80%;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      display: none;
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
      : ""
  }
  <div id="hotspotContent"></div>
  <div id="infoPopup"></div>
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

    // Initialize rotationQuaternion with the first waypoint's rotation
    camera.rotationQuaternion = new BABYLON.Quaternion(
      ${waypoints[0].rotation.x},
      ${waypoints[0].rotation.y},
      ${waypoints[0].rotation.z},
      ${waypoints[0].rotation.w}
    ).normalize();

    // Ensure Euler angles match the quaternion
    camera.rotation = camera.rotationQuaternion.toEulerAngles();

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

    // Load the model file
    BABYLON.SceneLoader.ImportMeshAsync('', '', '${modelUrl}', scene)
      .then((result) => {
        const loadedMeshes = result.meshes;
        loadedMeshes.forEach((mesh) => {
          if (mesh instanceof BABYLON.Mesh) {
            mesh.position = BABYLON.Vector3.Zero();
          }
        });
      })
      .catch((error) => {
        console.error('Error loading model file:', error);
        alert('Error loading model file: ' + error.message);
      });

    // Prepare waypoints and rotations
    const waypoints = ${JSON.stringify(waypoints)};
    const controlPoints = waypoints.map(
      (wp) => new BABYLON.Vector3(wp.x, wp.y, wp.z)
    );
    const rotations = waypoints.map(
      (wp) => new BABYLON.Quaternion(wp.rotation._x, wp.rotation._y, wp.rotation._z, wp.rotation._w).normalize()
    );

    let path = [];

    if (controlPoints.length >= 2) {
      const positionCurve = BABYLON.Curve3.CreateCatmullRomSpline(
        controlPoints,
        (waypoints.length - 1) * 20, // Increased resolution from 10 to 20
        false
      );
      path = positionCurve.getPoints();
    } else if (controlPoints.length === 1) {
      path = [controlPoints[0]];
    }

    // Create hotspots
    const hotspots = ${JSON.stringify(hotspots)};
    console.log(hotspots);

    hotspots.forEach(hotspot => {
      // Assign default scale if necessary
      const scale = (hotspot.scale._x === 0 && hotspot.scale._y === 0 && hotspot.scale._z === 0)
        ? new BABYLON.Vector3(1, 1, 1) // Default scale
        : new BABYLON.Vector3(hotspot.scale._x, hotspot.scale._y, hotspot.scale._z);

      const sphere = BABYLON.MeshBuilder.CreateSphere(\`hotspot-\${hotspot.id}\`, { diameter: 0.2 }, scene);
      sphere.position = new BABYLON.Vector3(hotspot.position._x, hotspot.position._y, hotspot.position._z);
      sphere.scaling = scale;
      console.log('created sphere, position:', sphere.position, 'scale:', sphere.scaling);
      
      const material = new BABYLON.StandardMaterial(\`hotspot-material-\${hotspot.id}\`, scene);
      material.diffuseColor = BABYLON.Color3.FromHexString(hotspot.color);
      material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color).scale(0.5);
      sphere.material = material;

      // Make sure the hotspot is pickable by the camera
      sphere.isPickable = true;

      sphere.actionManager = new BABYLON.ActionManager(scene);
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => {
            material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color);
            if (hotspot.activationMode === 'hover') {
              showHotspotContent(hotspot);
            }
          }
        )
      );
      sphere.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => {
            material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color).scale(0.5);
            if (hotspot.activationMode === 'hover') {
              hideHotspotContent();
            }
          }
        )
      );
      if (hotspot.activationMode === 'click') {
        sphere.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
              showHotspotContent(hotspot);
            }
          )
        );
      }
    });

    // Function to show hotspot content
    function showHotspotContent(hotspot) {
      const hotspotContent = document.getElementById('hotspotContent');
      hotspotContent.innerHTML = \`
        <h3>\${hotspot.title}</h3>
        \${hotspot.photoUrl ? \`<img src="\${hotspot.photoUrl}" alt="\${hotspot.title}" style="width: 100%; margin-bottom: 10px; border-radius: 5px;">\` : ''}
        \${hotspot.information ? \`<p>\${hotspot.information}</p>\` : ''}
        \${hotspot.activationMode === 'click' ? '<button onclick="hideHotspotContent()" style="width: 100%; padding: 10px; background-color: #4CAF50; border: none; color: white; cursor: pointer; border-radius: 5px;">Close</button>' : ''}
      \`;
      hotspotContent.style.display = 'block';
      positionHotspotContent(hotspotContent);
    }

    // Function to hide hotspot content
    function hideHotspotContent() {
      const hotspotContent = document.getElementById('hotspotContent');
      hotspotContent.style.display = 'none';
    }

    // Function to position hotspot content near the mouse
    function positionHotspotContent(element) {
      const rect = element.getBoundingClientRect();
      let left = scene.pointerX + 10;
      let top = scene.pointerY + 10;

      if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width - 10;
      }
      if (top + rect.height > window.innerHeight) {
        top = window.innerHeight - rect.height - 10;
      }

      element.style.left = \`\${left}px\`;
      element.style.top = \`\${top}px\`;
    }

    // Function to execute interactions
    const executeInteractions = (interactions) => {
      interactions.forEach((interaction) => {
        switch (interaction.type) {
          case "audio":
            playAudio(interaction.data.url);
            break;
          case "info":
            showInfoPopup(interaction.data.text);
            break;
          // Add other interaction types here if needed
        }
      });
    };

    // Function to reverse interactions
    const reverseInteractions = (interactions) => {
      interactions.forEach((interaction) => {
        switch (interaction.type) {
          case "audio":
            stopAudio(interaction.data.url);
            break;
          case "info":
            hideInfoPopup();
            break;
          // Add other interaction types here if needed
        }
      });
    };

    // Function to play audio
    function playAudio(url) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.play().catch(error => console.error('Error playing audio:', error));
    }

    // Function to stop audio
    function stopAudio(url) {
      // Implement audio stopping logic if needed
    }

    // Function to show info popup
    function showInfoPopup(text) {
      const infoPopup = document.getElementById('infoPopup');
      infoPopup.innerHTML = \`
        <p>\${text}</p>
        <button onclick="hideInfoPopup()" style="width: 100%; padding: 10px; background-color: #4CAF50; border: none; color: white; cursor: pointer; border-radius: 5px;">Close</button>
      \`;
      infoPopup.style.display = 'block';
    }

    // Function to hide info popup
    function hideInfoPopup() {
      const infoPopup = document.getElementById('infoPopup');
      infoPopup.style.display = 'none';
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
          ).normalize();
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
          targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor).normalize();
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

    // Helper function to find the closest point on the path
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

    // Initialize target rotation and position
    let targetRotation = camera.rotationQuaternion.clone();
    let targetPosition = camera.position.clone();

    // Active waypoints set
    const activeWaypoints = new Set();

    engine.runRenderLoop(function () {
      // Smoothly interpolate scrollPosition towards scrollTarget
      const scrollInterpolationSpeed = 0.1;
      scrollPosition += (scrollTarget - scrollPosition) * scrollInterpolationSpeed;

      // Clamp scroll position
      scrollPosition = Math.max(0, Math.min(scrollPosition, path.length - 1));

      if (!userControl && path.length >= 1) {
        const t = scrollPosition / (path.length - 1 || 1);

        const totalSegments = waypoints.length - 1;
        if (totalSegments >= 1) {
          const segmentT = t * totalSegments;
          const segmentIndex = Math.floor(segmentT);
          const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
          const lerpFactor = segmentT - clampedSegmentIndex;

          // Calculate target rotation using Slerp
          const r1 = rotations[clampedSegmentIndex];
          const r2 = rotations[clampedSegmentIndex + 1] || rotations[rotations.length - 1];

          targetRotation = BABYLON.Quaternion.Slerp(r1, r2, lerpFactor).normalize();

          // Calculate interpolated position using Lerp
          const floorIndex = Math.floor(scrollPosition);
          const ceilIndex = Math.min(floorIndex + 1, path.length - 1);
          const lerpFactorPos = scrollPosition - floorIndex;

          const interpolatedPosition = BABYLON.Vector3.Lerp(
            path[floorIndex],
            path[ceilIndex],
            lerpFactorPos
          );

          targetPosition = interpolatedPosition;
        } else if (rotations.length === 1) {
          targetRotation = rotations[0].clone();
          targetPosition = path[0].clone();
        }

        // Smoothly interpolate the camera's rotation towards the target rotation
        if (camera.rotationQuaternion) {
          camera.rotationQuaternion = BABYLON.Quaternion.Slerp(
            camera.rotationQuaternion,
            targetRotation,
            0.05 // Damping factor for rotation (adjust between 0 and 1 for smoothness)
          ).normalize();
        }

        // Smoothly interpolate the camera's position towards the target position
        const positionDampingFactor = 0.1; // Adjust between 0 (no movement) and 1 (instant movement)
        camera.position = BABYLON.Vector3.Lerp(
          camera.position,
          targetPosition,
          positionDampingFactor
        );

        // Handle interactions based on waypoints
        waypoints.forEach((wp, index) => {
          const distance = BABYLON.Vector3.Distance(
            camera.position,
            new BABYLON.Vector3(wp.x, wp.y, wp.z)
          );
          const triggerDistance = 1.0; // Define a suitable trigger distance

          if (distance <= triggerDistance) {
            if (!activeWaypoints.has(index)) {
              activeWaypoints.add(index);
              executeInteractions(wp.interactions);
            }
          } else {
            if (activeWaypoints.has(index)) {
              activeWaypoints.delete(index);
              reverseInteractions(wp.interactions);
            }
          }
        });
      }
      scene.render();
    });

    // User interaction detection
    scene.onPointerObservable.add(function (evt) {
      if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
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

    // Resize
    window.addEventListener('resize', function () {
      engine.resize();
    });
  </script>
</body>
</html>
  `;
};