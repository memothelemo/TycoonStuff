import Attributes from "@memolemo-studios/rbxts-attributes";
import { validateWithMessage } from "@rbxts/attributes-validate";
import { Janitor } from "@rbxts/janitor";
import { RunService } from "@rbxts/services";
import { validateTree } from "@rbxts/validate-tree";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

import type { TycoonServerBaseComponent } from "../../../../typings/tycoon";
import { BaseOre } from "./Ores/BaseOre";

interface DropperAttributes {
	Rate: number;
	Worth: number;
}

interface DropperModel extends Model {
	Drops: Model;
	Parts: Model;
}

const validateDropperModel = (instance: Instance): instance is DropperModel =>
	validateTree(instance, {
		$className: "Model",
		Drops: "Model",
		Parts: "Model",
	});

const ORE_SIZE = new Vector3(1, 1, 1);
const DEFAULT_WORTH = 1;

/** @hidden */
class Dropper implements TycoonServerBaseComponent {
	private _realInstance: DropperModel;
	private _attributes: Attributes<DropperAttributes>;

	private _janitor = new Janitor();

	public constructor(public instance: Model, public tycoon: Tycoon) {
		assert(validateDropperModel(instance), `${instance.GetFullName()} has invalid Dropper required structure tree`);

		this._realInstance = instance;
		this._attributes = new Attributes(this._realInstance);

		// Worth attribute in default
		if (!this._attributes.has("Worth")) {
			this._attributes.set("Worth", DEFAULT_WORTH);
		}

		const [success, message] = validateWithMessage(instance, {
			Rate: "number",
			Worth: "number",
		});
		assert(success, message);
	}

	private _spawnOreFromDropPart(dropPart: Part): void {
		// get the spawn point below the drop part
		const spawnCFrame = dropPart.CFrame.ToWorldSpace(new CFrame(0, -(dropPart.Size.Y / 2 - ORE_SIZE.Y), 0));
		const currentWorth = this._attributes.get("Worth");

		// if the tycoon is terminated, it is not the good time
		if (this.tycoon.isTerminated()) return;

		// we don't need to stop this because it is spawned from a different thread
		new BaseOre(this.tycoon, currentWorth, spawnCFrame);
	}

	public init(): void {
		const secondsPerRate = this._attributes.get("Rate");
		const drops = this._realInstance.Drops.GetChildren().filter((child): child is Part => child.IsA("Part"));
		let timer = 0;

		const onHeartbeat = (dt: number): void => {
			timer += dt;
			if (timer >= secondsPerRate) {
				timer = 0;

				// drop every drop part
				for (const drop of drops) {
					task.spawn((part: Part) => this._spawnOreFromDropPart(part), drop);
				}
			}
		};

		this._janitor.Add(RunService.Heartbeat.Connect(onHeartbeat));
	}

	public destroy(): void {
		this._janitor.Destroy();
	}
}

export = Dropper;
