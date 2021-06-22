import { AfterViewInit, Component, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';
import "./js/EnableThreeExamples";
import "three/examples/js/controls/OrbitControls";
import "three/examples/js/loaders/ColladaLoader";

@Component({
    selector: 'scene',
    templateUrl: './scene.component.html',
    styleUrls: ['./scene.component.css']
})
export class SceneComponent implements AfterViewInit {

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private cameraTarget: THREE.Vector3;
    public scene: THREE.Scene;
    public grid: THREE.GridHelper;

    public fieldOfView: number = 60;
    public nearClippingPane: number = 1;
    public farClippingPane: number = 1100;
    snap = 20;

    public controls: THREE.OrbitControls;

    @ViewChild('canvas')
    private canvasRef: ElementRef;

    constructor() {
        this.render = this.render.bind(this);
        this.onModelLoadingCompleted = this.onModelLoadingCompleted.bind(this);
    }

    private get canvas(): HTMLCanvasElement {
        return this.canvasRef.nativeElement;
    }


    private createScene() {
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.AxisHelper(200));

        //add plane
        const geometry = new THREE.PlaneGeometry( 400, 200, 0 );
        const material = new THREE.MeshBasicMaterial( {color: 0xf0ff00, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( geometry, material );
        plane.rotateOnAxis(new THREE.Vector3( 1, 0, 0), THREE.Math.degToRad(90));
        this.scene.add( plane );

        // let wireframe = new THREE.WireframeGeometry( geometry );
        // let line = new THREE.LineSegments( wireframe );
        // //line.material.color.setHex(0x000000);
        // this.scene.add(line);

        // const squareGeometry = new THREE.Geometry();
        // squareGeometry.vertices.push(new THREE.Vector3(-1.0, 1.0, 0.0)); // <--- same
        // squareGeometry.vertices.push(new THREE.Vector3(1.0, 1.0, 0.0));  //    | as
        // squareGeometry.vertices.push(new THREE.Vector3(1.0, -1.0, 0.0)); //    | this
        // squareGeometry.vertices.push(new THREE.Vector3(-1.0, 1.0, 0.0)); // <--- point
        // squareGeometry.vertices.push(new THREE.Vector3(-1.0,-1.0,0.0));
        // const squareMaterial = new THREE.MeshBasicMaterial({color: 0xff0f0f, side: THREE.DoubleSide});
        // const squareMesh = new THREE.Mesh(squareGeometry, squareMaterial);
        // squareMesh.position.set(10, 10, 10);
        // this.scene.add(squareMesh);

        const size = 500;
        const divisions = 50;

        this.grid = new THREE.GridHelper( size, divisions, 0x0f0fff );
        this.scene.add( this.grid );

      // const wireframe = new THREE.WireframeGeometry( geometry );
      // const line = new THREE.LineSegments( wireframe );
      // line.material.depthTest = false;
      // line.material.opacity = 0.25;
      // line.material.transparent = true;
      // this.scene.add( line );

      const loader = new THREE.ColladaLoader();
      loader.load('assets/model/multimaterial.dae', this.onModelLoadingCompleted);
    }

    private onModelLoadingCompleted(collada) {
        var modelScene = collada.scene;
        this.scene.add(modelScene);
        this.render();
    }

    private createLight() {
        var light = new THREE.PointLight(0xffffff, 1, 1000);
        light.position.set(0, 0, 100);
        this.scene.add(light);

        var light = new THREE.PointLight(0xffffff, 1, 1000);
        light.position.set(0, 0, -100);
        this.scene.add(light);
    }

    private createCamera() {
        let aspectRatio = this.getAspectRatio();
        this.camera = new THREE.PerspectiveCamera(
            this.fieldOfView,
            aspectRatio,
            this.nearClippingPane,
            this.farClippingPane
        );

        // Set position and look at
        this.camera.position.x = 100;
        this.camera.position.y = 100;
        this.camera.position.z = 100;
    }

    private getAspectRatio(): number {
        let height = this.canvas.clientHeight;
        if (height === 0) {
            return 0;
        }
        return this.canvas.clientWidth / this.canvas.clientHeight;
    }

    private startRendering() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.autoClear = true;

        let component: SceneComponent = this;

        (function render() {
            //requestAnimationFrame(render);
            component.render();
        }());
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    public addControls() {
        this.controls = new THREE.OrbitControls(this.camera);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.addEventListener('change', this.render);

    }

    /* EVENTS */

    public onMouseDown(event: MouseEvent) {
        console.log("onMouseDown");
        event.preventDefault();

        // Example of mesh selection/pick:
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);

        var obj: THREE.Object3D[] = [];
        this.findAllObjects(obj, this.scene);
        var intersects = raycaster.intersectObjects(obj);
        console.log("Scene has " + obj.length + " objects");
        console.log(intersects.length + " intersected objects found")
        intersects.forEach((i) => {
            console.log(i.object); // do what you want to do with object
            // add object to click point
            //var intersects = raycaster.intersectObjects(this.grid);
            const geometry = new THREE.CubeGeometry(this.snap/1.2, this.snap/2, this.snap/2);
            const material = new THREE.MeshBasicMaterial({
                    color: 0x0000FF,
                    wireframe: true,
                    wireframeLinewidth: 2,
                    side: THREE.DoubleSide
                });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = Math.round(i.point.x / this.snap) * this.snap;
            mesh.position.y = 5;//i.point.y;
            mesh.position.z = 0;//Math.round(i.point.z / this.snap) * this.snap;
            this.scene.add(mesh);
            this.render();
        });


    }

    private findAllObjects(pred: THREE.Object3D[], parent: THREE.Object3D) {
        // NOTE: Better to keep separate array of selected objects
        if (parent.children.length > 0) {
            parent.children.forEach((i) => {
                pred.push(i);
                this.findAllObjects(pred, i);
            });
        }
    }

    public onMouseUp(event: MouseEvent) {
        console.log("onMouseUp");
    }


    @HostListener('window:resize', ['$event'])
    public onResize(event: Event) {
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        console.log("onResize: " + this.canvas.clientWidth + ", " + this.canvas.clientHeight);

        this.camera.aspect = this.getAspectRatio();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.render();
    }

    @HostListener('document:keypress', ['$event'])
    public onKeyPress(event: KeyboardEvent) {
        console.log("onKeyPress: " + event.key);
    }

    /* LIFECYCLE */
    ngAfterViewInit() {
        this.createScene();
        this.createLight();
        this.createCamera();
        this.startRendering();
        this.addControls();
    }

}
