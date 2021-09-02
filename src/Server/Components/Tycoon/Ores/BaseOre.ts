import { Janitor } from "@rbxts/janitor";
import { CollectionService } from "@rbxts/services";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

import type { BaseOrePart } from "../../../../../typings/tycoon";

export const ORE_TAG_NAME = "Ore";

export class BaseOre {
	private _janitor = new Janitor();

	public instance: BaseOrePart;

	public constructor(public tycoon: Tycoon, public readonly worth: number, spawnCFrame: CFrame) {
		const owner = this.tycoon.getOwner();
		if (owner.IsNone()) {
			throw `Unexpected error, No owner!`;
		}

		const instance = new Instance("Part");
		instance.Parent = tycoon.Instance.Ores;
		instance.Size = new Vector3(1, 1, 1);
		instance.CFrame = spawnCFrame;
		instance.SetNetworkOwner(owner.Unwrap());

		// create worth value
		const worthValue = new Instance("NumberValue");
		worthValue.Name = "Worth";
		worthValue.Value = worth;

		// assign ore to the CollectionService (useful for later :D)
		CollectionService.AddTag(instance, ORE_TAG_NAME);

		this.instance = instance as BaseOrePart;
		this._janitor.Add(
			this.instance.AncestryChanged.Connect((_, parent) => {
				if (parent === undefined) {
					CollectionService.RemoveTag(this.instance, ORE_TAG_NAME);
					this.destroy();
				}
			}),
		);
	}

	public destroy(): void {
		this._janitor.Destroy();
		if (this.instance !== undefined && this.instance.Parent !== undefined) {
			this.instance.Destroy();
		}
	}
}
