import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface AvatarProps {
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
}

export function Avatar({ analyser, isSpeaking }: AvatarProps) {
  const crystalRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringHighRef = useRef<THREE.Mesh>(null);
  const ringLowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const responsiveScale = Math.min(viewport.width * 0.25, 1.2);

  const crystalMaterial = useMemo(() => new THREE.MeshPhongMaterial({
    color: '#00aaff',
    emissive: '#0044ff',
    emissiveIntensity: 0.5,
    shininess: 100,
    transparent: true,
    opacity: 0.8,
    flatShading: true,
    side: THREE.DoubleSide
  }), []);

  const coreMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  }), []);

  const highLineMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    wireframe: true,
    color: '#00f0ff',
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  }), []);

  const lowLineMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    wireframe: true,
    color: '#00f0ff',
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  }), []);

  const particlesRef = useRef<THREE.Points>(null);
  const particlesCount = 200;

  const particlesPositions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(Math.random() * 2 - 1);
      const r = 0.8 + Math.random() * 2.5;
      positions[i * 3] = r * Math.sin(v) * Math.cos(u);
      positions[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
      positions[i * 3 + 2] = r * Math.cos(v);
    }
    return positions;
  }, []);

  const particlesMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.03,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: '#ffffff'
  }), []);

  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (analyser) {
      setFrequencyData(new Uint8Array(analyser.frequencyBinCount));
    }
  }, [analyser]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const speedMult = isSpeaking ? 2.5 : 0.8;

    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.3 * speedMult;
      crystalRef.current.rotation.z += delta * 0.1 * speedMult;
      crystalRef.current.rotation.x += delta * 0.15 * speedMult;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.5 * speedMult;
      coreRef.current.rotation.x -= delta * 0.2 * speedMult;
    }
    if (ringHighRef.current) {
      ringHighRef.current.rotation.x += delta * 0.4 * speedMult;
      ringHighRef.current.rotation.y += delta * 0.2 * speedMult;
    }
    if (ringLowRef.current) {
      ringLowRef.current.rotation.y -= delta * 0.5 * speedMult;
      ringLowRef.current.rotation.z += delta * 0.3 * speedMult;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.4 * speedMult;
      particlesRef.current.rotation.z -= delta * 0.2 * speedMult;
    }

    let avgFreq = 0;
    if (analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      let sum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      avgFreq = sum / frequencyData.length;
    }

    const normFreq = Math.min(avgFreq / 60, 1.0);
    const hue = (time * 0.05 * speedMult) % 1;
    const dynamicColor = new THREE.Color().setHSL(hue, 1.0, 0.6);

    coreMaterial.color.lerp(dynamicColor, 0.1);
    highLineMaterial.color.lerp(dynamicColor, 0.1);
    lowLineMaterial.color.lerp(dynamicColor, 0.1);
    particlesMaterial.color.lerp(dynamicColor, 0.1);
    crystalMaterial.color.lerp(new THREE.Color().setHSL(hue, 0.6, 0.3), 0.1);
    crystalMaterial.emissive.lerp(new THREE.Color().setHSL(hue, 1.0, 0.2), 0.1);

    if (crystalRef.current) {
      const s = 1.0 + normFreq * 0.05;
      crystalRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
    if (coreRef.current) {
      const s = 0.2 + normFreq * 0.3;
      coreRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
    }
    if (ringHighRef.current) {
      const s = 1.0 + normFreq * 0.1;
      ringHighRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
    if (ringLowRef.current) {
      const s = 1.0 + normFreq * 0.15;
      ringLowRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
    if (particlesRef.current) {
      const s = 1.0 + normFreq * 2.5;
      particlesRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
      const targetOpacity = isSpeaking ? 0.6 + normFreq * 0.4 : 0.4;
      particlesMaterial.opacity += (targetOpacity - particlesMaterial.opacity) * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={responsiveScale}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPositions.length / 3}
            array={particlesPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <primitive object={particlesMaterial} />
      </points>

      <mesh ref={crystalRef}>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
        <primitive object={crystalMaterial} />
      </mesh>

      <mesh ref={coreRef}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <primitive object={coreMaterial} />
      </mesh>

      <mesh ref={ringHighRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <primitive object={highLineMaterial} />
      </mesh>

      <mesh ref={ringLowRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <primitive object={lowLineMaterial} />
      </mesh>
    </group>
  );
}
