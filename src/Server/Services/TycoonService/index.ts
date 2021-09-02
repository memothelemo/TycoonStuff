import { OnInit, Service } from "@flamework/core";
import Binder from "@rbxts/binder";
import Option, { IOption } from "@rbxts/option";
import { Players } from "@rbxts/services";
import Remotes from "Shared/Remotes";
import { getRandomArrayMember } from "Shared/Util/getRandomArrayMember";

import { TycoonModel } from "../../../../typings/tycoon";
import { Tycoon } from "./Tycoon";

@Service({})
export class TycoonService implements OnInit {
	private _backupModels = new Map<string, TycoonModel>();
	private _tycoons!: Binder<Tycoon>;

	public onInit(): void {
		this._tycoons = new Binder("Tycoon", Tycoon);
		this._tycoons.Start();

		// backing up all of the tycoon models, so that we can use it later
		for (const tycoon of this._tycoons.GetAll()) {
			const componentId = tycoon.getComponentId();
			const clonedInstance = tycoon.Instance.Clone();
			this._backupModels.set(componentId, clonedInstance);
			task.spawn((t: Tycoon) => t.init(), tycoon);
		}

		// when the player leaves the game, the tycoon must be cleaned up
		const playerRemoving = (player: Player): void => {
			this.getTycoonFromUserId(player.UserId).Match({
				Some: tycoon => {
					// respawning tycoon
					const componentId = tycoon.getComponentId();
					const parent = tycoon.Instance.Parent;
					tycoon.Instance.Destroy();

					const model = this._backupModels.get(componentId);
					assert(model, `${componentId} is not backed up!`);

					const newTycoonModel = model.Clone();
					newTycoonModel.Parent = parent;
					this._tycoons.Get(newTycoonModel)?.init();
				},
				None: () => {},
			});
		};

		Players.PlayerRemoving.Connect(playerRemoving);

		// responding player remotes
		const requestTycoonFunction = Remotes.Server.Create("RequestTycoon");
		requestTycoonFunction.SetCallback(player => {
			return (
				this.assignVacantTycoon(player)
					.then(() => print(`${player.Name} owned a tycoon now!`))
					.catch(e => warn(e))
					.awaitStatus()[0] === Promise.Status.Resolved
			);
		});
	}

	private getTycoonFromUserId(userId: number): IOption<Tycoon> {
		// eslint-disable-next-line prettier/prettier
		return Option.Wrap(this._tycoons
			.GetAll()
			.filter(tycoon =>
				tycoon
					.getOwnerId()
					.Contains(userId))[0]
		);
	}

	public assignVacantTycoon(player: Player): Promise<Tycoon> {
		// I wrote this twice because I accidentally
		// overwrite TycoonService and Tycoon for organization purposes
		return new Promise((resolve, reject) => {
			// check if there are vacant tycoons avaliable
			const vacantTycoons = this._tycoons.GetAll().filter(tycoon => tycoon.getOwner().IsNone());
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
