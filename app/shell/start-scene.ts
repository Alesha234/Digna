// @ts-nocheck
// The engine's 3D scenes (Ignesis shell). Use them through Scene3D.
export const startScene = function startScene(THREE, canvas, o) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !o.light, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.light ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const accent = new THREE.Color(o.accent);
    const second = new THREE.Color(o.second);
    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(second, 18, 20);
    rim.position.set(-4, -2, 2);
    scene.add(rim);
    const owned = [];
    const keep = (x) => {
        owned.push(x);
        return x;
    };
    let move = () => { };
    const n = (full) => Math.round(o.light ? full * 0.45 : full);
    // A soft round dot, drawn here, so points are circles rather than squares.
    const paper = document.createElement("canvas");
    paper.width = paper.height = 64;
    const pen = paper.getContext("2d");
    if (pen) {
        const glow = pen.createRadialGradient(32, 32, 0, 32, 32, 32);
        glow.addColorStop(0, "rgba(255,255,255,1)");
        glow.addColorStop(0.45, "rgba(255,255,255,0.9)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        pen.fillStyle = glow;
        pen.fillRect(0, 0, 64, 64);
    }
    const dot = keep(new THREE.CanvasTexture(paper));
    /** Points coloured from the accent to the second color by `mix(i)` (0 to 1). */
    const dots = (positions, size, mix) => {
        const geometry = keep(new THREE.BufferGeometry());
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const colors = new Float32Array(positions.length);
        const c = new THREE.Color();
        for (let i = 0; i < positions.length / 3; i++) {
            c.copy(accent).lerp(second, mix(i));
            colors.set([c.r, c.g, c.b], i * 3);
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const material = keep(new THREE.PointsMaterial({ size: size * 1.6, map: dot, alphaTest: 0.01, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: true }));
        return new THREE.Points(geometry, material);
    };
    if (o.kind === "orb") {
        const geometry = keep(new THREE.SphereGeometry(1.5, n(128), n(64)));
        const base = Float32Array.from(geometry.attributes.position.array);
        const material = keep(new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 1, sheenColor: second }));
        const orb = new THREE.Mesh(geometry, material);
        group.add(orb);
        const pos = geometry.attributes.position;
        move = (t) => {
            for (let i = 0; i < pos.count; i++) {
                const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
                const d = 1 + 0.12 * Math.sin(x * 1.8 + t * 0.9) * Math.sin(y * 2.1 + t * 1.1) + 0.06 * Math.sin(z * 3 + t * 1.4);
                pos.setXYZ(i, x * d, y * d, z * d);
            }
            pos.needsUpdate = true;
            geometry.computeVertexNormals();
            orb.rotation.y = t * 0.15;
        };
    }
    else if (o.kind === "waves") {
        // A wide, shallow field low in the section, so its far edge stays below the words.
        const across = n(90), deep = n(40);
        const positions = new Float32Array(across * deep * 3);
        for (let i = 0; i < across; i++)
            for (let j = 0; j < deep; j++)
                positions.set([(i / (across - 1) - 0.5) * 13, 0, (j / (deep - 1) - 0.5) * 5 + 1], (i * deep + j) * 3);
        const points = dots(positions, o.light ? 0.07 : 0.05, (i) => Math.floor(i / deep) / across);
        points.rotation.x = 0.2;
        points.position.y = -1.6;
        group.add(points);
        const pos = points.geometry.attributes.position;
        move = (t) => {
            for (let i = 0; i < pos.count; i++)
                pos.setY(i, Math.sin(pos.getX(i) * 0.6 + t * 0.9) * 0.4 + Math.cos(pos.getZ(i) * 0.5 + t * 0.7) * 0.4);
            pos.needsUpdate = true;
        };
    }
    else if (o.kind === "particles") {
        const count = n(1600);
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 1.5 + Math.random() * 3.5, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
            positions.set([r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a) * 0.7, r * Math.cos(b)], i * 3);
        }
        const points = dots(positions, o.light ? 0.06 : 0.045, () => Math.random());
        points.material.blending = THREE.AdditiveBlending;
        group.add(points);
        move = (t) => {
            points.rotation.y = t * 0.05;
            points.rotation.x = Math.sin(t * 0.2) * 0.1;
        };
    }
    else if (o.kind === "rings") {
        const rings = [2, 1.55, 1.1].map((r, i) => {
            const color = i === 1 ? second : i === 0 ? accent : accent.clone().lerp(second, 0.5);
            const mesh = new THREE.Mesh(keep(new THREE.TorusGeometry(r, 0.08, n(24), n(160))), keep(new THREE.MeshStandardMaterial({ color, metalness: 0.65, roughness: 0.25 })));
            group.add(mesh);
            return mesh;
        });
        move = (t) => {
            rings[0].rotation.set(t * 0.3, t * 0.2, 0);
            rings[1].rotation.set(-t * 0.25, 0, t * 0.35);
            rings[2].rotation.set(0, t * 0.4, -t * 0.2);
        };
    }
    else if (o.kind === "globe") {
        const count = n(2000);
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Even spacing over the sphere (the golden-angle spiral).
            const y = 1 - (2 * (i + 0.5)) / count, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
            positions.set([Math.cos(a) * r * 1.8, y * 1.8, Math.sin(a) * r * 1.8], i * 3);
        }
        const points = dots(positions, o.light ? 0.05 : 0.035, (i) => (i % 5 === 0 ? 0 : 1));
        const core = new THREE.Mesh(keep(new THREE.SphereGeometry(1.74, 48, 24)), keep(new THREE.MeshBasicMaterial({ color: second, transparent: true, opacity: 0.18 })));
        group.add(points, core);
        group.rotation.z = 0.35;
        move = (t) => {
            points.rotation.y = t * 0.12;
        };
    }
    else {
        const makers = [
            () => new THREE.IcosahedronGeometry(0.55),
            () => new THREE.TorusGeometry(0.42, 0.16, 16, 48),
            () => new THREE.OctahedronGeometry(0.5),
            () => new THREE.BoxGeometry(0.6, 0.6, 0.6),
            () => new THREE.TorusKnotGeometry(0.32, 0.11, 96, 12),
            () => new THREE.DodecahedronGeometry(0.45),
            () => new THREE.ConeGeometry(0.4, 0.75, 24),
        ];
        const spots = [[-3, 1.2, -0.5], [-1.6, -1.1, 0.3], [0, 1.5, -1], [1.5, -1.3, 0], [3, 1, -0.4], [-0.4, -0.2, 0.8], [2.4, 0.1, 0.9]];
        const shapes = makers.slice(0, o.light ? 5 : 7).map((make, i) => {
            const mesh = new THREE.Mesh(keep(make()), keep(new THREE.MeshStandardMaterial({ color: i % 2 ? second : accent, metalness: 0.3, roughness: 0.35, flatShading: true })));
            mesh.position.set(spots[i][0], spots[i][1], spots[i][2]);
            group.add(mesh);
            return { mesh, y: spots[i][1], speed: 0.6 + (i % 3) * 0.25 };
        });
        move = (t) => {
            for (const [i, s] of shapes.entries()) {
                s.mesh.position.y = s.y + Math.sin(t * s.speed + i) * 0.18;
                s.mesh.rotation.set(t * 0.3 * s.speed, t * 0.4, 0);
            }
        };
    }
    // The pointer turns the scene a little; reduce motion keeps it still.
    const aim = { x: 0, y: 0 };
    const onPointer = (e) => {
        aim.x = (e.clientX / window.innerWidth) * 2 - 1;
        aim.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const tilt = group.rotation.z;
    let time = 1.5;
    let last = performance.now();
    let frame = 0;
    let onScreen = true;
    const draw = () => {
        move(time);
        renderer.render(scene, camera);
    };
    const loop = (now) => {
        frame = 0;
        time += Math.min((now - last) / 1000, 0.05);
        last = now;
        group.rotation.x += (aim.y * 0.15 - group.rotation.x) * 0.05;
        group.rotation.y += (aim.x * 0.25 - group.rotation.y) * 0.05;
        group.rotation.z = tilt;
        draw();
        wake();
    };
    const wake = () => {
        if (!o.still && !frame && onScreen && !document.hidden)
            frame = requestAnimationFrame(loop);
    };
    const resize = () => {
        const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Narrow screens step back so the scene still fits.
        camera.position.set(0, 0, 6 / Math.min(1, Math.max(camera.aspect, 0.45) * 0.9));
        camera.updateProjectionMatrix();
        if (o.still || !frame)
            draw();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        last = performance.now();
        wake();
    });
    seen.observe(canvas);
    const onVisible = () => {
        last = performance.now();
        wake();
    };
    document.addEventListener("visibilitychange", onVisible);
    if (!o.still)
        window.addEventListener("pointermove", onPointer, { passive: true });
    resize();
    wake();
    return {
        stop() {
            if (frame)
                cancelAnimationFrame(frame);
            frame = -1;
            sizes.disconnect();
            seen.disconnect();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("pointermove", onPointer);
            for (const x of owned)
                x.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
        },
    };
};
