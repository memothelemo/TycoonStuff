import { Janitor } from "@rbxts/janitor";
import { validateTree } from "@rbxts/validate-tree";
import { getPlayerFromCharacter } from "Shared/Util/getPlayerFromCharacter";
import { TycoonServerBaseComponent } from "../../../../typings/tycoon";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

declare global {
	interface ServerTycoonComponents {
		Unlockable: Unlockable;
	}
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

	public constructor(public instance: Model, public tycoon: Tycoon) {
		assert(validateUnlockableModel(instance), "Be sure to have a button on it!");
	}

	private onButtonTouched(hit: Instance): void {
		getPlayerFromCharacter(hit.Parent).Match({
			Some: player => {
				if (!this.tycoon.getOwner().Contains(player)) return;
				this.tycoon.unlock(this);
			},
			None: () => {},
		});
	}

	public init(): void {
		// subscribing buton touched evento
		// eslint-disable-next-line prettier/prettier
		this._janitor.Add((this.instance as UnlockableModel).Button
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
