import { Janitor } from "@rbxts/janitor";
import { CollectionService, RunService } from "@rbxts/services";
import { validateTree } from "@rbxts/validate-tree";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

import type { BaseOrePart, TycoonServerBaseComponent } from "../../../../typings/tycoon";
import { ORE_TAG_NAME } from "./Ores/BaseOre";

interface FurnaceModel extends Model {
	Furnace: Model & {
		Lava: Part;
	};
}

const validateFurnaceModel = (instance: Instance): instance is FurnaceModel =>
	validateTree(instance, {
		$className: "Model",
		Furnace: {
			$className: "Model",
			Lava: "Part",
		},
	});

function isAnOre(basePart: BasePart): basePart is BaseOrePart {
	return CollectionService.HasTag(basePart, ORE_TAG_NAME);
}

/** @hidden */
class Furnace implements TycoonServerBaseComponent {
	private _realInstance: FurnaceModel;

	private _janitor = new Janitor();

	public constructor(public instance: Model, public tycoon: Tycoon) {
		assert(validateFurnaceModel(instance), `${instance.GetFullName()} has invalid Furnace structure tree`);

		this._realInstance = instance;
	}

	private _burnOre(ore: BaseOrePart): void {
		const worth = ore.Worth;
		assert(worth, "Expected 'Worth' value in every ore!");

		// destroy that ore and earn some money
		ore.Destroy();
		this.tycoon.earnCollectedCash(worth.Value);
	}

	private _onTouched(ore: BasePart): void {
		// checking if that part is an ore
		if (!isAnOre(ore)) return;
		this._burnOre(ore);
	}

	public init(): void {
		this._janitor.Add(this._realInstance.Furnace.Lava.Touched.Connect(ore => this._onTouched(ore)));
	}

	public destroy(): void {
		this._janitor.Destroy();
	}
}

export = Furnace;
