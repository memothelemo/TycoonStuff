import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { ServerBaseTycoonComponent } from "server/typings";

import { throwInvalidStructureMsg } from "../shared";
import ServerTycoon from "../tycoon";

declare global {
	interface ServerTycoonComponents {
		Unlockable: Unlockable;
	}
}

interface UnlockableAttributes {
	DisplayName: string;
}

function assertUnlockableModel(instance: Instance): asserts instance is Model {
	if (!instance.IsA("Model")) {
		throwInvalidStructureMsg(instance, "Unlockable");
	}
}

class Unlockable implements ServerBaseTycoonComponent<Model> {
	private janitor = new Janitor();
	private attributes: Attributes<UnlockableAttributes>;

	readonly unlockable_symbol = ":D";
	instance: Model;

	constructor(instance: Instance, public tycoon: ServerTycoon) {
		assertUnlockableModel(instance);

		this.attributes = new Attributes(instance);
		this.instance = instance;

		this.attributes.default({
			DisplayName: instance.Name,
		});

		this.attributes.expectType("DisplayName", "string");
		this.janitor.Add(this.attributes);
	}

	isSpawned() {
		return this.instance.Parent !== this.tycoon.instance.Components;
	}

	init() {
		// noop
	}

	onSpawn() {
		this.destroy();
	}

	destroy() {
		if (this.janitor["Destroy"] !== undefined) {
			this.janitor.Destroy();
		}
	}
}

export = Unlockable;
