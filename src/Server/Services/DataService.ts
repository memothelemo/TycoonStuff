import { OnInit, Service } from "@flamework/core";
import Option, { IOption } from "@rbxts/option";
import { GetProfileStore } from "@rbxts/profileservice";
import { Profile } from "@rbxts/profileservice/globals";
import { Players } from "@rbxts/services";
import Signal from "@rbxts/signal";

export interface PlayerData {
	cash: number;
}

const Profiles = new Map<Player, Profile<PlayerData>>();
const ProfileStore = GetProfileStore<PlayerData>("PlayerData", {
	cash: 0,
});

@Service({
	// this guy will load first
	loadOrder: 0,
})
export class DataService implements OnInit {
	public playerAdded = new Signal<(player: Player, profile: Profile<PlayerData>) => void>();
	public playerRemoving = new Signal<(player: Player) => void>();

	public onInit(): void {
		Players.PlayerAdded.Connect(player => this._playerAdded(player));
		Players.PlayerRemoving.Connect(player => this._playerRemoving(player));

		// load profile (players who joined before flamework ignites)
		for (const player of Players.GetPlayers()) {
			if (!Profiles.has(player)) {
				task.spawn<[Player]>(player => this._playerAdded(player), player);
			}
		}
	}

	public waitForPlayer(player: Player, timeout?: number): Promise<Profile<PlayerData>> {
		return new Promise((resolve, reject, onCancelled) => {
			let isCancelled = false;
			let connection: RBXScriptConnection;

			onCancelled(() => (isCancelled = true));

			if (timeout !== undefined) {
				Promise.delay(timeout).then(() => {
					if (!isCancelled) return;
					reject(`Failed to load ${player.Name}'s profile (Timed out)`);
				});
			}

			connection = this.playerAdded.Connect((recivingPlayer, profile) => {
				if (isCancelled) return;
				if (recivingPlayer !== player) return;
				connection.Disconnect();
				resolve(profile);
			});
		});
	}

	public getFromPlayer(player: Player): IOption<Profile<PlayerData>> {
		return Option.Wrap(Profiles.get(player)!);
	}

	private _playerAdded(player: Player): void {
		const profile = ProfileStore.LoadProfileAsync(`player_${player.UserId}`);

		// The profile couldn't load possibly due to the ROBLOX data issues
		if (profile === undefined) {
			return player.Kick(`There's something wrong with your data, please rejoin.`);
		}

		// GDPR compliance
		profile.AddUserId(player.UserId);

		// TODO: Migration module :D
		profile.Reconcile();

		// Session locking detection
		profile.ListenToRelease(() => {
			Profiles.delete(player);
			player.Kick(`Your data could have been loaded to other ROBLOX server, please rejoin.`);
		});

		// Player left before the profile loaded
		if (!player.IsDescendantOf(Players)) {
			return profile.Release();
		}

		Profiles.set(player, profile);
		this.playerAdded.Fire(player, profile);
	}

	private _playerRemoving(player: Player): void {
		// easy as pi
		const profile = Profiles.get(player);
		if (profile !== undefined) {
			profile.Release();
			this.playerRemoving.Fire(player);
		}
	}
}
