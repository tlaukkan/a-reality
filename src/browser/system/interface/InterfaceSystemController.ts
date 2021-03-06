import {Component, Entity, Scene, System} from "aframe";
import {InterfaceController} from "./InterfaceController";
import {DeviceSlot} from "./model/DeviceSlot";
import {Device} from "./Device";
import {Slot} from "./model/Slot";
import {Tool} from "./Tool";
import {Button} from "./model/Button";
import {Stick} from "./model/Stick";
import {Object3D, Vector3} from "three";
import {SlotListener} from "./SlotListener";
import {SpaceSystemController} from "../../..";
import {AbstractSystemController, SystemControllerDefinition} from "aframe-typescript-boilerplate";
import {ToolSelectorTool} from "./tool/ToolSelectorTool";
import {InteractionMode} from "./model/InteractionMode";
import {MaterialUiSystem} from "@tlaukkan/aframe-material-collection-ts";

export class InterfaceSystemController extends AbstractSystemController {

    public static DEFINITION = new SystemControllerDefinition(
        "interface", {},
        (system: System, scene: Scene, data: any) => new InterfaceSystemController(system, scene, data)
    );

    private interactionMode: InteractionMode = InteractionMode.FP;
    private uiFocus: boolean = false;

    private selfScale: number = 1;
    public interfaceEntity: Entity;
    public cameraEntity: Entity;
    public collidables = new Array<Object3D>();

    private interfaceController: InterfaceController | undefined;

    private devices: Map<DeviceSlot, Device> = new Map();
    private tools: Map<string, Tool> = new Map();
    private toolNames: Array<string> = new Array<string>();
    private slots: Map<Slot, Tool> = new Map();

    private slotListeners: Map<Slot, Array<SlotListener>> = new Map();
    public cameraPosition: Vector3 = new Vector3(0,0,0);
    public cameraDirection: Vector3 = new Vector3(0,0,0);

    constructor(system: System, scene: Scene, data: any) {
        super(system, scene, data);

        this.interfaceEntity = this.scene!!.querySelector('[interface]') as Entity;
        if (this.interfaceEntity) {
            console.info("interface entity set.");
        } else {
            throw new Error("interface entity not found.");
        }

        this.cameraEntity = this.interfaceEntity!!.querySelector('[camera]') as Entity;
        if (this.cameraEntity) {
            console.info("interface camera entity set.");
        } else {
            throw new Error("interface camera entity not found.");
        }
    }

    init(): void {
        const materialUiSystem = this.getSystemController("material-ui") as MaterialUiSystem;
        materialUiSystem.onFocus = () => {
            this.uiFocus = true;
            const lookControls = this.cameraEntity.components["look-controls"] as any;
            if (lookControls) {
                lookControls.pause();
            }
        };
        materialUiSystem.onFocusOut = () => {
            this.uiFocus = false;
            const lookControls = this.cameraEntity.components["look-controls"] as any;
            if (lookControls) {
                lookControls.play();
            }
        };
    }

    pause(): void {
    }

    play(): void {
    }

    tick(time: number, timeDelta: number): void {
        this.cameraPosition.copy(this.cameraEntity.object3D.position);
        this.cameraPosition = this.cameraEntity.object3D.parent!!.localToWorld(this.cameraPosition);

        this.cameraEntity!!.object3D.getWorldDirection(this.cameraDirection);
        this.cameraDirection.multiplyScalar(-1);
    }

    getCollidables(): Array<Object3D> {
        return this.collidables;
    }

    addCollidable(object: Object3D) {
        this.collidables.push(object);
    }

    removeCollidable(object: Object3D) {
        const index = this.collidables.indexOf(object, 0);
        if (index > -1) {
            this.collidables.splice(index, 1);
        }
    }

    setInterfaceController(interfaceController: InterfaceController) {
        this.interfaceController = interfaceController;
    }

    setDevice(slot: DeviceSlot, device: Device) {
        if (this.devices.has(slot)) {
            console.warn("interface already has controls at: " + DeviceSlot[slot]);
        } else {
            this.devices.set(slot, device);
            //console.log("interface controls " + device.componentName + " set at: " + DeviceSlot[slot]);
        }
    }

    getDevice(slot: DeviceSlot): Device | undefined {
        return this.devices.get(slot);
    }

