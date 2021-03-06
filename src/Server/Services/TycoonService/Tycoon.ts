import { Dependency } from "@flamework/core";
import Attributes from "@memolemo-studios/rbxts-attributes";
import { BinderClass } from "@rbxts/binder";
import { wait } from "@rbxts/delay-spawn-wait";
import Option, { IOption } from "@rbxts/option";
import { CollectionService, Players, RunService, ServerStorage } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { t } from "@rbxts/t";
import { validateTree } from "@rbxts/validate-tree";
import { $instance } from "rbxts-transformer-fs";
import type Unlockable from "Server/Components/Tycoon/Unlockable";
import { OBJECT_SPAWN_ANIMATION_TIME } from "Server/Constants/animation";
import { ModelHighlighter } from "Shared/Classes/ModelHighlighter";
import { findFirstDescendant } from "Shared/Util/findFirstDescendant";
import { lerpNumber } from "Shared/Util/lerpNumber";

import Spring from "../../../../rbxlua/Spring";
import type { TycoonAttributes, TycoonModel, TycoonServerBaseComponent } from "../../../../typings/tycoon";
import type { CashService as CashServiceType } from "../CashService";
import type { TycoonService } from "../TycoonService";

declare global {
	interface ServerTycoonComponents {}
}

let CashService: CashServiceType;

const componentContainer = new Instance("Folder");
componentContainer.Name = "ComponentContainers";
componentContainer.Parent = ServerStorage;

const tycoonModelCheck = (instance: Instance): instance is TycoonModel =>
	validateTree(instance, {
		$className: "Model",
		Components: "Folder",
		Ores: "Folder",
		Spawn: "SpawnLocation",
	});

const moduleStorage = $instance<Folder>("src/Server/Components/Tycoon");
const componentClassCheck = t.interface({
	init: t.callback,
	destroy: t.callback,
});

const RISE_FROM_Y = 5;

let currentComponentId = 0;
let tycoonService: TycoonService;

function doObjectAnimation(model: Model): void {
	const highlighter = new ModelHighlighter(model, [model.PrimaryPart!]);
	highlighter.setTransparency(1);
	highlighter.setCanCollide(false);
	highlighter.setCastShadow(false);

	wait(0.2);

	new Promise<void>(resolve => {
		const spring = new Spring<number>(0);
		const baseCFrame = model.PrimaryPart!.CFrame;

		spring.SetDamper(0.4).SetSpeed(13.4).SetTarget(1);

		let timer = 0;
		let connection: RBXScriptConnection;
		let isResolved = false;

		connection = RunService.Heartbeat.Connect(dt => {
			if (isResolved) {
				task.wait();
				return highlighter.reset();
			}

			timer += dt;

			if (timer >= OBJECT_SPAWN_ANIMATION_TIME) {
				isResolved = true;
				model.SetPrimaryPartCFrame(baseCFrame);
				connection.Disconnect();
				highlighter.reset();
				return resolve();
			}

			const position = spring.GetPosition();
			highlighter.setTransparencyLerp(lerpNumber(1, 0, timer / OBJECT_SPAWN_ANIMATION_TIME));
			model.SetPrimaryPartCFrame(baseCFrame.ToWorldSpace(new CFrame(0, lerpNumber(RISE_FROM_Y, 0, position), 0)));
		});
	})
		.then(() => {
			task.wait();
			highlighter.reset();
		})
		.await();
}

export class Tycoon implements BinderClass {
	private _activeComponents = new Array<TycoonServerBaseComponent>();
	private _components = new Map<string, Unlockable>();
	private _attributes: Attributes<TycoonAttributes>;

	private _collectedCash = 0;

	public Instance: TycoonModel;
	public objectUnlocked = new Signal<(name: string) => void>();
	public collectedCash = new Signal<(newAmount: number) => void>();

	public constructor(instance: Instance) {
		// every tycoon must be a model class
		assert(instance.IsA("Model"));
		assert(tycoonModelCheck(instance), "Invalid structure tree!");

		currentComponentId++;

		this.Instance = instance as TycoonModel;
		this._attributes = new Attributes(this.Instance);
		this._attributes.set("ComponentId", `Tycoon${currentComponentId}`);

		// load cash service
		if (!CashService) {
			CashService = Dependency<CashServiceType>();
		}
	}

