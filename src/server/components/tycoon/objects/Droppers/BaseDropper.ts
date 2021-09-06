import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { RunService } from "@rbxts/services";
import { t } from "@rbxts/t";
import { ServerBaseTycoonComponent } from "server/typings";

import { DropperAttributes, requireOreTypeClass, throwInvalidStructureMsg } from "../../shared";
import ServerTycoon from "../../tycoon";

const DropperModel = t.intersection(
	t.children({
		Drops: t.instanceIsA("Model"),
	}),
	t.instanceIsA("Model"),
);

type DropperModel = t.static<typeof DropperModel>;

const DEFAULT_WORTH = 1;
const oreTypeConstructor = requireOreTypeClass("BaseOre");

function assertDropperModel(instance: Instance): asserts instance is DropperModel {
	if (!DropperModel(instance)) {
		throwInvalidStructureMsg(instance, "BaseDroper");
	}
}

class BaseDropper implements ServerBaseTycoonComponent<DropperModel> {
	private attributes: Attributes<DropperAttributes>;
	private janitor = new Janitor();

	drops: BasePart[];
	instance: DropperModel;

	constructor(instance: Instance, public tycoon: ServerTycoon) {
		assertDropperModel(instance);
		this.instance = instance;
		this.attributes = new Attributes(this.instance);

		this.attributes.default({
			Type: "BaseOre",
			Worth: DEFAULT_WORTH,
		});

		this.attributes.expectMultiple({
			Rate: "number",
			Worth: "number",
			Type: "string",
		});

		this.drops = this.instance.Drops.GetChildren().filter((child): child is BasePart => child.IsA("BasePart"));
	}

	// useful if it is inherited
	private spawnOre(currentWorth: number, cframe: CFrame) {
		new oreTypeConstructor(this.tycoon, currentWorth, cframe);
	}

	private spawnOreFromDropPart(dropPart: BasePart) {
		const currentWorth = this.attributes.get("Worth");

		// we don't need to stop this because it is spawned from a different thread
		pcall(() => this.spawnOre(currentWorth, dropPart.CFrame));
	}

	private requestDropOre() {
		// drop every drop part
		for (const drop of this.drops) {
			task.spawn((part: BasePart) => this.spawnOreFromDropPart(part), drop);
		}
	}

	init() {
		const secondsPerRate = this.attributes.get("Rate");
		let timer = 0;

		const onHeartbeat = (dt: number) => {
			timer += dt;
			if (timer < secondsPerRate) return;

			timer = 0;
			this.requestDropOre();
		};

		this.janitor.Add(RunService.Heartbeat.Connect(onHeartbeat));
	}

	destroy() {
		this.janitor.Destroy();
	}
}

export = BaseDropper;
