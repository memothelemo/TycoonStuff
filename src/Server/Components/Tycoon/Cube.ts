import type { Tycoon } from "Server/Services/TycoonService/Tycoon";
import type { TycoonServerBaseComponent } from "../../../../typings/tycoon";

/** @hidden */
class Cube implements TycoonServerBaseComponent {
	public constructor(public instance: Model, public tycoon: Tycoon) {}

	public init(): void {}

	public onSpawn(): void {}

	public destroy(): void {}
}

export = Cube;
