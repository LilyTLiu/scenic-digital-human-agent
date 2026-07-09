import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type Emotion = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'sad'

interface Props {
  speaking: boolean
  emotion?: Emotion
  listening?: boolean
  size?: number
  mouthOpen?: number
}

// ── 顶点索引缓存 ──
interface VertexGroups {
  jaw: number[]
  lowerLip: number[]
}

export default function DigitalHuman3D({
  speaking,
  emotion = 'neutral',
  listening = false,
  size = 280,
  mouthOpen = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    headMesh: THREE.Mesh
    originalPositions: Float32Array
    vertexGroups: VertexGroups
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    frameId: number
    blinkTimer: number
    nextBlink: number
    isBlinking: boolean
    blinkProgress: number
    idleTime: number
  } | null>(null)
  const loadedRef = useRef(false)

  // ── 分析顶点：找出下颚区域 ──
  function analyzeFaceVertices(positions: Float32Array): VertexGroups {
    const jaw: number[] = []
    const lowerLip: number[] = []

    // 计算 Y 中位数作为嘴巴分界线
    const ys: number[] = []
    for (let i = 0; i < positions.length; i += 3) {
      ys.push(positions[i + 1])
    }
    ys.sort((a, b) => a - b)

    // 找到嘴巴区域：人脸模型中嘴巴通常在 Y 中位数附近
    const midY = ys[Math.floor(ys.length / 2)] - 0.05

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]
      const z = positions[i + 2]
      // 下颚：Y 低于嘴巴线 且 Z 在脸部前方
      if (y < midY && z > 0.02) {
        jaw.push(i / 3)
        // 更靠下的顶点是下唇
        if (y < midY - 0.03) {
          lowerLip.push(i / 3)
        }
      }
    }

    return { jaw, lowerLip }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    // ── Scene setup ──
    const scene = new THREE.Scene()
    scene.background = null

    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 10)
    camera.position.set(0, 0.08, 4.5)
    camera.lookAt(0, 0.02, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 0.95)
    key.position.set(3, 1.5, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xd4c8b8, 0.4)
    fill.position.set(-2, 0.5, 2)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0x8090b0, 0.5)
    rim.position.set(0, 2, -3)
    scene.add(rim)

    // ── 背景球（用于渐变投射）──
    const bgGeom = new THREE.SphereGeometry(2.8, 32, 32)
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color('#dce3ed') },
        uColor2: { value: new THREE.Color('#8a9fb8') },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 uColor1, uColor2;
        void main() {
          float t = smoothstep(-1.8, 1.8, vPos.y);
          gl_FragColor = vec4(mix(uColor2, uColor1, t), 1.0);
        }
      `,
      side: THREE.BackSide,
    })
    const bg = new THREE.Mesh(bgGeom, bgMat)
    scene.add(bg)

    // ── Load GLB ──
    const loader = new GLTFLoader()
    loader.load('/models/LeePerrySmith.glb', (gltf) => {
      const mesh = gltf.scene.getObjectByProperty('type', 'Mesh') as THREE.Mesh
      if (!mesh) return

      // 更新材质
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
      mat.roughness = 0.58
      mat.metalness = 0.02
      mat.color = new THREE.Color('#e8d5c4')
      mesh.material = mat

      // 微调位置和缩放
      mesh.position.set(0, -0.08, 0)
      mesh.scale.setScalar(1.65)
      scene.add(mesh)

      // 分析顶点
      const geom = mesh.geometry.clone()
      const positions = geom.getAttribute('position').array as Float32Array
      const original = new Float32Array(positions)
      const vg = analyzeFaceVertices(positions)

      const state = {
        headMesh: mesh,
        originalPositions: original,
        vertexGroups: vg,
        renderer, scene, camera, frameId: 0,
        blinkTimer: 0, nextBlink: 3, isBlinking: false, blinkProgress: 0, idleTime: 0,
      }
      sceneRef.current = state
      loadedRef.current = true
      animate(state)
    })

    // ── 在被加载前先用简单的旋转头像 ──
    const placeholderGeom = new THREE.SphereGeometry(0.9, 32, 32)
    const placeholderMat = new THREE.MeshStandardMaterial({ color: 0xe0cfc0, roughness: 0.7 })
    const placeholder = new THREE.Mesh(placeholderGeom, placeholderMat)
    placeholder.name = 'placeholder'
    scene.add(placeholder)
    camera.lookAt(0, 0, 0)

    function animate(state: NonNullable<typeof sceneRef.current>) {
      state.frameId = requestAnimationFrame(() => animate(state))
      const dt = Math.min(0.1, 1 / 60)

      // Blink timer
      state.blinkTimer += dt
      if (state.isBlinking) {
        state.blinkProgress += dt * 6
        if (state.blinkProgress >= 1) {
          state.blinkProgress = 0
          state.isBlinking = false
          state.nextBlink = 2 + Math.random() * 5
        }
      } else if (state.blinkTimer >= state.nextBlink) {
        state.blinkTimer = 0
        state.isBlinking = true
        state.blinkProgress = 0
      }

      // Mouth animation: move jaw vertices
      const pos = state.headMesh.geometry.getAttribute('position')
      const arr = pos.array as Float32Array
      const orig = state.originalPositions
      const { jaw, lowerLip } = state.vertexGroups

      const mo = speaking ? 0.05 + mouthOpen * 0.95 : 0.02

      // 对每个下颚顶点施加下移
      for (const vi of jaw) {
        const idx = vi * 3
        const isLowerLip = lowerLip.includes(vi)
        const moveAmount = mo * (isLowerLip ? 0.025 : 0.012)
        // 张嘴：Y 下移 + Z 微前移（模拟下巴旋转）
        arr[idx + 1] = orig[idx + 1] - moveAmount
        arr[idx + 2] = orig[idx + 2] + moveAmount * 0.3
      }

      // Blink: 简单缩放眼部区域（通过把上眼睑顶点下移）
      if (state.isBlinking) {
        const blinkT = Math.sin(state.blinkProgress * Math.PI) // 0→1→0
        // 找到眼睛上方顶点并下移
        for (let i = 0; i < arr.length; i += 3) {
          const y = orig[i + 1]
          const z = orig[i + 2]
          // 眼睛区域：大约在 Y=0.22~0.28, Z>0.07
          if (y > 0.22 && y < 0.35 && z > 0.06) {
            arr[i + 1] = orig[i + 1] - blinkT * 0.04
          }
        }
      }

      pos.needsUpdate = true

      // Idle sway
      state.idleTime += dt
      const sway = Math.sin(state.idleTime * 0.6) * 0.015
      state.headMesh.rotation.y = sway
      state.headMesh.rotation.x = Math.sin(state.idleTime * 0.45) * 0.008

      // Speaking head nod
      if (speaking) {
        state.headMesh.rotation.y += Math.sin(state.idleTime * 2.2) * 0.02
        state.headMesh.position.y = Math.sin(state.idleTime * 2.8) * 0.015
      } else {
        state.headMesh.position.y += (0 - state.headMesh.position.y) * 0.1
      }

      // Listening pulse
      if (listening) {
        state.headMesh.position.z = Math.sin(state.idleTime * 3.5) * 0.03
      } else {
        state.headMesh.position.z += (0 - state.headMesh.position.z) * 0.1
      }

      // Remove placeholder when model loaded
      const ph = scene.getObjectByName('placeholder')
      if (ph && state.headMesh.parent) {
        scene.remove(ph)
      }

      renderer.render(scene, camera)
    }

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId)
      }
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [size])

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 40%, #dce3ed 0%, #8a9fb8 100%)',
        boxShadow: listening
          ? '0 0 0 3px rgba(200,150,62,0.4), 0 0 0 8px rgba(200,150,62,0.15)'
          : speaking
            ? '0 0 0 2px rgba(100,180,140,0.3)'
            : '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.4s',
      }}
    />
  )
}