	// Collector
	public collectCollectedCash(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.getOwner().Match({
				Some: player =>
					CashService.setFromPlayer(player, oldValue => {
						const newCash = this._collectedCash + oldValue;
						this._collectedCash = 0;

						resolve();

						return newCash;
					}),
				None: () => reject(`No owner!`),
			});
		});
	}

	public earnCollectedCash(amount: number): void {
		this._collectedCash += amount;
		this.collectedCash.Fire(this._collectedCash);
	}

	public getCollectedCash(): number {
		return this._collectedCash;
	}

	// Owner stuff
	public assignOwner(player: Player): Promise<void> {
		if (this._attributes.has("Owner")) {
			return Promise.reject("Yes") as Promise<void>;
		}
		return new Promise((resolve, reject) => {
			// load tycoonService if it does not exists
			if (tycoonService === undefined) {
				tycoonService = Dependency<TycoonService>();
			}

			// making sure that player hasn't left the game yet
			if (!player.IsDescendantOf(Players)) {
				return reject(`${player.Name} had left the game`);
			}

			// get player's tycoon (if possible)
			if (tycoonService.getTycoonFromPlayer(player).IsSome()) {
				return reject(`${player.Name} had already owned a tycoon!`);
			}

			this._attributes.set("Owner", player.UserId);
			player.RespawnLocation = this.Instance.Spawn;
			resolve();
		});
	}

	public hasOwner(): boolean {
		return this._attributes.has("Owner");
	}

	public getOwnerId(): IOption<number> {
		return Option.Wrap(this._attributes.getOr("Owner", -1));
	}

	public getOwner(): IOption<Player> {
		const playerFromId = Players.GetPlayerByUserId(this._attributes.getOr("Owner", -100));
		return Option.Wrap(playerFromId!);
	}

	public getUnlockableComponentFromName(name: string): Unlockable | undefined {
		return this._components.get(name);
	}

	public getComponentId(): string {
		return this._attributes.get("ComponentId");
	}

	// Component object system
	public lockComponent(instance: Model): void {
		// we don't want to relock it obviously
		if (instance.IsDescendantOf(componentContainer)) {
			return undefined;
		}

		// save somewhere in ServerStorage
		instance.Parent = componentContainer;

		const component = this._createComponent(instance, "Unlockable");
		this._components.set(instance.Name, component);
	}

	public unlock(unlockable: Unlockable): void {
		const owner = this.getOwner();
		assert(owner.IsSome(), "Owner left the game!");

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		const price = unlockable.getPrice();

		CashService.spendFromPlayer(owner.Unwrap(), price)
			.then(() => {
				const instance = unlockable.instance;
				CollectionService.RemoveTag(instance, "Unlockable");

				instance.Parent = this.Instance.Components;

				this.objectUnlocked.Fire(instance.Name);

				// fancy animations
				unlockable.setButtonVisibility(false, false);
				doObjectAnimation(instance);

				this.addComponents(instance);
				unlockable.onSpawn();
			})
			.catch(e => {
				unlockable.setDebounce(true);
				warn(e);
			});
	}

	public lockAll(): void {
		for (const model of this.Instance.Components.GetDescendants()) {
			if (!model.IsA("Model")) continue;

			// same names do not work together
			if (this._components.has(model.Name)) {
				error(`Attempting to override existing component: ${model.Name}`);
			}

			if (CollectionService.HasTag(model, "Unlockable")) {
				this.lockComponent(model);
			} else {
				this.addComponents(model);
			}
		}
	}

	public isTerminated(): boolean {
		// easy pessy
		return this.Instance.Parent === undefined;
	}

	private _createComponent<T extends keyof ServerTycoonComponents>(
		instance: Model,
		tag: T,
	): ServerTycoonComponents[T];
	private _createComponent(instance: Model, tag: string): TycoonServerBaseComponent;
	private _createComponent(instance: Model, tag: string): TycoonServerBaseComponent {
		// find that component script
		const module = findFirstDescendant(moduleStorage, tag);

		// validating component module
		if (module === undefined || !module.IsA("ModuleScript")) {
			throw `Invalid or unknown component: ${tag}`;
		}

		// checking the contents of the module itself
		const componentClass = require(module);

		// rbxts-transformer-t does not support class types
		// we need to check if that thing is exists
		assert(componentClassCheck(componentClass), `Invalid component: ${tag} (Lacking required methods)`);

		// then, let's assume it is a component
		// instantiate it :D
		const convertedClass = componentClass as unknown as Constructor<TycoonServerBaseComponent>;
		const component = new convertedClass(instance, this);

		this._activeComponents.push(component);
		component.init();

		return component;
	}

	public addComponents(instance: Model): void {
		// eslint-disable-next-line prettier/prettier
		CollectionService
			.GetTags(instance)
			.forEach(tag => this._createComponent(instance, tag));
	}

	// Base initialization
	public init(): void {
		this.lockAll();
		print("The tycoon was initialized");
	}

	// I know this method name is little bit funky than the rest
	// of the methods because @rbxts/binder requires it
	// (I will try to find a way to break that rule)
	public Destroy(): void {
		this._activeComponents.forEach(component =>
			task.spawn((c: TycoonServerBaseComponent) => c.destroy(), component),
		);
		this._components.forEach(component => {
			if (!component.isSpawned()) {
				component.destroy();
			}
		});
	}
}
