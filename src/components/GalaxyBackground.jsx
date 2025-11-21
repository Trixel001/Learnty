import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GalaxyBackground = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        // --- INIT THREE.JS ---
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

        // --- PARTICLES ---
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 800;
        const posArray = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const colorTeal = new THREE.Color("#0d9488");
        const colorWhite = new THREE.Color("#ffffff");

        for(let i = 0; i < particlesCount * 3; i+=3) {
            posArray[i] = (Math.random() - 0.5) * 15;
            posArray[i+1] = (Math.random() - 0.5) * 15;
            posArray[i+2] = (Math.random() - 0.5) * 15;
            const mixedColor = Math.random() > 0.6 ? colorTeal : colorWhite;
            colors[i] = mixedColor.r;
            colors[i+1] = mixedColor.g;
            colors[i+2] = mixedColor.b;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particlesMesh = new THREE.Points(particlesGeometry, material);
        scene.add(particlesMesh);

        // --- ANIMATION LOOP ---
        let time = 0;
        let animationFrameId;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            time += 0.001;
            particlesMesh.rotation.y = time * 0.5;
            particlesMesh.rotation.x = time * 0.2;
            renderer.render(scene, camera);
        };
        animate();

        // --- RESIZE HANDLER ---
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // --- CLEANUP ---
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            // Dispose Three.js resources to prevent memory leaks
            particlesGeometry.dispose();
            material.dispose();
            renderer.dispose();

            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

export default GalaxyBackground;
