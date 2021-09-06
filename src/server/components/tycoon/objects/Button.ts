import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { ServerBaseTycoonComponent } from "server/typings";
import { detectPlayerTouchesPart } from "shared/util/detectPlayerTouchesPart";

import { ButtonAttributes } from "../shared";
import ServerTycoon from "../tycoon";
import Unlockable from "./Unlockable";

class Button implements ServerBaseTycoonComponent<BasePart> {
	private janitor = new Janitor();
	private attributes: Attributes<ButtonAttributes>;

	private dependencyUnlockable!: Unlockable;
	private unlockableTarget!: Unlockable;

	instance: BasePart;

	constructor(instance: Instance, public tycoon: ServerTycoon) {
		assert(instance.IsA("BasePart"), "Every button requires 'BasePart' explicitly");
		this.instance = instance;
		this.attributes = new Attributes(this.instance);

		this.attributes.default({
			Price: 0,
			Visible: false,
		});

		this.attributes.expectMultiple({
			Price: "number",
			Dependency: ["string", "nil"],
			Target: "string",
		});

		this.setButtonVisibility(false);
	}

	private onButtonTouched(player: Player) {
		// reload unlockable target
		if (!this.unlockableTarget) {
			const target = this.attributes.get("Target");
			this.unlockableTarget = this.tryGetUnlockable(target, "Target");
		}

		if (this.tycoon.getOwner().Contains(player)) {
			this.setButtonVisibility(false);
			this.tycoon.unlock(this.unlockableTarget);
		}
	}

	private isDependencyTargetSpawned() {
		if (this.dependencyUnlockable) {
			return this.dependencyUnlockable.isSpawned();
		}
		return false;
	}

	private canListen() {
		return this.isDependencyTargetSpawned();
	}

	private listen() {
		this.setButtonVisibility(true);

		const connection = detectPlayerTouchesPart(this.instance, player => this.onButtonTouched(player));
		this.janitor.Add(connection);
	}

	private listenOnDependency() {
		// checking twice
		const result = this.updateButton();
		if (result) return;

		const dependency = this.attributes.get("Dependency");
		const connection = this.tycoon.onUnlockedComponent.Connect(spawned => {
			if (this.dependencyUnlockable === undefined) {
				this.dependencyUnlockable = this.tryGetUnlockable(dependency, "Dependency");
			}

			const dependencyName = this.dependencyUnlockable.instance.Name;
			if (dependencyName === spawned) {
				this.updateButton();
				connection.Disconnect();
			}
		});

		this.janitor.Add(connection);
	}

	private updateButton() {
		if (this.canListen()) {
			this.setButtonVisibility(true);
			this.listen();
			return true;
		}
		return false;
	}

	private tryGetUnlockable(name: string, typeImport: string) {
		try {
			return this.tycoon.getUnlockableFromName(name);
		} catch {
			throw `Invalid '${typeImport}' attribute: ${name} (not exists, not registered as Unlockable or duplicated name)`;
		}
	}

	setButtonVisibility(goal: boolean) {
		const float = goal ? 0 : 1;
		this.instance.Transparency = float;
		this.instance.CanCollide = goal;
	}

	init() {
		const dependency = this.attributes.get("Dependency");
		if (dependency !== undefined) {
			this.listenOnDependency();
		} else {
			this.listen();
		}
	}

	destroy() {
		this.janitor.Destroy();
	}
}

export = Button;
