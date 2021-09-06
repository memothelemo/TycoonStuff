import { Janitor } from "@rbxts/janitor";
import Make from "@rbxts/make";
import { CollectionService } from "@rbxts/services";

import ServerTycoon from "../tycoon";

declare global {
	interface ServerOres {
		BaseOre: typeof ServerBaseOre;
	}
}

const ORE_TAG_NAME = "Ore";

class ServerBaseOre<T extends BaseOrePart = BaseOrePart> {
	private janitor = new Janitor();

	instance: T;

	constructor(public tycoon: ServerTycoon, worth: number, spawnCFrame: CFrame) {
		const ownerOpt = tycoon.getOwner();
		ownerOpt.Expect("No owner?!");

		const instance = Make("Part", {
			Children: [
				Make("NumberValue", {
					Name: "Worth",
					Value: worth,
				}),
			],
			CFrame: spawnCFrame,
		}) as T;

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
