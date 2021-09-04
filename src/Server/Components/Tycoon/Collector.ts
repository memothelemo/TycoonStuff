import { Janitor } from "@rbxts/janitor";
import { validateTree } from "@rbxts/validate-tree";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";
import { getPlayerFromCharacter } from "Shared/Util/getPlayerFromCharacter";

import type { TycoonServerBaseComponent } from "../../../../typings/tycoon";

interface CollectorModel extends Model {
	Screen: Part & {
		SurfaceGui: SurfaceGui & {
			Amount: TextLabel;
		};
	};
	Giver: Part;
}

const BUSY_COLOR = Color3.fromRGB(214, 41, 41);
const ACTIVE_COLOR = Color3.fromRGB(107, 214, 82);

const TEXT_FORMATTER = (cash: number): string => `$${cash}`;
const DEBOUNCE_TIMEOUT = 0.5;

const validateCollectorModel = (instance: Instance): instance is CollectorModel =>
	validateTree(instance, {
		$className: "Model",
		Screen: {
			$className: "Part",
			SurfaceGui: {
				$className: "SurfaceGui",
				Amount: "TextLabel",
			},
		},
		Giver: "Part",
	});

/** @hidden */
class Collector implements TycoonServerBaseComponent {
	private _realInstance: CollectorModel;

	private _debounce = true;
	private _janitor = new Janitor();

	public constructor(public instance: Model, public tycoon: Tycoon) {
		assert(validateCollectorModel(instance), `${instance.GetFullName()} has invalid Collector structure tree`);

		this._realInstance = instance;
	}

	private _updateDebounce(): void {
		const currentColor = this._debounce ? ACTIVE_COLOR : BUSY_COLOR;
		this._realInstance.Giver.Color = currentColor;
	}

	private _setDebounce(bool: boolean): void {
		this._debounce = bool;
		this._updateDebounce();
	}

	private _onTouched(hit: BasePart): void {
		if (!this._debounce) return;

		getPlayerFromCharacter(hit.Parent).Match({
			Some: player => {
				if (!this.tycoon.getOwner().Contains(player)) return;
				this._setDebounce(false);

				this.tycoon
					.collectCollectedCash()
					.then(() => this._update())
					.catch(e => warn(e))
					.finally(() => Promise.delay(DEBOUNCE_TIMEOUT))
					.then(() => this._setDebounce(true));
			},
			None: () => {},
		});
	}

	private _update(): void {
		// easy as it is
		this._realInstance.Screen.SurfaceGui.Amount.Text = TEXT_FORMATTER(this.tycoon.getCollectedCash());
	}

	public init(): void {
		this._update();
		this._updateDebounce();

		this._janitor.Add(this.tycoon.collectedCash.Connect(() => this._update()));
		this._janitor.Add(this._realInstance.Giver.Touched.Connect(hit => this._onTouched(hit)));
	}

	public destroy(): void {}
}

export = Collector;
