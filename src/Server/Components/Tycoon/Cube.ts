import { Janitor } from "@rbxts/janitor";
import { RunService } from "@rbxts/services";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";
import type { TycoonServerBaseComponent } from "../../../../typings/tycoon";

/** @hidden */
class Cube implements TycoonServerBaseComponent {
	private _janitor = new Janitor();

	public constructor(public instance: Model, public tycoon: Tycoon) {}

	public init(): void {
		this._janitor.Add(
			RunService.Heartbeat.Connect(() => {
				this.instance.PrimaryPart!.BrickColor = BrickColor.random();
			}),
		);
	}

	public destroy(): void {
		this._janitor.Destroy();
	}
}

export = Cube;
