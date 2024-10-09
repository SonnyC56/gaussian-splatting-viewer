import * as SPLAT from "gsplat";

const plyToSplat = async (files: File[]) => {
  const file = files[0];
  if (file) {
    try {
      const scene = new SPLAT.Scene();
      console.log(`Converting PLY file: ${file.name}`);

      // Use LoadFromFileAsync with the File object
      await SPLAT.PLYLoader.LoadFromFileAsync(file, scene);
      console.log(`PLY file ${file.name} converted successfully.`);
      scene.saveToFile(file.name.replace(".ply", ".splat"));
    } catch (error) {
      console.error(`Error converting PLY file ${file.name}:`, error);
      alert(`Error converting PLY file ${file.name}. Please check the console for details.`);
    }
  }
};

export default plyToSplat;