    registerTool(tool: Tool) {
        if (!this.tools.has(tool.componentName)) {
            //console.log("interface tool '" + tool.componentName + "' registered.");
            this.tools.set(tool.componentName, tool);
            this.toolNames.push(tool.componentName);
        }
    }

    registerSlotListener(slot: Slot, slotListener: SlotListener) {
        if (!this.slotListeners.has(slot)) {
            this.slotListeners.set(slot, new Array());
        }
        this.slotListeners.get(slot)!!.push(slotListener);

        // Notify slot listener of slotted tool if tool already slotted.
        const slottedTool = this.getToolAtSlot(Slot.PRIMARY);
        if (slottedTool) {
            slotListener.onToolSlotted(Slot.PRIMARY, slottedTool!!.componentName);
        }
    }

    getTool<T extends Tool>(name: string): T {
        if (this.tools.has(name)) {
            return this.tools.get(name)! as T;
        } else {
            throw new Error("Tool '" + name + "' not registered.");
        }
    }

    slotTool(slot: Slot, tool: Tool) {
        this.slots.set(slot, tool);
        //console.log("interface tool " + tool.componentName + " set at: " + Slot[slot]);
        if (this.slotListeners.has(slot)) {
            this.slotListeners.get(slot)!!.forEach((slotListener: SlotListener) => {
               slotListener.onToolSlotted(slot, tool.componentName);
            });
        }
    }

    getToolAtSlot(slot: Slot): Tool | undefined {
        return this.slots.get(slot);
    }

    buttonUp(device: Device, slot: Slot, button: Button) {
        if (this.slots.has(slot)) {
            this.slots.get(slot)!!.buttonUp(device, slot, button);
        }
    }

    buttonDown(device: Device, slot: Slot, button: Button) {
        if (this.slots.has(slot)) {
            this.slots.get(slot)!!.buttonDown(device, slot, button);
        }
    }

    stickTwist(device: Device, slot: Slot, stick: Stick, x: number, y: number) {
        if (this.slots.has(slot)) {
            this.slots.get(slot)!!.stickTwist(device, slot, stick, x, y);
        }
    }

    slotNextTool(slot: Slot): void {
        if (this.slots.has(slot)) {
            const tool = this.slots.get(slot)!!;
            const toolIndex = this.toolNames.indexOf(tool.componentName);
            const nextToolIndex = (toolIndex == this.toolNames.length - 1) ? 0 : toolIndex + 1;
            //console.log("tool index: " + toolIndex + " next tool index: " + nextToolIndex + " lenght: " + this.toolNames.length);
            //console.log(this.toolNames);
            const nextToolName = this.toolNames[nextToolIndex];
            const nextTool = this.getTool(nextToolName);
            this.slotTool(slot, nextTool);
        }
    }

    slotPreviousTool(slot: Slot): void {
        if (this.slots.has(slot)) {
            const tool = this.slots.get(slot)!!;
            const toolIndex = this.toolNames.indexOf(tool.componentName);
            const previousToolIndex = (toolIndex == 0) ? this.toolNames.length - 1 : toolIndex - 1;
            const previousToolName = this.toolNames[previousToolIndex];
            const previousTool = this.getTool(previousToolName);
            this.slotTool(slot, previousTool);
        }
    }

    setSelfScale(selfScale: number) {
        const scale = this.interfaceEntity.getAttribute("scale");
        this.selfScale = selfScale;
        scale.x = this.selfScale;
        scale.y = this.selfScale;
        scale.z = this.selfScale;

        const spaceSystem = this.getSystemController("space") as SpaceSystemController;
        spaceSystem.sendAvatarDescriptionUpdate();
    }

    getSelfScale(): number {
        return this.selfScale;
    }

    isVrMode(): boolean {
        return (this.getToolAtSlot(Slot.PRIMARY_SELECTOR)!! as ToolSelectorTool).vrMode;
    }

    isUiFocus(): boolean {
        return this.uiFocus;
    }

    setVrMode(vrMode: boolean) {
        if (this.isVrMode() === vrMode) {
            return;
        } else {
            if (vrMode) {
                this.scene.enterVR();
            } else {
                this.scene.exitVR();
            }
        }
    }

    getInteractionMode(): InteractionMode {
        return this.interactionMode;
    }

    setInteractionMode(interactionMode: InteractionMode):  void {
        if (interactionMode === this.interactionMode) {
            return;
        }


        this.interactionMode = interactionMode;
    }
}


