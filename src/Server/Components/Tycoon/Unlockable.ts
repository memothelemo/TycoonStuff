import { Janitor } from "@rbxts/janitor";
import { validateTree } from "@rbxts/validate-tree";
import { getPlayerFromCharacter } from "Shared/Util/getPlayerFromCharacter";
import { TycoonServerBaseComponent } from "../../../../typings/tycoon";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";
import Attributes from "@memolemo-studios/rbxts-attributes";
import { validateWithMessage } from "@rbxts/attributes-validate";

declare global {
	interface ServerTycoonComponents {
		Unlockable: Unlockable;
	}
}

interface UnlockableAttributes {
	Price: number;
}

interface UnlockableModel extends Model {
	Button: Part;
}

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

		// validating attributes
		const [validated, reason] = validateWithMessage(instance, {
			Price: "number",
		});
		assert(validated, `From: ${instance.GetFullName()} | ${reason}`);
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

	public setDebounce(bool: boolean): void {
		this._debounce = bool;
	}

	/** It is not practical but it is ok */
	public getPrice(): number {
		return this._attributes.get("Price");
	}

	public init(): void {
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

	public onSpawn(): void {
		this.destroy();
	}

	public destroy(): void {
		this._janitor.Destroy();
	}
}

export = Unlockable;
