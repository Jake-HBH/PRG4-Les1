import { Actor, Engine, Vector, Keys, CollisionType, DegreeOfFreedom, SpriteSheet, range, Animation } from "excalibur";
import { Resources, ResourceLoader } from './resources.js';
import { Enemy } from "./enemy.js";
import { Coin } from "./coin.js";
import { Powerup } from "./powerup.js";
import { UI } from "./ui.js";


export class Player extends Actor { // Ensure Player class is exported
    constructor(x, y) {
        super({ x, y, width: Resources.Player.width, height: Resources.Player.height});
        this.graphics.use(Resources.Player.toSprite());

        this.body.collisionType = CollisionType.Active;
        this.isGrounded = false; // Add a property to track if the player is on the ground
        this.scale = new Vector(1.7, 1.7);
        this.pos = new Vector(450, 200)
        this.inventory = []; // Initialize an empty array to store collected items
        this.health = 100;
        this.jumpSpeed = -5000;
        this.score = 0
        this.ui = new UI()
        
    }

    onInitialize(engine) {
        this.body.useGravity = true;
        this.body.limitDegreeOfFreedom.push(DegreeOfFreedom.Rotation);
        this.on('collisionstart', (evt) => this.onCollisionStart(evt));
        this.on('collisionend', (evt) => this.onCollisionEnd(evt));

        this.on("exitviewport", () => {
            if (this.scene && this.scene.engine) {
                this.scene.engine.goToScene('gameover');
            }
        })


        //animation
        const idleSpritesheet = SpriteSheet.fromImageSource({
            image: Resources.PlayerIdle,
            grid: {
                rows: 1,
                columns: 10,
                spriteWidth: 48,
                spriteHeight: 48
            },
        });
        const runningSpritesheet = SpriteSheet.fromImageSource({
            image: Resources.PlayerRun,
            grid: {
                rows: 1,
                columns: 8,
                spriteWidth: 48,
                spriteHeight: 48
            },
        });
        const jumpingSpritesheet = SpriteSheet.fromImageSource({
            image: Resources.PlayerJump,
            grid: {
                rows: 1,
                columns: 6,
                spriteWidth: 48,
                spriteHeight: 48
            },
        });
        const idle = Animation.fromSpriteSheet(idleSpritesheet, range(1, 9), 100)
        const walk = Animation.fromSpriteSheet(runningSpritesheet, range(1, 7), 130)
        const run = Animation.fromSpriteSheet(runningSpritesheet, range(1, 7), 80)
        const jump = Animation.fromSpriteSheet(jumpingSpritesheet, range(1, 5), 20)


        this.graphics.add("idle", idle)
        this.graphics.add("walk", walk)
        this.graphics.add("run", run)
        this.graphics.add("jump", jump)

        this.graphics.use(idle);
        this.z = 10

        this.ui.onInitialize(engine); // Call the UI's onInitialize method
    }

    
    onCollisionStart(evt, engine, score) {
        if (!evt.other) {
            // Exit early if evt.other is undefined
            return;
        }

        if (evt.other.body.collisionType === CollisionType.Fixed) {
            this.isGrounded = true;
        }

        if (evt.other instanceof Enemy) {
            evt.other.kill();
            if (this.scene && this.scene.engine) {
                this.scene.engine.goToScene('gameover');
            }
        }

        if (evt.other.name === 'key') {
            evt.other.kill();

            // Add the key to local storage
            let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
            inventory.push('key');
            localStorage.setItem('inventory', JSON.stringify(inventory));
        } else if (evt.other.name === 'door') {
            // Set the nearby door reference
            this.nearbyDoor = evt.other;
        }

            // Check if UI exists before updating it
        if (this.scene && this.scene.engine && this.scene.engine.ui) {
            if (evt.other instanceof Coin) {
                console.log("picked up a coin");
                this.score += 10;
                evt.other.pickUp(this);
                console.log(this.score);
                this.scene.engine.ui.updateField(score); // Check if score is correctly passed
            }
        }

        if (evt.other instanceof Powerup) {
            evt.other.pickUp(this);
            console.log("ik pak een powerup")
            this.jumpSpeed = -8000;
            this.scene.engine.clock.schedule(() => (
                this.jumpSpeed = -5000
            ), 5000);
        }
    }


    onCollisionEnd(evt) {
        if (evt.other && evt.other.body.collisionType === CollisionType.Fixed) {
            this.isGrounded = false; // Set isGrounded to false when leaving the ground
        }
    }

    onPostUpdate(engine) {
        let xspeed = 0;
        this.graphics.use("idle");

        if (engine.input.keyboard.isHeld(Keys.D) || engine.input.keyboard.isHeld(Keys.Right)) {
            xspeed = 200;
            this.graphics.use('walk')
            this.graphics.flipHorizontal = false;
            if (engine.input.keyboard.isHeld(Keys.ShiftLeft) || engine.input.keyboard.isHeld(Keys.Sprint)) {
                xspeed = 300;
                this.graphics.use('run')
            }
        }

        if (engine.input.keyboard.isHeld(Keys.A) || engine.input.keyboard.isHeld(Keys.Left)) {
            xspeed = -200;
            this.graphics.use('walk')
            this.graphics.flipHorizontal = true;
            if (engine.input.keyboard.isHeld(Keys.ShiftLeft) || engine.input.keyboard.isHeld(Keys.Sprint)) {
                xspeed = -300;
                this.graphics.use('run')
            }
        }


        this.vel = new Vector(xspeed, this.vel.y);


        if (engine.input.keyboard.wasPressed(Keys.Space) && this.isGrounded) {
            this.graphics.use('jump')
            this.isGrounded = false; // Set isGrounded to false when jumping
            this.body.applyLinearImpulse(new Vector(0, this.jumpSpeed));
            
        }

        // if (this.scene && this.scene.engine && this.scene.engine.ui) {
        //     // Check if UI exists before updating it
        //     this.scene.engine.ui.addPoint(this.score);
        // }

        if (engine.input.keyboard.wasPressed(Keys.E) && this.nearbyDoor) {
            let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
            if (inventory.includes('key')) {
                // Remove the door and allow passage to level2
                this.nearbyDoor.kill();
                this.nearbyDoor = null;
                engine.goToScene('level2');
            } else {
                // Display locked message
                this.nearbyDoor.displayMessage('This door is locked, find the key');
            }
        }
    }

    hitSomething(event) {
        console.log(`we hit something! ${event.other}`);
        this.scene.engine.addPoint();
    }

    addToInventory(item) {
        this.inventory.push(item);
        console.log("Item added to inventory:", item);
    }

}
