(function() {
    'use strict';
    
    let galleryInstance = null;

    class MemorialGallery {
        constructor() {
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.frames = [];
            this.photos = [];
            this.isInGallery = false;
            this.keys = {};
            this.moveSpeed = 0.3;
            this.keyboardEnabled = false;
            this.isMouseDown = false;
            this.mouseX = 0;
            this.mouseY = 0;
            this.cameraRotation = { x: 0, y: 0 };
            
            console.log('MemorialGallery 초기화 시작');
            this.init();
            this.setupEventListeners();
            console.log('MemorialGallery 초기화 완료');
        }

        init() {
            try {
                console.log('3D 장면 초기화 시작');
                
                // Scene 생성
                this.scene = new THREE.Scene();
                this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

                // Camera 설정
                const canvas = document.getElementById('gallery3d');
                if (!canvas) {
                    throw new Error('Canvas 엘리먼트를 찾을 수 없습니다');
                }
                
                this.camera = new THREE.PerspectiveCamera(
                    75, 
                    canvas.clientWidth / canvas.clientHeight, 
                    0.1, 
                    1000
                );
                this.camera.position.set(0, 5, 20);

                // Renderer 설정
                this.renderer = new THREE.WebGLRenderer({ 
                    canvas: canvas,
                    antialias: true,
                    alpha: true
                });
                this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                this.setupCameraControls();
                this.createEnvironment();
                this.animate();
                
                console.log('3D 장면 초기화 완료');
            } catch (error) {
                console.error('3D 장면 초기화 오류:', error);
            }
        }

        setupCameraControls() {
            const canvas = this.renderer.domElement;
            
            canvas.addEventListener('mousedown', (e) => {
                this.isMouseDown = true;
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                canvas.style.cursor = 'grabbing';
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!this.isMouseDown) return;

                const deltaX = e.clientX - this.mouseX;
                const deltaY = e.clientY - this.mouseY;

                this.cameraRotation.y -= deltaX * 0.005;
                this.cameraRotation.x -= deltaY * 0.005;
                this.cameraRotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraRotation.x));

                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this.updateCameraRotation();
            });

            const mouseUpHandler = () => {
                this.isMouseDown = false;
                canvas.style.cursor = 'grab';
            };

            canvas.addEventListener('mouseup', mouseUpHandler);
            document.addEventListener('mouseup', mouseUpHandler);

            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomSpeed = 0.1;
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(this.camera.quaternion);
                
                if (e.deltaY > 0) {
                    this.camera.position.add(forward.multiplyScalar(-zoomSpeed));
                } else {
                    this.camera.position.add(forward.multiplyScalar(zoomSpeed));
                }
            }, { passive: false });

            canvas.style.cursor = 'grab';
        }

        updateCameraRotation() {
            this.camera.rotation.set(this.cameraRotation.x, this.cameraRotation.y, 0);
        }

        createEnvironment() {
            // 바닥
            const floorGeometry = new THREE.PlaneGeometry(100, 100);
            const floorMaterial = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.receiveShadow = true;
            this.scene.add(floor);

            // 벽들
            this.createWalls();
            // 조명
            this.setupLighting();
            // 구름
            this.createClouds();
        }

        createWalls() {
            const wallMaterial = new THREE.MeshLambertMaterial({
                color: 0xe6f3ff,
                transparent: true,
                opacity: 0.9
            });

            // 뒷벽
            const backWallGeometry = new THREE.PlaneGeometry(80, 30);
            const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
            backWall.position.set(0, 15, -30);
            this.scene.add(backWall);

            // 좌벽
            const leftWallGeometry = new THREE.PlaneGeometry(60, 30);
            const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
            leftWall.position.set(-40, 15, 0);
            leftWall.rotation.y = Math.PI / 2;
            this.scene.add(leftWall);

            // 우벽
            const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
            rightWall.position.set(40, 15, 0);
            rightWall.rotation.y = -Math.PI / 2;
            this.scene.add(rightWall);
        }

        setupLighting() {
            // 환경광
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            // 메인 조명
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(20, 30, 20);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);

            // 무지개 색상 조명들
            const colors = [0xff6b6b, 0xfeca57, 0x48dbfb, 0xff9ff3, 0x54a0ff];
            colors.forEach((color, index) => {
                const light = new THREE.PointLight(color, 0.5, 50);
                light.position.set((index - 2) * 15, 10, -20);
                this.scene.add(light);
            });
        }

        createClouds() {
            const cloudGeometry = new THREE.SphereGeometry(5, 8, 8);
            const cloudMaterial = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });

            for (let i = 0; i < 10; i++) {
                const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
                cloud.position.set(
                    Math.random() * 100 - 50,
                    20 + Math.random() * 10,
                    -40 - Math.random() * 20
                );
                cloud.scale.set(
                    0.5 + Math.random() * 0.5,
                    0.3 + Math.random() * 0.3,
                    0.5 + Math.random() * 0.5
                );
                this.scene.add(cloud);
            }
        }

        addPhotoFrame(imageUrl) {
            try {
                const frameGroup = new THREE.Group();

                // 기본 액자
                const frameGeometry = new THREE.BoxGeometry(12, 16, 0.5);
                const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                frame.castShadow = true;
                frameGroup.add(frame);

                // 사진 추가
                const loader = new THREE.TextureLoader();
                loader.crossOrigin = 'anonymous';
                loader.load(
                    imageUrl, 
                    (texture) => {
                        const photoGeometry = new THREE.PlaneGeometry(10, 14);
                        const photoMaterial = new THREE.MeshLambertMaterial({ 
                            map: texture 
                        });
                        const photo = new THREE.Mesh(photoGeometry, photoMaterial);
                        photo.position.z = 0.26;
                        frameGroup.add(photo);
                        console.log('사진 로드 완료');
                    },
                    undefined,
                    (error) => {
                        console.error('사진 로드 오류:', error);
                    }
                );

                // 액자 위치 설정
                const frameCount = this.frames.length;
                const spacing = 15;
                
                if (frameCount < 3) {
                    frameGroup.position.set((frameCount - 1) * spacing, 10, -29.5);
                } else if (frameCount < 6) {
                    frameGroup.position.set(-39.5, 10, (frameCount - 4) * spacing);
                    frameGroup.rotation.y = Math.PI / 2;
                } else {
                    frameGroup.position.set(39.5, 10, (frameCount - 7) * spacing);
                    frameGroup.rotation.y = -Math.PI / 2;
                }

                this.scene.add(frameGroup);
                this.frames.push(frameGroup);
            } catch (error) {
                console.error('액자 추가 오류:', error);
            }
        }

        enterGallery() {
            this.isInGallery = true;
            this.keyboardEnabled = true;
            
            const canvas = document.getElementById('gallery3d');
            canvas.focus();
            
            this.updateKeyStatus('미술관에 입장했습니다. WASD로 이동하세요!');
            
            this.animateCamera(
                this.camera.position.clone(), 
                new THREE.Vector3(0, 8, 10), 
                2000
            );
        }

        resetView() {
            this.isInGallery = false;
            this.keyboardEnabled = false;
            this.camera.position.set(0, 5, 20);
            this.cameraRotation = { x: 0, y: 0 };
            this.camera.rotation.set(0, 0, 0);
            this.updateKeyStatus('');
        }

        updateKeyStatus(message) {
            const statusElement = document.getElementById('keyStatus');
            if (statusElement) {
                statusElement.textContent = message;
            }
        }

        handleKeyboardMovement() {
            if (!this.isInGallery || !this.keyboardEnabled) return;

            const moveVector = new THREE.Vector3();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            const up = new THREE.Vector3(0, 1, 0);

            let isMoving = false;

            if (this.keys['w'] || this.keys['W'] || this.keys['KeyW']) {
                moveVector.add(forward.clone().multiplyScalar(this.moveSpeed));
                isMoving = true;
            }
            if (this.keys['s'] || this.keys['S'] || this.keys['KeyS']) {
                moveVector.add(forward.clone().multiplyScalar(-this.moveSpeed));
                isMoving = true;
            }
            if (this.keys['a'] || this.keys['A'] || this.keys['KeyA']) {
                moveVector.add(right.clone().multiplyScalar(-this.moveSpeed));
                isMoving = true;
            }
            if (this.keys['d'] || this.keys['D'] || this.keys['KeyD']) {
                moveVector.add(right.clone().multiplyScalar(this.moveSpeed));
                isMoving = true;
            }
            if (this.keys[' '] || this.keys['Space']) {
                moveVector.add(up.clone().multiplyScalar(this.moveSpeed));
                isMoving = true;
            }
            if (this.keys['Shift'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
                moveVector.add(up.clone().multiplyScalar(-this.moveSpeed));
                isMoving = true;
            }

            if (isMoving) {
                this.camera.position.add(moveVector);
                this.camera.position.y = Math.max(2, this.camera.position.y);
                this.updateKeyStatus('이동 중...');
            }
        }

        setupEventListeners() {
            // DOM 요소들이 존재하는지 확인
            const photoUpload = document.getElementById('photoUpload');
            const enterGallery = document.getElementById('enterGallery');
            const resetView = document.getElementById('resetView');

            if (photoUpload) {
                photoUpload.addEventListener('change', (e) => {
                    this.handlePhotoUpload(e);
                });
            }

            if (enterGallery) {
                enterGallery.addEventListener('click', () => {
                    this.enterGallery();
                });
            }

            if (resetView) {
                resetView.addEventListener('click', () => {
                    this.resetView();
                });
            }

            // 키보드 이벤트 설정
            this.setupKeyboardEvents();

            // 창 크기 조절
            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }

        setupKeyboardEvents() {
            const handleKeyDown = (e) => {
                if (!this.isInGallery) return;
                
                this.keys[e.key] = true;
                this.keys[e.code] = true;
                
                const movementKeys = ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Shift'];
                if (movementKeys.includes(e.key) || e.code.includes('Key') || e.code.includes('Shift')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            const handleKeyUp = (e) => {
                this.keys[e.key] = false;
                this.keys[e.code] = false;
            };

            // 여러 레벨에서 키보드 이벤트 등록
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            
            const canvas = document.getElementById('gallery3d');
            if (canvas) {
                canvas.addEventListener('keydown', handleKeyDown);
                canvas.addEventListener('keyup', handleKeyUp);
                
                canvas.addEventListener('click', () => {
                    canvas.focus();
                    if (this.isInGallery) {
                        this.keyboardEnabled = true;
                        this.updateKeyStatus('키보드 활성화됨');
                    }
                });
            }

            window.addEventListener('blur', () => {
                this.keys = {};
            });
        }

        handleResize() {
            const canvas = document.getElementById('gallery3d');
            if (canvas && this.camera && this.renderer) {
                this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            }
        }

        handlePhotoUpload(event) {
            const files = Array.from(event.target.files);
            const preview = document.querySelector('.photo-preview');
            
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            // 미리보기 이미지 추가
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            if (preview) {
                                preview.appendChild(img);
                            }
                            
                            // 3D 액자에 추가
                            this.addPhotoFrame(e.target.result);
                        } catch (error) {
                            console.error('사진 처리 오류:', error);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        animateCamera(start, end, duration) {
            const startTime = Date.now();
            
            const animate = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                this.camera.position.lerpVectors(start, end, easeProgress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }

        animate() {
            try {
                requestAnimationFrame(() => this.animate());
                
                this.handleKeyboardMovement();
                
                // 구름 애니메이션
                this.scene.children.forEach(child => {
                    if (child.material && child.material.opacity === 0.7) {
                        child.rotation.y += 0.001;
                    }
                });
                
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('애니메이션 오류:', error);
            }
        }
    }

    // 전역 초기화 함수
    window.initMemorialGallery = function() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js가 로드되지 않았습니다');
            return;
        }
        
        if (galleryInstance) {
            console.log('갤러리가 이미 초기화되었습니다');
            return;
        }

        try {
            galleryInstance = new MemorialGallery();
            console.log('갤러리 초기화 성공');
        } catch (error) {
            console.error('갤러리 초기화 실패:', error);
        }
    };

    // DOM이 준비되면 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.initMemorialGallery, 100);
        });
    } else {
        setTimeout(window.initMemorialGallery, 100);
    }

})();
