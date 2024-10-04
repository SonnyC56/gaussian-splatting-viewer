    
    import * as BABYLON from "@babylonjs/core";
import addTooltipToMesh from "./AddToolTipToMesh";


    // Function to load model file
    const loadModelFile = function (fileOrUrl: File | string, loadedMeshes: BABYLON.AbstractMesh[], scene: BABYLON.Scene, isComponentMounted: boolean, setIsModelLocal: React.Dispatch<React.SetStateAction<boolean>>, infoTextRef: React.RefObject<HTMLDivElement>) {
        // Dispose of existing meshes
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
  
        if (typeof fileOrUrl === "string") {
          // Load from URL
          BABYLON.SceneLoader.ImportMeshAsync("", "", fileOrUrl, scene)
            .then((result) => {
              if (!isComponentMounted) return; // Prevent setting state if unmounted
              loadedMeshes = result.meshes;
              loadedMeshes.forEach((mesh) => {
                if (mesh instanceof BABYLON.Mesh) {
                  mesh.position = BABYLON.Vector3.Zero();
                  addTooltipToMesh(mesh, 'tooltip', scene);
                }
              });
  
              // Hide the info text
              if (infoTextRef.current) infoTextRef.current.style.display = "none";
  
              setIsModelLocal(false); // Model is from URL
            })
            .catch((error) => {
              console.error("Error loading model file:", error);
              alert("Error loading model file: " + error.message);
            });
        } else {
          // Load from File
          // Pass the File object directly to the loader
          BABYLON.SceneLoader.ImportMeshAsync(
            null,
            "",
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
                  addTooltipToMesh(mesh, 'tooltip', scene);
                }
              });
  
              // Hide the info text
              if (infoTextRef.current) infoTextRef.current.style.display = "none";
  
              setIsModelLocal(true); // Model is from local file
            })
            .catch((error) => {
              console.error("Error loading model file:", error);
              alert("Error loading model file: " + error.message);
            });
        }
      };

      export default loadModelFile;