import { Dependency } from "@flamework/core";
import Attributes from "@memolemo-studios/rbxts-attributes";
import { BinderClass } from "@rbxts/binder";
import Option from "@rbxts/option";
import { CollectionService, Players, ServerStorage } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { $instance } from "rbxts-transformer-fs";
import { TycoonService as TycoonServiceType } from "server/services/TycoonService";
import { checkTycoonBaseComponentClass, ServerBaseTycoonComponent } from "server/typings";
import { TycoonModel } from "shared/typeGuards";

import Unlockable from "./objects/Unlockable";
import { throwErrorFromInstance, throwInvalidStructureMsg, UNLOCKABLE_TAG } from "./shared";

const componentSafe = new Instance("Folder");
componentSafe.Name = "TEMP_CONTAINER";
componentSafe.Parent = ServerStorage;

const moduleStorage = $instance<Folder>("src/server/components/tycoon/objects");

let TycoonService: TycoonServiceType;
let areServicesLoaded = false;
let totalTycoons = 0;

function reloadServices() {
	if (areServicesLoaded) {
		return;
	}

	TycoonService = Dependency<TycoonServiceType>();
	areServicesLoaded = true;
}

function isUnlockableComponent(component: ServerBaseTycoonComponent): component is Unlockable {
	// cheat way if it is unlockable
	if ("unlockable_symbol" in component) {
		return true;
	}
	return false;
}

function assertTycoonModel(object: Instance): asserts object is TycoonModel {
	if (!TycoonModel(object)) {
		throwInvalidStructureMsg(object, "Tycoon");
	}
}

export default class ServerTycoon implements BinderClass {
	private attributes: Attributes<TycoonAttributes>;
	private components = new Array<ServerBaseTycoonComponent>();

	private collectedCash = 0;

	onCollectedCash = new Signal<(newAmount: number) => void>();
	onUnlockedComponent = new Signal<(componentName: string) => void>();
	instance: TycoonModel;

	// binder requires exact parameters like this
	constructor(instance: Instance) {
		// every tycoon must met its required structure tree
		assertTycoonModel(instance);

		totalTycoons++;

		this.instance = instance;
		this.attributes = new Attributes(instance);
		this.attributes.set("ComponentId", `Tycoon${totalTycoons}`);
	}

	// collector
	collectCollectedCash() {
		// this is going to be a noop atm
		return new Promise<void>(resolve => resolve());
	}

	earnCollectedCash(change: number) {
		this.onCollectedCash.Fire((this.collectedCash += change));
	}

	getCollectedCash() {
		return this.collectedCash;
	}

	// tycoon methods
	init() {
		warn("The tycoon is initialized");
		this.lockAll();
	}

	getComponentId() {
		return this.attributes.get("ComponentId");
	}

	// component methods
	private createComponent<T extends keyof ServerTycoonComponents>(
		instance: Instance,
		tag: T,
	): ServerTycoonComponents[T];
	private createComponent(instance: Instance, tag: string): ServerBaseTycoonComponent;
	private createComponent(instance: Instance, tag: string): ServerBaseTycoonComponent {
		// find that component script
		const module = moduleStorage.FindFirstChild(tag, true);

		// validating component module
		if (module === undefined || !module.IsA("ModuleScript")) {
			throwErrorFromInstance(instance, `Invalid or unknown component: ${tag}`);
		}

		// checking the contents of the module itself
		const componentClass = require(module);

		// validating base component class
		if (!checkTycoonBaseComponentClass(componentClass)) {
			throwErrorFromInstance(instance, `Invalid component module: ${tag}`);
		}

		// assume it is a component, instantiate it
		const component = new componentClass(instance, this);
		component.init();

		this.components.push(component);

		return component;
	}

	private lockComponent(instance: Instance) {
		// we don't want to relock it obviously
		if (instance.IsDescendantOf(componentSafe)) {
			return;
		}

		// save in a secure container
		instance.Parent = componentSafe;

		this.createComponent(instance, UNLOCKABLE_TAG);
	}

	private lockAll() {
		for (const descendant of this.instance.Components.GetDescendants()) {
			if (CollectionService.HasTag(descendant, UNLOCKABLE_TAG)) {
				this.lockComponent(descendant);
			} else {
				this.addComponents(descendant);
			}
		}
	}

	getUnlockableFromName(name: string): Unlockable {
		const filtered = this.components
			.filter((component): component is Unlockable => isUnlockableComponent(component))
			.filter(unlockable => unlockable.instance.Name === name);

		if (filtered.size() > 1) {
			error(`Duplicated unlockable component: ${name}`);
		}

		assert(filtered[0], `${name} is not registered as Unlockable!`);
		return filtered[0];
	}

	unlock(unlockable: Unlockable): Promise<void> {
		return new Promise((resolve, reject) => {
			const owner = this.getOwner();
			if (owner.IsNone()) {
				return reject(`Owner left the game!`);
			}

			// spawn that guy
			const instance = unlockable.instance;
			CollectionService.RemoveTag(instance, UNLOCKABLE_TAG);

			instance.Parent = this.instance.Components;
			this.addComponents(instance);
			this.onUnlockedComponent.Fire(instance.Name);

			resolve();
		});
	}

	addComponents(instance: Instance) {
		CollectionService.GetTags(instance).forEach(tag => this.createComponent(instance, tag));
	}

	// owner methods
	private setupForOwner() {
		this.getOwner().Match({
			Some: owner => {
				owner.RespawnLocation = this.instance.Spawn;
			},
			None: () => error(`This tycoon has no owner!`),
		});
	}

	getOwner() {
		return Option.Wrap(Players.GetPlayerByUserId(this.attributes.getOr("Owner", -100))!);
	}

	assignOwner(player: Player): Promise<void> {
		if (this.attributes.has("Owner")) {
			return Promise.reject(`This tycoon is already owned by someone!`) as Promise<void>;
		}
		return new Promise((resolve, reject) => {
			// reload services
			reloadServices();

			// making sure player hasn't left the game
			if (!player.IsDescendantOf(Players)) {
				return reject(`${player.Name} had left the game`);
			}

			// making sure player doesn't have multiple tycoons
			if (TycoonService.hasTycoonFromPlayer(player)) {
				return reject(`${player.Name} has already owned a tycoon!`);
			}

			this.attributes.set("Owner", player.UserId);
			this.setupForOwner();

			resolve();
		});
	}

	hasOwner() {
		return this.attributes.has("Owner");
	}

	// binder requires this method
	Destroy() {}
}
