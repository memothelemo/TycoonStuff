import { Dependency } from "@flamework/core";
import Attributes from "@memolemo-studios/rbxts-attributes";
import { BinderClass } from "@rbxts/binder";
import Option, { IOption } from "@rbxts/option";
import { CollectionService, Players, ServerStorage } from "@rbxts/services";
import { t } from "@rbxts/t";
import { $instance } from "rbxts-transformer-fs";
import { findFirstDescendant } from "Shared/Util/findFirstDescendant";
import type Unlockable from "Server/Components/Tycoon/Unlockable";
import type { TycoonAttributes, TycoonModel, TycoonServerBaseComponent } from "../../../../typings/tycoon";
import type { TycoonService } from "../TycoonService";
import type { CashService as CashServiceType } from "../CashService";
import { validateTree } from "@rbxts/validate-tree";

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
	});

const moduleStorage = $instance<Folder>("src/Server/Components/Tycoon");
const componentClassCheck = t.interface({
	init: t.callback,
	destroy: t.callback,
});

let currentComponentId = 0;
let tycoonService: TycoonService;

export class Tycoon implements BinderClass {
	private _attributes: Attributes<TycoonAttributes>;

	public Instance: TycoonModel;

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

		task.spawn(() => this.init());
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
			resolve();
		});
	}

	public hasOwner(): boolean {
		return this._attributes.has("Owner");
	}

	public getOwner(): IOption<Player> {
		const playerFromId = Players.GetPlayerByUserId(this._attributes.getOr("Owner", -1));
		return Option.Wrap(playerFromId!);
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
		component.init();
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

				this.lockComponent(instance);
				instance.Parent = this.Instance.Components;

				// TODO: animations
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

			// require PrimaryPart
			if (!model.PrimaryPart) {
				warn(
					`${model.GetFullName()} lacked PrimaryPart, please assign one. This model will be temporarily disabled`,
				);
				continue;
			}

			if (CollectionService.HasTag(model, "Unlockable")) {
				this.lockComponent(model);
			} else {
				this.addComponents(model);
			}
		}
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
	public Destroy(): void {}
}
