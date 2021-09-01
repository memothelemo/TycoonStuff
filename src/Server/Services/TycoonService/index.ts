import { OnInit, Service } from "@flamework/core";
import Binder from "@rbxts/binder";
import Option, { IOption } from "@rbxts/option";
import Remotes from "Shared/Remotes";
import { getRandomArrayMember } from "Shared/Util/getRandomArrayMember";
import { Tycoon } from "./Tycoon";

@Service({})
export class TycoonService implements OnInit {
	private _tycoons!: Binder<Tycoon>;

	public onInit(): void {
		this._tycoons = new Binder("Tycoon", Tycoon);
		this._tycoons.Start();

		// responding player remotes
		const requestTycoonFunction = Remotes.Server.Create("RequestTycoon");
		requestTycoonFunction.SetCallback(player => {
			return this.assignVacantTycoon(player)
				.then(() => print(`${player.Name} owned a tycoon now!`))
				.catch(e => warn(e))
				.await()[0];
		});
	}

	public assignVacantTycoon(player: Player): Promise<Tycoon> {
		// I wrote this twice because I accidentally
		// overwrite TycoonService and Tycoon for organization purposes
		return new Promise((resolve, reject) => {
			// check if there are vacant tycoons avaliable
			const vacantTycoons = this._tycoons.GetAll();
			if (vacantTycoons.size() <= 0) {
				return reject(`There are no vacant tycoons left to assign the player!`);
			}

			// generate a random Tycoon from a random array member
			const randomTycoon = getRandomArrayMember(vacantTycoons);

			// there are some cases the server glitched up
			// so I will do some promise tricks
			randomTycoon
				.assignOwner(player)
				.then(() => resolve(randomTycoon))
				.catch(reason => reject(reason));
		});
	}

	public getTycoonFromPlayer(player: Player): IOption<Tycoon> {
		// fancy roblox-ts inspired demo code style
		// eslint-disable-next-line prettier/prettier
		return Option.Wrap(this._tycoons
			.GetAll()
			.filter(tycoon =>
				tycoon
					.getOwner()
					.Contains(player))[0]
		);
	}
}
