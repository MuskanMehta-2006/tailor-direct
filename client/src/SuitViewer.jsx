
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useFBX,
  useAnimations,
} from "@react-three/drei";
import * as THREE from "three";
import "./SuitViewer.css";

function MaleModel() {
  const fbx = useFBX("/models/man7.fbx");
  const modelRef = useRef();

  const { actions, names } = useAnimations(
    fbx.animations,
    modelRef
  );

  useEffect(() => {
    console.log("Animation clips:", names);

    const walkClip = names.find((name) =>
      /walk|walking/i.test(name)
    );

    const selectedClip = walkClip || names[0];
    const action = actions[selectedClip];

    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();

    return () => action.stop();
  }, [actions, names]);

  // Diagonal luxury runway movement
  useFrame((_, delta) => {
    if (!modelRef.current) return;

    const model = modelRef.current;

    // Move diagonally towards camera
    model.position.x += delta * 0.45;
    model.position.z += delta * 0.9;

    // Slight diagonal body orientation
    model.rotation.y = 0.30;

    // Smoothly repeat runway movement
    if (model.position.z > 65) {
      model.position.set(-35, 0, -70);
    }
  });

  return (
    <group
      ref={modelRef}
      position={[-35, 0, -70]}
      rotation={[0, 0.20, 0]}
    >
      <primitive object={fbx} />
    </group>
  );
}

function Scene() {
  return (
    <>
      {/* Luxury studio background */}
      <color attach="background" args={["#e8e3d9"]} />

      {/* Soft studio lighting */}
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[100, 300, 200]}
        intensity={2}
      />

      <directionalLight
        position={[-200, 250, -200]}
        intensity={1}
      />

      <directionalLight
        position={[0, 150, 300]}
        intensity={0.7}
      />

      {/* Studio floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
  color="#e8e3d9"
  roughness={0.95}
/>
      </mesh>

      <Suspense fallback={null}>
        <MaleModel />
      </Suspense>

      {/* Interactive camera */}
      <OrbitControls
        makeDefault
        target={[0, 103, 0]}
        autoRotate={false}
        enableRotate={true}
        enableZoom={true}
        enablePan={false}
        enableDamping={true}
        dampingFactor={0.05}
        minPolarAngle={0.4}
        maxPolarAngle={2.7}
        minDistance={180}
        maxDistance={650}
        rotateSpeed={0.8}
      />
    </>
  );
}

export default function SuitViewer() {
  return (
    <div className="suit-viewer">
      <Canvas
        camera={{
          position: [0, 103, 400],
          fov: 35,
        }}
        dpr={1}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

useFBX.preload("/models/man7.fbx");
