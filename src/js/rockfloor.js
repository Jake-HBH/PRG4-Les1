import { Actor, Vector, CollisionType } from "excalibur";
import { Resources } from './resources.js';

export class RockFloor extends Actor {
    constructor(x,y) {
        super({ x, y, width: Resources.RockFloor.width - 60, height: Resources.RockFloor.height - 40});
        this.scale = new Vector(0.6, 0.5)
    }

    onInitialize() {
        this.graphics.use(Resources.RockFloor.toSprite());
        this.body.collisionType = CollisionType.Fixed;
    }
}
