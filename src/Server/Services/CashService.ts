import { Dependency, OnStart, Service } from "@flamework/core";
import Option, { IOption } from "@rbxts/option";
import { DataService as DataServiceType } from "./DataService";

let DataService: DataServiceType;

@Service({})
export class CashService implements OnStart {
	public incrementFromPlayer(player: Player, change = 1): Promise<void> {
		return new Promise((resolve, reject) => {
			DataService.getFromPlayer(player).Match({
				Some: profile => {
					profile.Data.cash -= change;
					resolve();
				},
				None: () => reject(`${player.Name}'s cash is not loaded`),
			});
		});
	}

	public setFromPlayer(player: Player, amount: number): Promise<void> {
		return new Promise((resolve, reject) => {
			DataService.getFromPlayer(player).Match({
				Some: profile => {
					profile.Data.cash = amount;
					resolve();
				},
				None: () => reject(`${player.Name}'s cash is not loaded`),
			});
		});
	}

	public getFromPlayer(player: Player): IOption<number> {
		return DataService.getFromPlayer(player).AndThen(profile => {
			return Option.Some(profile.Data.cash);
		});
	}

	public onStart(): void {
		DataService = Dependency<DataServiceType>();
	}
}
