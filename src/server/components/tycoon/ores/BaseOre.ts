import { Janitor } from "@rbxts/janitor";
import { CollectionService } from "@rbxts/services";

import { ORE_TAG_NAME } from "../shared";
import ServerTycoon from "../tycoon";

declare global {
	interface ServerOres {
		BaseOre: typeof ServerBaseOre;
	}
}

class ServerBaseOre<T extends BaseOrePart = BaseOrePart> {
	private janitor = new Janitor();

	instance: T;

	constructor(public tycoon: ServerTycoon, worth: number, spawnCFrame: CFrame) {
		const ownerOpt = tycoon.getOwner();
		ownerOpt.Expect("No owner?!");

		// @rbxts/make took awhile to compile
		const instance = new Instance("Part") as T;
		instance.CFrame = spawnCFrame;

		const worthPart = new Instance("NumberValue");
		worthPart.Name = "Worth";
		worthPart.Value = worth;

		this.dressOre(instance);

		instance.Parent = tycoon.instance.Ores;
		instance.SetNetworkOwner(ownerOpt.Unwrap());

		// assign ore to the CollectService (useful for referencing later)
		CollectionService.AddTag(instance, ORE_TAG_NAME);

		this.instance = instance;
		this.janitor.LinkToInstance(instance, false);
	}

	// this is going to be so useful if we going to inherit this to other classes
	private dressOre(instance: T) {
		instance.Size = new Vector3(1, 1, 1);
	}

	destroy() {
		if (this.janitor["Destroy"] !== undefined) {
			this.janitor.Destroy();
		}
	}
}

export = ServerBaseOre;
