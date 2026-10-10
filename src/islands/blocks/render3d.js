// Three.js 积木渲染器：可旋转视角 / 逐层剥离 / 透视幽灵 / 露面上色 / 视角飞行 / 点击搭建
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { key } from './cubes.js'
import { exposedFaces } from './views.js'
import { sfx } from '../../core/sound.js'

const PALETTE = [0x6ea8ff, 0xffb26b, 0x7bd88f, 0xff8fa3, 0xb39dff, 0x5fd4d0]
const GRAY = 0xd7e0ec
const FACE_COLOR = 0xff6b6b

// face 顺序：+x -x +y -y +z -z
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]

export function createScene(holder, { onTapCell } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  holder.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 5 / 3.4, 0.1, 100)
  camera.position.set(6.5, 5.2, 8.5)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI * 0.52
  controls.minDistance = 4
  controls.maxDistance = 22
  controls.target.set(0.8, 0.6, 0.8)

  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const sun = new THREE.DirectionalLight(0xffffff, 1.4)
  sun.position.set(5, 10, 6)
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0xbfe0ff, 0.5)
  fill.position.set(-6, 4, -5)
  scene.add(fill)

  // 底座 + 网格地面
  const G = 5 // 地面 5x5，格子坐标 0..4
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(G + 0.6, 0.3, G + 0.6),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  )
  base.position.set((G - 1) / 2, -0.15, (G - 1) / 2)
  scene.add(base)
  const grid = new THREE.GridHelper(G, G, 0xaac4e2, 0xd6e5f5)
  grid.position.set((G - 1) / 2, 0.01, (G - 1) / 2)
  scene.add(grid)

  const group = new THREE.Group()
  scene.add(group)

  const geo = new THREE.BoxGeometry(0.92, 0.92, 0.92)
  const edgeGeo = new THREE.EdgesGeometry(geo)
  const colorFor = i => PALETTE[i % PALETTE.length]

  let cells = []
  let mode = 'normal'
  let layerLimit = Infinity
  let disposed = false

  function clearGroup() {
    while (group.children.length) {
      const m = group.children.pop()
      m.traverse(o => o.material && o.material.dispose && o.material.dispose())
      group.remove(m)
    }
  }

  function makeCube(x, y, z, color, opacity = 1) {
    const mats = []
    for (let f = 0; f < 6; f++) {
      mats.push(new THREE.MeshLambertMaterial({
        color, transparent: opacity < 1 || mode !== 'normal', opacity,
      }))
    }
    const mesh = new THREE.Mesh(geo, mats)
    mesh.position.set(x, z + 0.5, y)
    const edge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: opacity < 1 ? 0.25 : 0.5,
    }))
    mesh.add(edge)
    mesh.userData.cell = [x, y, z]
    return mesh
  }

  function paintExposed(mesh, set) {
    const [x, y, z] = mesh.userData.cell
    const colors = mesh.material.map((m, f) => {
      const [dx, dy, dz] = DIRS[f]
      return set.has(key(x + dx, y + dy, z + dz)) ? GRAY : FACE_COLOR
    })
    mesh.material.forEach((m, f) => {
      m.color.setHex(colors[f])
      m.transparent = true
      m.opacity = colors[f] === FACE_COLOR ? 1 : 0.22
    })
    mesh.children[0].material.opacity = 0.35
  }

  function sync() {
    if (disposed) return
    clearGroup()
    const set = new Set(cells.map(c => key(...c)))
    const maxZ = cells.reduce((m, c) => Math.max(m, c[2]), 0)
    cells.forEach((c, i) => {
      const [x, y, z] = c
      if (z >= layerLimit) return
      let mesh
      if (mode === 'expose') {
        mesh = makeCube(x, y, z, GRAY)
        paintExposed(mesh, set)
      } else {
        const ghost = mode === 'ghost' || z >= maxZ && mode === 'peel-top'
        mesh = makeCube(x, y, z, colorFor(x * 7 + y * 3 + z), ghost ? 0.32 : 1)
      }
      group.add(mesh)
    })
  }

  // ---------- 视角飞行（看一看的辅助） ----------
  const VIEWS = {
    front: { pos: [(G - 1) / 2, 2.2, -6.5], tgt: [(G - 1) / 2, 1.2, 0] },
    top: { pos: [(G - 1) / 2, 12, 0.9], tgt: [(G - 1) / 2, 0, 0] },
    left: { pos: [-6.5, 2.2, (G - 1) / 2], tgt: [0, 1.2, (G - 1) / 2] },
  }
  let flying = false
  function flyTo(name, backAfter = 0) {
    const v = VIEWS[name]
    if (!v || flying) return
    flying = true
    const p0 = camera.position.clone(), t0 = controls.target.clone()
    const p1 = new THREE.Vector3(...v.pos), t1 = new THREE.Vector3(...v.tgt)
    const t = { k: 0 }
    const animate = new Promise(res => {
      const step = () => {
        t.k += 0.045
        const k = Math.min(t.k, 1)
        const ease = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        camera.position.lerpVectors(p0, p1, ease)
        controls.target.lerpVectors(t0, t1, ease)
        if (k < 1) requestAnimationFrame(step)
        else res()
      }
      step()
    })
    animate.then(() => new Promise(r => setTimeout(r, backAfter))).then(() => {
      if (backAfter > 0 && !disposed) {
        const p2 = camera.position.clone(), t2 = controls.target.clone()
        const t2o = { k: 0 }
        const step2 = () => {
          t2o.k += 0.045
          const k = Math.min(t2o.k, 1)
          camera.position.lerpVectors(p2, p0, k)
          controls.target.lerpVectors(t2, t0, k)
          if (k < 1 && !disposed) requestAnimationFrame(step2)
          else flying = false
        }
        step2()
      } else flying = false
    })
  }

  // ---------- 点击/触摸搭建 ----------
  const ray = new THREE.Raycaster()
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  if (onTapCell) {
    let downAt = null
    renderer.domElement.addEventListener('pointerdown', e => {
      downAt = { x: e.clientX, y: e.clientY }
    })
    renderer.domElement.addEventListener('pointerup', e => {
      if (!downAt) return
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y)
      downAt = null
      if (moved > 6) return // 拖动视角不算点击
      const rect = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      ray.setFromCamera(ndc, camera)
      const hits = ray.intersectObjects(group.children, false)
      let cell = null
      if (hits.length) {
        const [x, y, z] = hits[0].object.userData.cell
        cell = [x, y, z + 1] // 点在方块上 → 往上叠
      } else {
        const pt = new THREE.Vector3()
        if (ray.ray.intersectPlane(groundPlane, pt)) {
          const x = Math.round(pt.x), y = Math.round(pt.z)
          if (x >= 0 && x < G && y >= 0 && y < G) cell = [x, y, 0]
        }
      }
      if (cell) onTapCell(cell)
    })
  }

  // ---------- 尺寸与主循环 ----------
  function resize() {
    const w = holder.clientWidth, h = holder.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(holder)
  resize()

  ;(function loop() {
    if (disposed) return
    requestAnimationFrame(loop)
    controls.update()
    renderer.render(scene, camera)
  })()

  return {
    groundSize: G,
    setCells(next) { cells = next.slice(); sync() },
    getCells: () => cells.slice(),
    setMode(m) { mode = m; sync() },
    setLayerLimit(k) { layerLimit = k; sync() },
    flyTo,
    dispose() { disposed = true; renderer.dispose(); renderer.domElement.remove() },
  }
}
