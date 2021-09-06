import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { t } from "@rbxts/t";
import { ServerBaseTycoonComponent } from "server/typings";
import { detectPlayerTouchesPart } from "shared/util/detectPlayerTouchesPart";

import { throwInvalidStructureMsg } from "../shared";
import ServerTycoon from "../tycoon";

declare global {
	interface ServerTycoonComponents {
		Unlockable: Unlockable;
	}
}

interface UnlockableAttributes {
	Price: number;
	Dependency: string;
	DisplayName: string;
}

const UnlockableModel: t.check<UnlockableModel> = t.intersection(
	t.children({
		Button: t.instanceIsA("Part"),
	}),
	t.instanceIsA("Model"),
);

function assertUnlockableModel(instance: Instance): asserts instance is UnlockableModel {
	if (!UnlockableModel(instance)) {
		throwInvalidStructureMsg(instance, "Unlockable");
	}
}

class Unlockable implements ServerBaseTycoonComponent<UnlockableModel> {
	private attributes: Attributes<UnlockableAttributes>;
	private janitor = new Janitor();
	private button: Part;
	private debounce = true;

	instance: UnlockableModel;

	constructor(instance: Instance, public tycoon: ServerTycoon) {
		assertUnlockableModel(instance);

		this.attributes = new Attributes(instance);
		this.instance = instance;
		this.button = instance.Button;

		this.attributes.default({
			Price: 0,
			DisplayName: instance.Name,
		});

		this.attributes.expectMultiple({
			Price: ["nil", "number"],
			Dependency: ["nil", "string"],
			DisplayName: ["string"],
		});
	}

	private onButtonTouched(player: Player) {
		if (this.tycoon.getOwner().Contains(player)) {
			this.tycoon.unlock(this);
			this.destroy();
		}
	}

	setButtonVisbility(bool: boolean) {
		const float = bool ? 0 : 1;
		this.button.Transparency = float;
		this.button.CanCollide = bool;
	}

	init() {
		this.janitor.Add(this.button);
		this.janitor.Add(detectPlayerTouchesPart(this.button, player => this.onButtonTouched(player)));
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
