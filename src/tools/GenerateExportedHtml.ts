export const generateExportedHTML = (
  modelUrl: string,
  includeScrollControls: boolean,
  includeMovementInstructions: boolean,
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
    position: { _x: number; _y: number; _z: number };
    scale: { _x: number; _y: number; _z: number };
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
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; font-family: Arial, sans-serif; }
    #renderCanvas { width: 100%; height: 100%; touch-action: none; }
    ${includeMovementInstructions ? `
    .ui-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 10px;
      color: white;
      z-index: 10;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    ` : ''}
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
      font-size: 14px;
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
      font-size: 16px;
    }
    ${includeScrollControls ? `
    #scrollControls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 10px;
      color: white;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    #scrollPercentage {
      font-size: 18px;
      margin-bottom: 10px;
    }
    #progressBarContainer {
      width: 200px;
      height: 10px;
      background-color: rgba(255,255,255,0.3);
      border-radius: 5px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    #progressBar {
      width: 0%;
      height: 100%;
      background-color: #4CAF50;
      transition: width 0.3s ease;
    }
    .button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 5px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #45a049;
    }
    #scrollButtons {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    ` : ''}
    #muteButton {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      z-index: 1000;
    }

    #preloader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #1e1e1e;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      transition: opacity 0.5s ease-out;
    }

    #preloader.hidden {
      opacity: 0;
      pointer-events: none;
    }

    #preloader h1 {
      font-size: 48px;
      color: #ffffff;
      text-align: center;
      font-family: 'Courier New', monospace;
    }

    #preloader .spinner {
      width: 25px;
      height: 25px;
      border: 5px solid #ffffff;
      border-top: 5px solid #F76900;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
<div id="preloader">
      <h1>Story Splat</h1>
      <div class="spinner"></div>
  </div>
  <canvas id="renderCanvas"></canvas>
  ${includeMovementInstructions ? `
  <div class="ui-overlay">
    <p><strong>Controls:</strong></p>
    <p>• W/A/S/D: Move camera</p>
    <p>• Mouse: Look around</p>
    <p>• Scroll: Move along path</p>
  </div>
  ` : ''}
  <div id="hotspotContent"></div>
  <div id="infoPopup"></div>
  ${includeScrollControls ? `
  <div id="scrollControls">
    <div id="scrollPercentage">0%</div>
    <div id="progressBarContainer">
      <div id="progressBar"></div>
    </div>
    <div id="scrollButtons">
      <button class="button" onclick="adjustScroll(-1)">◀ Backward</button>
      <button class="button" onclick="adjustScroll(1)">Forward ▶</button>
    </div>
  </div>
  ` : ''}
  <button id="muteButton">🔇 Unmute</button>
  <!-- Babylon.js CDN -->
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
  <script>
    const preloader = document.getElementById('preloader');
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
    camera.angularSensitivity = ${cameraRotationSensitivity};

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
        // Hide the preloader after the model is loaded
        preloader.classList.add('hidden');
      })
      .catch((error) => {
        console.error('Error loading model file:', error);
        alert('Error loading model file: ' + error.message);
        preloader.classList.add('hidden');
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
      const scale = (hotspot.scale._x === 0 && hotspot.scale._y === 0 && hotspot.scale._z === 0)
        ? new BABYLON.Vector3(1, 1, 1) 
        : new BABYLON.Vector3(hotspot.scale._x, hotspot.scale._y, hotspot.scale._z);

      const sphere = BABYLON.MeshBuilder.CreateSphere(\`hotspot-\${hotspot.id}\`, { diameter: 0.2 }, scene);
      sphere.position = new BABYLON.Vector3(hotspot.position._x, hotspot.position._y, hotspot.position._z);
      sphere.scaling = scale;
      console.log('created sphere, position:', sphere.position, 'scale:', sphere.scaling);
      
      const material = new BABYLON.StandardMaterial(\`hotspot-material-\${hotspot.id}\`, scene);
      material.diffuseColor = BABYLON.Color3.FromHexString(hotspot.color);
      material.emissiveColor = BABYLON.Color3.FromHexString(hotspot.color).scale(0.5);
      sphere.material = material;

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

    // Audio context and mute state
    let audioContext;
    let isMuted = true;
    const activeAudios = {};

    // Initialize audio context
    function initAudioContext() {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Function to play audio
    function playAudio(url) {
      if (isMuted) return;

      if (!audioContext) {
        initAudioContext();
      }

      if (activeAudios[url]) {
        if (activeAudios[url].source) {
          activeAudios[url].source.stop();
        }
        activeAudios[url].source = audioContext.createBufferSource();
        activeAudios[url].source.buffer = activeAudios[url].buffer;
        activeAudios[url].source.connect(audioContext.destination);
        activeAudios[url].source.loop = true;
        activeAudios[url].source.start();
      } else {
        fetch(url)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
          .then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.loop = true;
            source.start();
            activeAudios[url] = { source: source, buffer: audioBuffer };
          })
          .catch(error => console.error('Error loading audio:', error));
      }
    }

    // Function to stop audio
    function stopAudio(url) {
      if (activeAudios[url] && activeAudios[url].source) {
        activeAudios[url].source.stop();
      }
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

    // Function to update scroll percentage and progress bar
    function updateScrollUI(percentage) {
      const scrollPercentage = document.getElementById('scrollPercentage');
      const progressBar = document.getElementById('progressBar');
      if (scrollPercentage && progressBar) {
        scrollPercentage.textContent = \`\${Math.round(percentage)}%\`;
        progressBar.style.width = \`\${percentage}%\`;
      }
    }

    // Function to adjust scroll
    function adjustScroll(direction) {
      const increment = 10;
      const pathLength = path.length;
      if (pathLength > 1) {
        const scrollIncrement = (pathLength - 1) * (increment / 100) * direction;
        scrollTarget += scrollIncrement;

        if (scrollTarget < 0) scrollTarget = 0;
        if (scrollTarget > path.length - 1) scrollTarget = path.length - 1;

        userControl = false;
      }
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

    //create floor mesh at  y = 0
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, scene);    

    // WebXR setup
    const xr = scene.createDefaultXRExperienceAsync({
      floorMeshes: [ground],
    });


    engine.runRenderLoop(function () {
      // Smoothly interpolate scrollPosition towards scrollTarget
      const scrollInterpolationSpeed = 0.1;
      scrollPosition += (scrollTarget - scrollPosition) * scrollInterpolationSpeed;

      // Clamp scroll position
      scrollPosition = Math.max(0, Math.min(scrollPosition, path.length - 1));

      // Update UI
      const scrollPercentage = (scrollPosition / (path.length - 1)) * 100;
      if(${includeScrollControls}){
         updateScrollUI(scrollPercentage);
      }

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

    // Mute button functionality
    const muteButton = document.getElementById('muteButton');
    muteButton.addEventListener('click', function() {
      isMuted = !isMuted;
      muteButton.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
      
      if (isMuted) {
        Object.values(activeAudios).forEach(audio => {
          if (audio.source) {
            audio.source.stop();
          }
        });
      } else {
        // Reinitialize audio context if it was not created before
        if (!audioContext) {
          initAudioContext();
        }
        // Replay active audios
        activeWaypoints.forEach(index => {
          waypoints[index].interactions.forEach(interaction => {
            if (interaction.type === 'audio') {
              playAudio(interaction.data.url);
            }
          });
        });
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