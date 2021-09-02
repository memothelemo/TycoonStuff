import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { RunService } from "@rbxts/services";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

import type { TycoonServerBaseComponent } from "../../../../../typings/tycoon";

interface ConveyorAttributes {
	Speed: number;
}

interface ConveyorModel extends Model {
	Movers: Model;
}

function createAttachmentFromVector(vector: Vector3): Attachment {
	const attachment = new Instance("Attachment");
	attachment.Position = vector;

	return attachment;
}

/** @hidden */
class BaseConveyor implements TycoonServerBaseComponent {
	private _realInstance: ConveyorModel;
	private _attributes: Attributes<ConveyorAttributes>;

	private _janitor = new Janitor();

	public constructor(public instance: Model, public tycoon: Tycoon) {
		if (!instance.FindFirstChild("Movers")) {
			error(`${instance.GetFullName()} must have Movers model`);
		}

		this._realInstance = instance as ConveyorModel;
		this._attributes = new Attributes(this.instance);

		if (!this._attributes.has("Speed")) {
			error(`${instance.GetFullName()} had no Speed attribute, please set it up!`);
		}
	}

	public init(): void {
		const speed = this._attributes.get("Speed");

		// This is how you make a conveyor with modern ROBLOX features
		for (const conveyor of this._realInstance.Movers.GetChildren()) {
			if (conveyor.IsA("Part")) {
				conveyor.AssemblyLinearVelocity = new Vector3(0, 0, -speed);
			}
		}
	}

	public destroy(): void {
		this._janitor.Destroy();
	}
}

export = BaseConveyor;