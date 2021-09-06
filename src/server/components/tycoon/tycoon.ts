import { Dependency } from "@flamework/core";
import Attributes from "@memolemo-studios/rbxts-attributes";
import { BinderClass } from "@rbxts/binder";
import Option from "@rbxts/option";
import { Players } from "@rbxts/services";
import { TycoonService as TycoonServiceType } from "server/services/TycoonService";
import { TycoonModel } from "shared/typeGuards";

import { TycoonAttributes } from "../../../../typings/tycoon";

let TycoonService: TycoonServiceType;
let areServicesLoaded = false;

function reloadServices() {
	if (areServicesLoaded) {
		return;
	}

	TycoonService = Dependency<TycoonServiceType>();
	areServicesLoaded = true;
}

function assertTycoonModel(object: Instance): asserts object is TycoonModel {
	if (!TycoonModel(object)) {
		error(`${object.GetFullName()} has 'Tycoon' tag but don't follow the required structure tree!`);
	}
}

export default class ServerTycoon implements BinderClass {
	private attributes: Attributes<TycoonAttributes>;

	instance: TycoonModel;

	// binder requires exact parameters like this
	constructor(instance: Instance) {
		// every tycoon must met its required structure tree
		assertTycoonModel(instance);

		this.instance = instance;
		this.attributes = new Attributes(instance);

		// reload services
		reloadServices();
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

	public getOwner() {
		return Option.Wrap(Players.GetPlayerByUserId(this.attributes.getOr("Owner", -100))!);
	}

	public assignOwner(player: Player): Promise<void> {
		if (this.attributes.has("Owner")) {
			return Promise.reject(`This tycoon is already owned by someone!`) as Promise<void>;
		}
		return new Promise((resolve, reject) => {
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

	public hasOwner() {
		return this.attributes.has("Owner");
	}

	// binder requires this method
	Destroy() {}
}
