// loadModelFile.ts
import * as BABYLON from "@babylonjs/core";
import addTooltipToMesh from "./AddToolTipToMesh";

/**
 * Asynchronously loads a model file into the BabylonJS scene.
 *
 * @param fileOrUrl - The file or URL of the model to load.
 * @param scene - The BabylonJS scene where the model will be loaded.
 * @param isComponentMounted - Flag to check if the component is still mounted.
 * @param setIsModelLocal - State setter to indicate if the model is loaded locally.
 * @param infoTextRef - Ref to display informational text or errors.
 * @returns A promise that resolves to an array of loaded meshes or undefined if failed.
 */
const loadModelFile = async (
  fileOrUrl: File | string,
  scene: BABYLON.Scene,
  isComponentMounted: boolean,
  setIsModelLocal: React.Dispatch<React.SetStateAction<boolean>>,
  infoTextRef: React.RefObject<HTMLDivElement>
): Promise<BABYLON.AbstractMesh[] | undefined> => {
  // Define supported file extensions
  const loadExtensions = [".splat", ".ply", ".gltf", ".glb"];

  // Determine file extension
  let fileExtension = "";
  if (typeof fileOrUrl === "string") {
    const parts = fileOrUrl.split(".");
    fileExtension = "." + (parts.pop()?.toLowerCase() || "");
  } else {
    const parts = fileOrUrl.name.split(".");
    fileExtension = "." + (parts.pop()?.toLowerCase() || "");
  }

  // Check for supported file formats
  if (!loadExtensions.includes(fileExtension)) {
    alert(
      "Unsupported file format. Please load a .splat, .ply, .gltf, or .glb file."
    );
    return;
  }

  try {
    let result: BABYLON.ISceneLoaderAsyncResult;
    let isLocal = false;

    if (typeof fileOrUrl === "string") {
      // Load from URL
      result = await BABYLON.SceneLoader.ImportMeshAsync("", "", fileOrUrl, scene);
      isLocal = false;
    } else {
      // Load from File - Create a blob URL
      const blobUrl = URL.createObjectURL(fileOrUrl);
      result = await BABYLON.SceneLoader.ImportMeshAsync("", blobUrl, "", scene);
      isLocal = true;
      // Revoke the blob URL after loading
      URL.revokeObjectURL(blobUrl);
    }

    if (!isComponentMounted) return;

    const newMeshes = result.meshes;
    newMeshes.forEach((mesh) => {
      if (mesh instanceof BABYLON.Mesh) {
        mesh.position = BABYLON.Vector3.Zero();
        addTooltipToMesh(mesh, 'tooltip', scene);
      }
    });

    // Hide the info text
    if (infoTextRef.current) infoTextRef.current.style.display = "none";

    setIsModelLocal(isLocal); // Update state based on loading source

    return newMeshes;
  } catch (error) {
    console.error("Error loading model file:", error);
    alert("Error loading model file: " + (error as Error).message);
    return;
  }
};

export default loadModelFile;
