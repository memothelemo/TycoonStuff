import { Dependency, OnStart, Service } from "@flamework/core";
import Option, { IOption } from "@rbxts/option";

import { DataService as DataServiceType } from "./DataService";

let DataService: DataServiceType;

@Service({})
export class CashService implements OnStart {
	public spendFromPlayer(player: Player, price: number): Promise<void> {
		return new Promise((resolve, reject) => {
			DataService.getFromPlayer(player).Match({
				Some: profile => {
					const cash = profile.Data.cash;
					if (cash === undefined) {
						return reject(`Unknown cash!`);
					}
					if (cash >= price) {
						profile.Data.cash -= price;
						return resolve();
					}
					reject(`Cannot afford!`);
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
