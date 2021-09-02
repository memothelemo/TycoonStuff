import { Janitor } from "@rbxts/janitor";
import { validateTree } from "@rbxts/validate-tree";
import { getPlayerFromCharacter } from "Shared/Util/getPlayerFromCharacter";
import { TycoonServerBaseComponent } from "../../../../typings/tycoon";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";
import Attributes from "@memolemo-studios/rbxts-attributes";
import { Workspace } from "@rbxts/services";

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
		const button = (this.instance as UnlockableModel).Button;

		// assigning button to the tycoon instance?
		button.Parent = this.tycoon.Instance.Components;
		this._janitor.Add(button);

		// subscribing button touched evento
		// eslint-disable-next-line prettier/prettier
		this._janitor.Add(button
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
		this._janitor.Destroy();
	}
}

export = Unlockable;
