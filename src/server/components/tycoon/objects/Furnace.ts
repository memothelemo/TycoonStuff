import { Janitor } from "@rbxts/janitor";
import { CollectionService } from "@rbxts/services";
import { t } from "@rbxts/t";
import { ServerBaseTycoonComponent } from "server/typings";

import { ORE_TAG_NAME, throwInvalidStructureMsg } from "../shared";
import ServerTycoon from "../tycoon";

const FurnaceModel = t.intersection(
	t.children({
		Lava: t.instanceIsA("BasePart"),
	}),
	t.instanceIsA("Model"),
);

type FurnaceModel = t.static<typeof FurnaceModel>;

function assertFurnaceModel(object: Instance): asserts object is FurnaceModel {
	if (!FurnaceModel(object)) {
		throwInvalidStructureMsg(object, "Furnace");
	}
}

function isAnOre(basePart: BasePart): basePart is BaseOrePart {
	return CollectionService.HasTag(basePart, ORE_TAG_NAME);
}

class Furnace implements ServerBaseTycoonComponent<FurnaceModel> {
	private janitor = new Janitor();

	instance: FurnaceModel;

	constructor(instance: Instance, public tycoon: ServerTycoon) {
		assertFurnaceModel(instance);
		this.instance = instance;
	}

	private burnOre(ore: BaseOrePart) {
		const worth = ore.Worth;
		assert(worth, "Expected 'Worth' child in every ore");

		// destroy that ore and earn some money
		ore.Destroy();
		this.tycoon.earnCollectedCash(worth.Value);
	}

	private onTouched(ore: BasePart) {
		// checking if part is an ore
		if (!isAnOre(ore)) return;
		this.burnOre(ore);
	}

	init() {
		this.janitor.Add(this.instance.Lava.Touched.Connect(ore => this.onTouched(ore)));
	}

	destroy() {
		if (this.janitor["Destroy"] !== undefined) {
			this.janitor.Destroy();
		}
	}
}

export = Furnace;
