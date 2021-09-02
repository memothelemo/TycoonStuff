import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { RunService, Workspace } from "@rbxts/services";
import { validateTree } from "@rbxts/validate-tree";
import { TARGET_ANIMATION_TIME } from "Server/Constants/animation";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";
import { getPlayerFromCharacter } from "Shared/Util/getPlayerFromCharacter";
import { lerpNumber } from "Shared/Util/lerpNumber";

import Spring from "../../../../rbxlua/Spring";
import { TycoonServerBaseComponent } from "../../../../typings/tycoon";

declare global {
	interface ServerTycoonComponents {
		Unlockable: Unlockable;
	}
}

interface UnlockableAttributes {
	Price: number;
	Dependency: string;
}

interface UnlockableModel extends Model {
	Button: Part;
}

const invalidateAttrib = (
	model: Instance,
	attributeName: string,
	expectedTypeOf: string,
	currentTypeOf: string,
): string =>
	`From: ${model.GetFullName()} | Expected ${expectedTypeOf} (got ${currentTypeOf}) in ${attributeName} attribute`;

const validateUnlockableModel = (instance: Model): boolean =>
	validateTree(instance, {
		$className: "Model",
		Button: "Part",
	});

/** @hidden */
class Unlockable implements TycoonServerBaseComponent {
	private _janitor = new Janitor();
	private _attributes: Attributes<UnlockableAttributes>;

	private _button!: Part;
	private _debounce = true;

	public constructor(public instance: Model, public tycoon: Tycoon) {
		// validating model tree
		assert(validateUnlockableModel(instance), "Be sure to have a button on it!");

		this._attributes = new Attributes(this.instance);

		// attributes on default
		const priceTypeof = typeOf(this._attributes.get("Price"));
		if (priceTypeof === "nil") {
			this._attributes.set("Price", 0);
		} else {
			assert(priceTypeof === "number", invalidateAttrib(instance, "Price", "number", priceTypeof));
		}

		const depTypeof = typeOf(this._attributes.get("Dependency"));
		assert(
			depTypeof === "string" || depTypeof === "nil",
			invalidateAttrib(instance, "Dependency", "nil or string", depTypeof),
		);
	}

	public setButtonVisibility(bool: boolean): void {
		const goal = bool ? 0 : 1;
		const base = bool ? 1 : 0;

		if (this._button) {
			if (this._button.Transparency === goal) {
				return;
			}
		}

		const spring = new Spring<number>(base);
		spring.SetDamper(1).SetSpeed(9).SetTarget(goal);

		let timer = 0;
		let connection: RBXScriptConnection;

		connection = RunService.Heartbeat.Connect(dt => {
			timer += dt;
			if (timer >= TARGET_ANIMATION_TIME || this._button === undefined) {
				return connection.Disconnect();
			}

			const position = spring.GetPosition();
			this._button.Transparency = lerpNumber(base, goal, position);
		});

		if (this._button !== undefined) {
			this._button.Transparency = goal;
			this._button.CanCollide = bool;
		}
	}

	private onButtonTouched(hit: Instance): void {
		if (!this._debounce) return;
		this._debounce = false;

		getPlayerFromCharacter(hit.Parent).Match({
			Some: player => {
				if (!this.tycoon.getOwner().Contains(player)) return;
				this.tycoon.unlock(this);
			},
			None: () => {},
		});
	}

	private listenButtonTouches(): void {
		// assigning button to the tycoon instance?
		this.setButtonVisibility(true);
		this._button.Parent = this.tycoon.Instance.Components;
		this._janitor.Add(this._button);

		// subscribing button touched evento
		// eslint-disable-next-line prettier/prettier
		this._janitor.Add(this._button
			.Touched
			.Connect(hit => this.onButtonTouched(hit))
		);
	}

	private canListen(): boolean {
		const dependency = this._attributes.get("Dependency");
		assert(dependency !== undefined, "Expected 'Dependency' attribute");

		const dependentUnlockable = this.tycoon.getUnlockableComponentFromName(dependency);
		if (dependentUnlockable) {
			return dependentUnlockable.isSpawned();
		}
		return false;
	}

	private updateOnSpawn(): boolean {
		if (this.canListen()) {
			this.listenButtonTouches();
			return true;
		}
		return false;
	}

	public setDebounce(bool: boolean): void {
		this._debounce = bool;
	}

	/** It is not practical but it is ok */
	public getPrice(): number {
		return this._attributes.get("Price");
	}

	public isSpawned(): boolean {
		return this.instance.IsDescendantOf(Workspace);
	}

	public init(): void {
		this._button = (this.instance as UnlockableModel).Button;

		// run if it has no dependents
		if (!this._attributes.has("Dependency")) {
			return this.listenButtonTouches();
		}

		// update in advance
		this.updateOnSpawn();

		let connection: RBXScriptConnection;
		connection = this.tycoon.objectUnlocked.Connect(() => {
			if (this.updateOnSpawn()) {
				connection.Disconnect();
			}
		});
	}

	public onSpawn(): void {
		this.destroy();
	}

	public destroy(): void {
		if (this._janitor["Destroy"] !== undefined) {
			this._janitor.Destroy();
		}
	}
}

export = Unlockable;
