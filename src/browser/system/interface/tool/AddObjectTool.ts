import {Geometry, Mesh, Quaternion, Raycaster, Vector3} from "three";
import {Component, Entity} from "aframe";
import {Device} from "../Device";
import {Slot} from "../model/Slot";
import {Button} from "../model/Button";
import {ComponentControllerDefinition} from "../../../AFrame";
import {createElement} from "../../../util";
import {PointerTool} from "./PointerTool";
import {snapVector3ToAxisAlignedGrid} from "../../../math/math";
import {SpaceSystemController} from "../../../..";
import uuid = require("uuid");
import {ToolSelectorTool} from "./ToolSelectorTool";


export class AddObjectTool extends PointerTool {

    public static DEFINITION = new ComponentControllerDefinition("add-object-tool", {}, false, true, (component: Component, entity: Entity, data: any) => new AddObjectTool(component, entity, data));

    reviewEntity: Entity | undefined;

    entityTemplateScale = 1;
    entityReviewScale = 0.05;
    entityTemplates: Array<string> = [
        '<a-entity model="#cube_wood" collidable/>',
        '<a-entity model="#cube_brick" collidable/>',
        '<a-entity model="#cube_grass" collidable/>',
        '<a-entity model="#cube_sand" collidable/>',
        '<a-entity model="#cube_marble" collidable/>',
        '<a-entity model="#cube_stone" collidable/>',
        '<a-entity model="#slab_sand" collidable/>',
        '<a-entity model="#slab_marble" collidable/>',
        '<a-entity model="#slab_stone" collidable/>'
    ];
    entityTemplateIndex = 0;
    entityTemplate: string = this.entityTemplates[this.entityTemplateIndex];

    constructor(component: Component, entity: Entity, data: any) {
        super(component, entity, data);
        this.raycaster = new Raycaster();
    }

    init(): void {
        console.log(this.componentName + " init");
        super.init();
    }

    tick(time: number, timeDelta: number): void {
        super.tick(time, timeDelta);
    }

    buttonDown(device: Device, toolSlot: Slot, button: Button): void {
        if (!this.pressed.has(button)) {
        }
        super.buttonDown(device, toolSlot, button);
    }

    buttonUp(device: Device, toolSlot: Slot, button: Button): void {
        if (this.pressed.has(button)) {
            if (button == Button.TRIGGER) {
                this.addEntity(device);
            }

            if (button == Button.UP) {
                this.entityTemplateIndex++;
                if (this.entityTemplateIndex >= this.entityTemplates.length) {
                    this.entityTemplateIndex = 0;
                }
                this.entityTemplate = this.entityTemplates[this.entityTemplateIndex];
                this.setReviewEntity();
            }

            if (button == Button.DOWN) {
                this.entityTemplateIndex--;
               if (this.entityTemplateIndex <= 0) {
                   this.entityTemplateIndex = this.entityTemplates.length - 1;
               }
               this.entityTemplate = this.entityTemplates[this.entityTemplateIndex];
                this.setReviewEntity();
            }

        }
        super.buttonUp(device, toolSlot, button);
    }

    setReviewEntity() {
        const toolSelectorTool = this.interface.getToolAtSlot(Slot.PRIMARY_SELECTOR) as ToolSelectorTool;

        if (this.reviewEntity) {
            toolSelectorTool.entity.removeChild(this.reviewEntity);
        }
        this.reviewEntity = createElement(this.entityTemplate) as Entity;
        this.reviewEntity.setAttribute("scale", this.entityReviewScale + " " + this.entityReviewScale + " " + this.entityReviewScale);
        this.reviewEntity.setAttribute("rotation", "60 0 0");
        this.reviewEntity.setAttribute("position", "0 0 -0.1");
        toolSelectorTool.entity.appendChild(this.reviewEntity);
    }

    private addEntity(device: Device) {

        const gridStep = 1;
        const pointedObject = this.pointedObject;
        const pointerPosition = this.pointedPosition;
        //const pointedFaceIndex = this.pointedFaceIndex;

        if (pointedObject && pointerPosition) {

            const pointedObjectPosition = pointedObject.position.clone();
            pointedObject.getWorldPosition(pointedObjectPosition);

            const template = this.entityTemplate;
            const templateScale = this.entityTemplateScale;

            const entityPosition = pointerPosition.clone();
            entityPosition.sub(pointedObjectPosition);
            entityPosition.normalize();
            entityPosition.multiplyScalar(gridStep / 2);
            entityPosition.add(pointerPosition);

            const snappedPosition = snapVector3ToAxisAlignedGrid(entityPosition, gridStep);

            const spaceSystem = this.getSystemController("space") as SpaceSystemController;
            spaceSystem.saveEntityFromTemplate(snappedPosition, template, templateScale);

        }
    }


}


