import * as THREE from 'three';
import { BaseManager } from './BaseManager';
import { getPosition } from '@/core/scene/scene';
import { MjData, MjModel } from 'mujoco-js';

export interface PizzaDeliveryOptions {
  goalPosition?: THREE.Vector3;
  goalRadius?: number;
  maxPizzaDistance?: number;
  minPizzaHeight?: number;
  minRobotHeight?: number;
  pizzaGameRef?: any;
}

export class PizzaDeliveryEnvManager extends BaseManager {
  goalPosition: THREE.Vector3;
  goalRadius: number;
  maxPizzaDistance: number;
  minPizzaHeight: number;
  failPizzaHeight: number;
  minRobotHeight: number;
  pizzaGameRef: any;

  mjModel: MjModel | null;
  mjData: MjData | null;
  pizzaBodyId: number | null;
  trunkBodyId: number | null;

  gameState: 'ready' | 'playing' | 'success' | 'failed';
  distanceToGoal: number;
  pizzaDistanceFromRobot: number;
  pizzaHeight: number;
  trunkHeight: number;
  startDelay: number;
  frameCount: number;
  elapsedTime: number;

  constructor(options: PizzaDeliveryOptions = {}) {
    super();

    this.goalPosition = options.goalPosition ?? new THREE.Vector3(5, 0, 0);
    this.goalRadius = options.goalRadius ?? 0.5;
    this.maxPizzaDistance = options.maxPizzaDistance ?? 1.2;
    this.minPizzaHeight = options.minPizzaHeight ?? 0.15;
    this.failPizzaHeight = 0.1;
    this.minRobotHeight = options.minRobotHeight ?? 0.2;
    this.pizzaGameRef = options.pizzaGameRef ?? null;

    this.mjModel = null;
    this.mjData = null;
    this.pizzaBodyId = null;
    this.trunkBodyId = null;

    this.gameState = 'ready';
    this.distanceToGoal = 0;
    this.pizzaDistanceFromRobot = 0;
    this.pizzaHeight = 0;
    this.trunkHeight = 0;
    this.startDelay = 50;
    this.frameCount = 0;
    this.elapsedTime = 0;
  }

  onRuntimeAttached(runtime: any) {
    runtime.params.pizzaGame = {
      state: this.gameState,
      distanceToGoal: '0.0',
      pizzaStatus: 'safe',
      elapsedTime: '0.00',
    };
  }

  async onSceneLoaded({ mjModel, mjData }: { mjModel: MjModel; mjData: MjData }) {
    this.mjModel = mjModel;
    this.mjData = mjData;

    this.pizzaBodyId = null;
    this.trunkBodyId = null;

    for (let b = 0; b < this.mjModel.nbody; b++) {
      const body = this.runtime.bodies?.[b];
      if (!body) continue;

      if (body.name === 'pizza_box') {
        this.pizzaBodyId = b;
      }
      if (body.name === 'trunk') {
        this.trunkBodyId = b;
      }
    }

    console.log('[PizzaDelivery] Found bodies:', {
      pizza: this.pizzaBodyId,
      trunk: this.trunkBodyId,
    });

    this.startGame();
  }

  startGame() {
    this.gameState = 'ready';
    this.frameCount = 0;
    this.elapsedTime = 0;
    this.updateRuntimeParams();
  }

  beforeSimulationStep({ timestep }: { timestep: number }) {
    if (!this.mjData || this.pizzaBodyId === null || this.trunkBodyId === null) return;

    if (this.gameState === 'ready') {
      this.frameCount++;
      if (this.frameCount >= this.startDelay) {
        this.gameState = 'playing';
        console.log('[PizzaDelivery] Game started!');
      }
      this.updateRuntimeParams();
    }

    if (this.gameState !== 'playing') return;

    this.elapsedTime += timestep;

    const pizzaPos = new THREE.Vector3();
    const trunkPos = new THREE.Vector3();

    getPosition(this.mjData.xpos, this.pizzaBodyId, pizzaPos);
    getPosition(this.mjData.xpos, this.trunkBodyId, trunkPos);

    const pizzaMujocoZ = this.mjData.xpos[this.pizzaBodyId * 3 + 2];
    const trunkMujocoZ = this.mjData.xpos[this.trunkBodyId * 3 + 2];

    this.pizzaHeight = pizzaMujocoZ;
    this.trunkHeight = trunkMujocoZ;
    this.distanceToGoal = trunkPos.distanceTo(this.goalPosition);
    this.pizzaDistanceFromRobot = pizzaPos.distanceTo(trunkPos);

    const pizzaRelativeHeight = pizzaMujocoZ - trunkMujocoZ;

    if (this.frameCount === this.startDelay + 1) {
      console.log('[PizzaDelivery] Game ready! State:', {
        pizzaMujocoZ: pizzaMujocoZ.toFixed(2),
        trunkMujocoZ: trunkMujocoZ.toFixed(2),
        relative: pizzaRelativeHeight.toFixed(2),
        distance: this.pizzaDistanceFromRobot.toFixed(2),
      });
    }

    if (this.pizzaDistanceFromRobot > this.maxPizzaDistance) {
      this.gameState = 'failed';
      console.log('[PizzaDelivery] FAILED: Pizza too far (dist=' + this.pizzaDistanceFromRobot.toFixed(2) + 'm)');
    } else if (this.trunkHeight < 0.15) {
      this.gameState = 'failed';
      console.log('[PizzaDelivery] FAILED: Robot fell (trunk z=' + this.trunkHeight.toFixed(2) + 'm)');
    } else if (pizzaRelativeHeight < -0.15) {
      this.gameState = 'failed';
      console.log('[PizzaDelivery] FAILED: Pizza fell off (pizza z=' + this.pizzaHeight.toFixed(2) + 'm, trunk z=' + this.trunkHeight.toFixed(2) + 'm, diff=' + pizzaRelativeHeight.toFixed(2) + 'm)');
    }

    if (
      this.distanceToGoal < this.goalRadius &&
      this.pizzaDistanceFromRobot < 0.4 &&
      pizzaRelativeHeight > 0.0
    ) {
      this.gameState = 'success';
      console.log('[PizzaDelivery] SUCCESS! Distance=' + this.distanceToGoal.toFixed(2) + 'm');
    }

    this.updateRuntimeParams();
  }

  updateRuntimeParams() {
    let pizzaStatus = 'safe';
    if (this.pizzaDistanceFromRobot > 0.7) {
      pizzaStatus = 'danger';
    } else if (this.pizzaDistanceFromRobot > 0.5) {
      pizzaStatus = 'warning';
    }

    const gameData = {
      state: this.gameState,
      distanceToGoal: this.distanceToGoal.toFixed(1),
      elapsedTime: this.elapsedTime.toFixed(2),
      pizzaStatus: pizzaStatus,
    };

    if (this.pizzaGameRef) {
      this.pizzaGameRef.value = gameData;
    }

    if (this.runtime.params.pizzaGame) {
      this.runtime.params.pizzaGame = gameData;
    }
  }

  reset() {
    this.gameState = 'ready';
    this.frameCount = 0;
    this.elapsedTime = 0;
    this.updateRuntimeParams();
  }

  dispose() {
  }
}
