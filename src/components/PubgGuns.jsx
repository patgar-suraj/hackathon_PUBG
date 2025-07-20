import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// Use GUN_FILES everywhere instead of MODEL_FILES
const GUN_FILES = [ "ump.glb", "uzi.glb", "m416Skin.glb"];
const GLOBAL_MODEL_SCALE = 1; // fallback
const GLOBAL_VERTICAL_OFFSET = 0;
const AUTO_VERTICALIZE_DELAY = 1000;

// Per-gun scale and axis adjustment (example values, tweak as needed)
const GUN_MODEL_ADJUST = [
    // UMP
  {
    scale: { x: 2, y: 2, z: 2 },
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: -1.5, z: 0 },
  },
  //   AUG
  {
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 1, z: -1.5 },
  },
  // M416
  {
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: -9.5, z: 0 },
  },
  
    
 
    
];

const isMobile = () =>
  typeof window !== "undefined" &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );

const PubgGuns = () => {
  const canvasRef = useRef(null);
  const modelsRef = useRef([]);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const targetRotations = useRef([]);
  const selectedModelIndex = useRef(null);
  const lastInteractionTimes = useRef([]);
  const scrollRef = useRef(null);

  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [isMobileView, setIsMobileView] = useState(isMobile());
  const [fontSize, setFontSize] = useState(() => {
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;
    const base = Math.min(vw, vh);
    return Math.max(2, Math.min(base * 5, 5)) + "rem";
  });

  // Memoize style objects to avoid unnecessary re-renders
  const textStyles = useMemo(() => ({
    container: {
      display: "flex",
      alignItems: "center",
      gap: "2vw",
      flexDirection: "row",
      position: "relative",
      zIndex: -10,
      width: "100vw",
      overflow: "hidden",
      pointerEvents: "none",
      userSelect: "none",
      padding: "0.5rem 0",
    },
    scrollTrack: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      width: "max-content",
      willChange: "transform",
    },
    outline: {
      fontSize,
      fontWeight: "bold",
      color: "transparent",
      WebkitTextStroke: "2px #fff",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      position: "relative",
      marginRight: "1.5vw",
      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
      userSelect: "none",
      whiteSpace: "nowrap",
      lineHeight: 1.1,
    },
    solid: {
      fontSize,
      fontWeight: "bold",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      position: "relative",
      userSelect: "none",
      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
      whiteSpace: "nowrap",
      lineHeight: 1.1,
    },
  }), [fontSize]);

  const responsiveContainerStyle = useMemo(() => ({
    width: "100vw",
    height: "100dvh",
    minHeight: "100svh",
    minWidth: "100vw",
    overflow: "hidden",
    position: "relative",
    touchAction: "none",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    msUserSelect: "none",
    userSelect: "none",
  }), []);

  const responsiveCanvasStyle = useMemo(() => ({
    width: "100vw",
    height: "100dvh",
    minHeight: "100svh",
    minWidth: "100vw",
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "auto",
    touchAction: "none",
    zIndex: 1,
  }), []);

  const responsiveBgStyle = useMemo(() => ({
    position: "absolute",
    width: "100vw",
    height: "100dvh",
    minHeight: "100svh",
    minWidth: "100vw",
    top: 0,
    left: 0,
    objectFit: "cover",
    zIndex: -99,
    pointerEvents: "none",
    userSelect: "none",
  }), []);

  const responsiveTextOverlayStyle = useMemo(() => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: -10,
    width: "100vw",
    pointerEvents: "none",
    userSelect: "none",
  }), []);

  const arrowBtnStyle = useMemo(() => ({
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 10,
    background: "rgba(0,0,0,0.25)",
    border: "none",
    color: "#fff",
    fontSize: "2.5rem",
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s",
    userSelect: "none",
    outline: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  }), []);

  // Responsive font size calculation
  const getResponsiveFontSize = useCallback(() => {
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;
    const base = Math.min(vw, vh);
    return Math.max(2, Math.min(base * 5, 5)) + "rem";
  }, []);

  // Responsive canvas size
  const setCanvasSize = useCallback((renderer, camera) => {
    const parent = canvasRef.current?.parentElement;
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (parent) {
      width = parent.offsetWidth;
      height = parent.offsetHeight;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, []);

  // Helper to update isMobileView on resize/orientation
  useEffect(() => {
    const updateMobile = () => setIsMobileView(isMobile() || window.innerWidth < 700);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    window.addEventListener("orientationchange", updateMobile);
    return () => {
      window.removeEventListener("resize", updateMobile);
      window.removeEventListener("orientationchange", updateMobile);
    };
  }, []);

  // --- Main Three.js effect ---
  useEffect(() => {
    let animationId, scrollAnimId;
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Move camera a bit closer for better visibility and to fit all guns
    camera.position.z = 7.5;

    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    setCanvasSize(renderer, camera);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    rendererRef.current = renderer;

    // Add lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    [
      { pos: [-30, 10, 20], intensity: 1.2 },
      { pos: [30, 10, 20], intensity: 1.2 },
      { pos: [0, 30, 30], intensity: 1.2 },
      { pos: [0, -30, 30], intensity: 0.7 },
    ].forEach(({ pos, intensity }) => {
      const light = new THREE.DirectionalLight(0xffffff, intensity);
      light.position.set(...pos);
      scene.add(light);
    });

    // Helper to enable DoubleSide on all materials
    const enableDoubleSide = (model) => {
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat && mat.side !== undefined) mat.side = THREE.DoubleSide;
              if (mat && mat.transparent) mat.opacity = 1;
            });
          } else if (child.material.side !== undefined) {
            child.material.side = THREE.DoubleSide;
            if (child.material.transparent) child.material.opacity = 1;
          }
        }
      });
    };

    // Helper to get bounding box size and center
    const getBoundingBox = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      return { size, center, box };
    };

    // Helper to get min/max Y for all models
    const getModelsYBounds = (models) => {
      let minY = Infinity, maxY = -Infinity;
      models.forEach((model) => {
        const { size, center } = getBoundingBox(model);
        minY = Math.min(minY, center.y - size.y / 2);
        maxY = Math.max(maxY, center.y + size.y / 2);
      });
      return { minY, maxY };
    };

    // Helper to get min/max Z for all models
    const getModelsZBounds = (models) => {
      let minZ = Infinity, maxZ = -Infinity;
      models.forEach((model) => {
        const { size, center } = getBoundingBox(model);
        minZ = Math.min(minZ, center.z - size.z / 2);
        maxZ = Math.max(maxZ, center.z + size.z / 2);
      });
      return { minZ, maxZ };
    };

    // Load all models asynchronously
    const loader = new GLTFLoader();
    const loadedModels = [];
    let loadedCount = 0;

    // We'll store the largest model's size to scale all models to fit the viewport
    let maxModelSize = 0;

    GUN_FILES.forEach((filename, idx) => {
      loader.load(
        `./model/${filename}`,
        (gltf) => {
          const model = gltf.scene;
          enableDoubleSide(model);

          // Compute bounding box and scale model to fit viewport
          const { size } = getBoundingBox(model);
          // Find the largest dimension
          const modelMax = Math.max(size.x, size.y, size.z);
          if (modelMax > maxModelSize) maxModelSize = modelMax;

          // We'll scale all models after all are loaded
          loadedModels[idx] = model;
          loadedCount++;
          if (loadedCount === GUN_FILES.length) {
            // Find the largest model size among all
            maxModelSize = loadedModels.reduce((max, m) => {
              const { size } = getBoundingBox(m);
              return Math.max(max, size.x, size.y, size.z);
            }, 0);

            // Compute a scale so that the largest model fits nicely in the viewport
            // We'll use 70% of the viewport width for the total width of all models
            const fovRadians = camera.fov * (Math.PI / 180);
            const camDist = Math.abs(camera.position.z - 0); // models at z=0
            const viewportHeight = 2 * Math.tan(fovRadians / 2) * camDist;
            const viewportWidth = viewportHeight * camera.aspect;
            const targetModelHeight = viewportHeight * 0.6;
            const scale = maxModelSize > 0 ? targetModelHeight / maxModelSize : GLOBAL_MODEL_SCALE;

            // Scale and center all models, then apply per-gun adjustment
            loadedModels.forEach((model, i) => {
              // First, scale to fit viewport
              model.scale.setScalar(scale);

              // Then, apply per-gun scale adjustment (axis-wise)
              const adj = GUN_MODEL_ADJUST[i] || {};
              if (adj.scale) {
                model.scale.x *= adj.scale.x ?? 1;
                model.scale.y *= adj.scale.y ?? 1;
                model.scale.z *= adj.scale.z ?? 1;
              }

              // Recompute bounding box after scaling
              const { size, center } = getBoundingBox(model);

              // Center model at (0,0,0)
              model.position.set(-center.x, -center.y, -center.z);

              // Then, apply per-gun position adjustment
              if (adj.position) {
                model.position.x += adj.position.x ?? 0;
                model.position.y += adj.position.y ?? 0;
                model.position.z += adj.position.z ?? 0;
              }

              // Apply per-gun rotation adjustment
              if (adj.rotation) {
                model.rotation.x = adj.rotation.x ?? 0;
                model.rotation.y = adj.rotation.y ?? 0;
                model.rotation.z = adj.rotation.z ?? 0;
              }
            });

            // --- Justify models horizontally (evenly spaced, all visible, all on same Y and Z) ---
            const modelBoxes = loadedModels.map(getBoundingBox);
            const totalModelWidth = modelBoxes.reduce(
              (sum, box) => sum + box.size.x,
              0
            );
            const n = loadedModels.length;
            // Use 70% of viewport width for all models (so all fit inside screen)
            const worldWidth = viewportWidth * 0.7;
            const totalSpace = Math.max(worldWidth - totalModelWidth, 0);
            const space = n > 1 ? totalSpace / (n - 1) : 0;
            const { minY, maxY } = getModelsYBounds(loadedModels);
            const verticalCenter = (minY + maxY) / 2;

            // Z alignment: find global minZ/maxZ, align all models to the same Z center
            const { minZ, maxZ } = getModelsZBounds(loadedModels);
            const zCenter = (minZ + maxZ) / 2;

            if (isMobile() || window.innerWidth < 700) {
              loadedModels.forEach((model, i) => {
                model.visible = i === currentCharIdx;
                const box = modelBoxes[i];
                // Center vertically and in Z
                model.position.x = -box.center.x;
                model.position.y = -verticalCenter - box.center.y + (0.5 + GLOBAL_VERTICAL_OFFSET);
                model.position.z = -box.center.z - (box.center.z - zCenter);

                // Apply per-gun position adjustment again (in case layout overwrites)
                const adj = GUN_MODEL_ADJUST[i] || {};
                if (adj.position) {
                  model.position.x += adj.position.x ?? 0;
                  model.position.y += adj.position.y ?? 0;
                  model.position.z += adj.position.z ?? 0;
                }

                if (!scene.children.includes(model)) scene.add(model);
              });
            } else {
              // Place all models in a row, centered, with even spacing, all on same Y and Z
              let x = -worldWidth / 2;
              loadedModels.forEach((model, i) => {
                model.visible = true;
                const box = modelBoxes[i];
                // Place model so its left edge is at x, and center vertically and in Z
                model.position.x = x + box.size.x / 2 - box.center.x;
                model.position.y = -verticalCenter - box.center.y + (0.5 + GLOBAL_VERTICAL_OFFSET);
                model.position.z = -box.center.z - (box.center.z - zCenter);

                // Apply per-gun position adjustment again (in case layout overwrites)
                const adj = GUN_MODEL_ADJUST[i] || {};
                if (adj.position) {
                  model.position.x += adj.position.x ?? 0;
                  model.position.y += adj.position.y ?? 0;
                  model.position.z += adj.position.z ?? 0;
                }

                if (!scene.children.includes(model)) scene.add(model);
                x += box.size.x + space;
              });
            }

            modelsRef.current = loadedModels;
            targetRotations.current = loadedModels.map((_, i) => {
              // Use per-gun initial rotation if provided
              const adj = GUN_MODEL_ADJUST[i] || {};
              return {
                x: adj.rotation?.x ?? 0,
                y: adj.rotation?.y ?? 0,
              };
            });
            lastInteractionTimes.current = loadedModels.map(() => Date.now());
          }
        },
        undefined,
        (error) => {
          console.error(
            `An error happened loading the model ${filename}:`,
            error
          );
        }
      );
    });

    // Raycaster for picking models
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Mouse/touch down: pick model
    const handlePointerDown = (e) => {
      isDragging.current = true;
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      lastMouse.current = { x: clientX, y: clientY };

      const rect = canvasRef.current.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      if (modelsRef.current.length) {
        raycaster.setFromCamera(pointer, cameraRef.current);
        let intersects = [];
        modelsRef.current.forEach((model, idx) => {
          if (!model.visible) return;
          const meshes = [];
          model.traverse((child) => {
            if (child.isMesh) meshes.push(child);
          });
          const modelIntersects = raycaster.intersectObjects(meshes, true);
          if (modelIntersects.length > 0) {
            modelIntersects.forEach((inter) => (inter.modelIndex = idx));
            intersects = intersects.concat(modelIntersects);
          }
        });
        if (intersects.length > 0) {
          intersects.sort((a, b) => a.distance - b.distance);
          selectedModelIndex.current = intersects[0].modelIndex;
        } else {
          selectedModelIndex.current = null;
        }
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      selectedModelIndex.current = null;
    };

    const handlePointerMove = (e) => {
      if (!isDragging.current || !modelsRef.current.length) return;
      if (selectedModelIndex.current === null) return;
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const deltaX = clientX - lastMouse.current.x;
      const deltaY = clientY - lastMouse.current.y;
      lastMouse.current = { x: clientX, y: clientY };

      const idx = selectedModelIndex.current;
      if (targetRotations.current[idx]) {
        targetRotations.current[idx].y += deltaX * 0.01;
        targetRotations.current[idx].x += deltaY * 0.01;
        targetRotations.current[idx].x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, targetRotations.current[idx].x)
        );
        lastInteractionTimes.current[idx] = Date.now();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("mousedown", handlePointerDown);
      canvas.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
      canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("touchend", handlePointerUp);
    }

    // Resize event
    const handleResize = () => {
      setCanvasSize(renderer, camera);
      setFontSize(getResponsiveFontSize());
      if (modelsRef.current.length) {
        // Re-center and re-scale models on resize
        let maxModelSize = modelsRef.current.reduce((max, m) => {
          const { size } = getBoundingBox(m);
          return Math.max(max, size.x, size.y, size.z);
        }, 0);

        // Compute a scale so that the largest model fits nicely in the viewport
        const fovRadians = camera.fov * (Math.PI / 180);
        const camDist = Math.abs(camera.position.z - 0);
        const viewportHeight = 2 * Math.tan(fovRadians / 2) * camDist;
        const viewportWidth = viewportHeight * camera.aspect;
        const targetModelHeight = viewportHeight * 0.6;
        const scale = maxModelSize > 0 ? targetModelHeight / maxModelSize : GLOBAL_MODEL_SCALE;

        modelsRef.current.forEach((model, i) => {
          // First, scale to fit viewport
          model.scale.setScalar(scale);

          // Then, apply per-gun scale adjustment (axis-wise)
          const adj = GUN_MODEL_ADJUST[i] || {};
          if (adj.scale) {
            model.scale.x *= adj.scale.x ?? 1;
            model.scale.y *= adj.scale.y ?? 1;
            model.scale.z *= adj.scale.z ?? 1;
          }

          // Recenter
          const { center } = getBoundingBox(model);
          model.position.set(-center.x, -center.y, -center.z);

          // Apply per-gun position adjustment
          if (adj.position) {
            model.position.x += adj.position.x ?? 0;
            model.position.y += adj.position.y ?? 0;
            model.position.z += adj.position.z ?? 0;
          }

          // Apply per-gun rotation adjustment
          if (adj.rotation) {
            model.rotation.x = adj.rotation.x ?? 0;
            model.rotation.y = adj.rotation.y ?? 0;
            model.rotation.z = adj.rotation.z ?? 0;
          }
        });

        // Re-layout horizontally and align Z
        const modelBoxes = modelsRef.current.map(getBoundingBox);
        const totalModelWidth = modelBoxes.reduce(
          (sum, box) => sum + box.size.x,
          0
        );
        const n = modelsRef.current.length;
        const worldWidth = viewportWidth * 0.7;
        const totalSpace = Math.max(worldWidth - totalModelWidth, 0);
        const space = n > 1 ? totalSpace / (n - 1) : 0;
        const { minY, maxY } = getModelsYBounds(modelsRef.current);
        const verticalCenter = (minY + maxY) / 2;

        // Z alignment: find global minZ/maxZ, align all models to the same Z center
        const { minZ, maxZ } = getModelsZBounds(modelsRef.current);
        const zCenter = (minZ + maxZ) / 2;

        if (isMobile() || window.innerWidth < 700) {
          modelsRef.current.forEach((model, i) => {
            model.visible = i === currentCharIdx;
            const box = modelBoxes[i];
            // Fix: add per-gun position.x to the x layout
            model.position.x = -box.center.x + (GUN_MODEL_ADJUST[i]?.position?.x ?? 0);
            model.position.y = -verticalCenter - box.center.y + (0.5 + GLOBAL_VERTICAL_OFFSET) + (GUN_MODEL_ADJUST[i]?.position?.y ?? 0);
            model.position.z = -box.center.z - (box.center.z - zCenter) + (GUN_MODEL_ADJUST[i]?.position?.z ?? 0);

            // Remove duplicate per-gun position adjustment (already applied above)
          });
        } else {
          let x = -worldWidth / 2;
          modelsRef.current.forEach((model, i) => {
            model.visible = true;
            const box = modelBoxes[i];
            // Fix: add per-gun position.x to the x layout
            model.position.x = x + box.size.x / 2 - box.center.x + (GUN_MODEL_ADJUST[i]?.position?.x ?? 0);
            model.position.y = -verticalCenter - box.center.y + (0.5 + GLOBAL_VERTICAL_OFFSET) + (GUN_MODEL_ADJUST[i]?.position?.y ?? 0);
            model.position.z = -box.center.z - (box.center.z - zCenter) + (GUN_MODEL_ADJUST[i]?.position?.z ?? 0);

            // Remove duplicate per-gun position adjustment (already applied above)
            x += box.size.x + space;
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Animation loop
    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      if (
        modelsRef.current.length &&
        targetRotations.current.length === modelsRef.current.length
      ) {
        const now = Date.now();
        modelsRef.current.forEach((model, idx) => {
          if (!model.visible && (isMobileView || window.innerWidth < 700)) return;
          model.rotation.y +=
            (targetRotations.current[idx].y - model.rotation.y) * 0.1;
          model.rotation.x +=
            (targetRotations.current[idx].x - model.rotation.x) * 0.1;
          // --- REMOVE AUTO ROTATION ---
          // if (selectedModelIndex.current !== idx) {
          //   targetRotations.current[idx].y += 0.005;
          // }
          if (
            Math.abs(targetRotations.current[idx].x) > 0.05 &&
            now - (lastInteractionTimes.current[idx] || 0) > AUTO_VERTICALIZE_DELAY &&
            (!isDragging.current || selectedModelIndex.current !== idx)
          ) {
            targetRotations.current[idx].x +=
              (0 - targetRotations.current[idx].x) * 0.05;
            if (Math.abs(targetRotations.current[idx].x) < 0.01) {
              targetRotations.current[idx].x = 0;
            }
          }
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    // Infinite scroll animation for text
    let scrollPos = 0;
    let scrollSpeed = 1.2;

    const updateScrollSpeed = () => {
      if (window.innerWidth < 600) {
        scrollSpeed = 0.5;
      } else if (window.innerWidth < 900) {
        scrollSpeed = 0.8;
      } else {
        scrollSpeed = 1.2;
      }
    };
    updateScrollSpeed();

    function animateScroll() {
      if (scrollRef.current) {
        scrollPos -= scrollSpeed;
        const scrollWidth = scrollRef.current.scrollWidth / 2;
        if (Math.abs(scrollPos) >= scrollWidth) {
          scrollPos = 0;
        }
        scrollRef.current.style.transform = `translateX(${scrollPos}px)`;
      }
      scrollAnimId = requestAnimationFrame(animateScroll);
    }
    animateScroll();

    window.addEventListener("resize", updateScrollSpeed);
    window.addEventListener("orientationchange", updateScrollSpeed);

    // Cleanup
    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", handlePointerDown);
        canvas.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("mouseup", handlePointerUp);
        canvas.removeEventListener("touchstart", handlePointerDown);
        canvas.removeEventListener("touchmove", handlePointerMove);
        window.removeEventListener("touchend", handlePointerUp);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("resize", updateScrollSpeed);
      window.removeEventListener("orientationchange", updateScrollSpeed);
      window.cancelAnimationFrame(animationId);
      window.cancelAnimationFrame(scrollAnimId);
      if (renderer) renderer.dispose();
      if (scene) {
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
    };
    // eslint-disable-next-line
  }, [currentCharIdx, isMobileView, getResponsiveFontSize, setCanvasSize]);

  // Update font size on mount and resize
  useEffect(() => {
    const updateFont = () => setFontSize(getResponsiveFontSize());
    window.addEventListener("resize", updateFont);
    window.addEventListener("orientationchange", updateFont);
    return () => {
      window.removeEventListener("resize", updateFont);
      window.removeEventListener("orientationchange", updateFont);
    };
  }, [getResponsiveFontSize]);

  // --- Mobile swipe/slide logic ---
  useEffect(() => {
    if (!isMobileView) return;
    let startX = null, startY = null, isSwiping = false;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isSwiping || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        setCurrentCharIdx((prev) =>
          dx < 0
            ? Math.min(GUN_FILES.length - 1, prev + 1)
            : Math.max(0, prev - 1)
        );
        isSwiping = false;
      }
    };

    const handleTouchEnd = () => {
      isSwiping = false;
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [isMobileView]);

  // Helper to render a block of text columns (outline/solid)
  const renderTextBlock = useCallback((type = "outline", count = 3) => {
    const style = type === "solid" ? textStyles.solid : textStyles.outline;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <h1 key={i} style={style}>
            GUN SKIN
          </h1>
        ))}
      </div>
    );
  }, [textStyles]);

  const repeatCount = 6;

  return (
    <div style={responsiveContainerStyle}>
      <img
        src="img/BG_char.jpg"
        alt=""
        style={responsiveBgStyle}
        draggable={false}
        aria-hidden="true"
      />
      <div style={responsiveTextOverlayStyle}>
        <div style={textStyles.container}>
          <div ref={scrollRef} style={textStyles.scrollTrack}>
            {Array.from({ length: repeatCount }).map((_, i) => (
              <React.Fragment key={i}>
                {renderTextBlock("outline", 3)}
                {renderTextBlock("solid", 3)}
                {renderTextBlock("outline", 3)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {isMobileView && (
        <>
          <button
            style={{
              ...arrowBtnStyle,
              left: "1.2rem",
              visibility: currentCharIdx === 0 ? "hidden" : "visible",
            }}
            aria-label="Previous Character"
            onClick={() =>
              setCurrentCharIdx((prev) => Math.max(0, prev - 1))
            }
            tabIndex={0}
          >
            &#8592;
          </button>
          <button
            style={{
              ...arrowBtnStyle,
              right: "1.2rem",
              visibility:
                currentCharIdx === GUN_FILES.length - 1
                  ? "hidden"
                  : "visible",
            }}
            aria-label="Next Character"
            onClick={() =>
              setCurrentCharIdx((prev) =>
                Math.min(GUN_FILES.length - 1, prev + 1)
              )
            }
            tabIndex={0}
          >
            &#8594;
          </button>
        </>
      )}
      <canvas
        id="canvas"
        ref={canvasRef}
        style={responsiveCanvasStyle}
        tabIndex={0}
        aria-label="3D PUBG Guns"
      ></canvas>
    </div>
  );
};

export default PubgGuns;
