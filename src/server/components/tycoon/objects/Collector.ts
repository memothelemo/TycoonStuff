import { Janitor } from "@rbxts/janitor";
import { t } from "@rbxts/t";
import { ServerBaseTycoonComponent } from "server/typings";
import { detectPlayerTouchesPart } from "shared/util/detectPlayerTouchesPart";

import { throwInvalidStructureMsg } from "../shared";
import ServerTycoon from "../tycoon";

const BUSY_COLOR = Color3.fromRGB(214, 41, 41);
const ACTIVE_COLOR = Color3.fromRGB(107, 214, 82);

const TEXT_FORMATTER = (cash: number): string => `$${cash}`;
const DEBOUNCE_TIMEOUT = 0.5;

// this is long than i thought lol
const CollectorModel = t.intersection(
	t.children({
		Giver: t.instanceIsA("BasePart"),
		Screen: t.intersection(
			t.children({
				SurfaceGui: t.intersection(
					t.children({ Amount: t.instanceIsA("TextLabel") }),
					t.instanceIsA("SurfaceGui"),
				),
			}),
			t.instanceIsA("BasePart"),
		),
	}),
	t.instanceOf("Model"),
);

type CollectorModel = t.static<typeof CollectorModel>;

function assertCollectorModel(instance: Instance): asserts instance is CollectorModel {
	if (!CollectorModel(instance)) {
		throwInvalidStructureMsg(instance, "Collector");
	}
}

class Collector implements ServerBaseTycoonComponent<CollectorModel> {
	private debounce = true;
	private janitor = new Janitor();

	instance: CollectorModel;

	constructor(instance: Instance, public tycoon: ServerTycoon) {
		assertCollectorModel(instance);
		this.instance = instance;
	}

	private setDebounce(bool: boolean) {
		this.debounce = bool;
		this.updateGiverColor();
	}

	private onTouched(player: Player) {
		// only owners can do that
		if (!this.tycoon.getOwner().Contains(player)) return;
		if (!this.debounce) return;
		this.setDebounce(false);

		this.tycoon
			.collectCollectedCash()
			.then(() => this.update())
			.then(() => Promise.delay(DEBOUNCE_TIMEOUT))
			.catch(e => warn(e))
			.finally(() => this.setDebounce(true));
	}

	updateGiverColor() {
		const currentColor = this.debounce ? ACTIVE_COLOR : BUSY_COLOR;
		this.instance.Giver.Color = currentColor;
	}

	update() {
		// easy pessy
		this.instance.Screen.SurfaceGui.Amount.Text = TEXT_FORMATTER(this.tycoon.getCollectedCash());
	}

	init() {
		this.update();
		this.updateGiverColor();

		this.janitor.Add(this.tycoon.onCollectedCash.Connect(() => this.update()));
		this.janitor.Add(detectPlayerTouchesPart(this.instance.Giver, player => this.onTouched(player)));
	}

	destroy() {
		this.janitor.Destroy();
	}
}

export = Collector;
