import { OnInit, Service } from "@flamework/core";
import Binder from "@rbxts/binder";
import Option, { IOption } from "@rbxts/option";
import ServerTycoon from "server/components/tycoon/tycoon";
import Remotes from "shared/remotes";
import { TycoonModel } from "shared/typeGuards";
import { getRandomArrayMember } from "shared/util/getRandomArrayMember";

const copyTycoonModelsById = new Map<string, TycoonModel>();

const tycoonBinder = new Binder("Tycoon", ServerTycoon);
tycoonBinder.Start();

// backing up tycoons
for (const tycoon of tycoonBinder.GetAll()) {
	const componentId = tycoon.getComponentId();
	copyTycoonModelsById.set(componentId, tycoon.instance.Clone());
}

@Service({})
export class TycoonService implements OnInit {
	private requestTycoonMirror = Remotes.Server.Create("RequestTycoon");

	private getVacantTycoon() {
		// get all vacant tycoons
		const vacantTycoons = tycoonBinder.GetAll().filter(tycoon => !tycoon.hasOwner());

		// if vacant tycoons are empty, then the option result will be none
		if (vacantTycoons.size() === 0) {
			return Option.None as unknown as IOption<ServerTycoon>;
		}

		return Option.Wrap(getRandomArrayMember(vacantTycoons));
	}

	requestTycoon(player: Player): [true] | [false, string] {
		return this.getVacantTycoon().Match({
			Some: tycoon => {
				const [success, reason] = tycoon.assignOwner(player).catch(warn).await();
				// it is a promise error, do not reveal it!
				if (typeIs(reason, "table")) {
					return [false, "Unexpected error"];
				}
				return success ? [true] : [false, tostring(reason)];
			},
			None: () => {
				return [false, "There are no vacant tycoons available"];
			},
		});
	}

	getTycoonFromPlayer(player: Player) {
		// eslint-disable-next-line prettier/prettier
		return Option.Wrap(tycoonBinder
			.GetAll()
			.filter(tycoon =>
				tycoon
					.getOwner()
					.Contains(player)
			)[0]
		);
	}

	hasTycoonFromPlayer(player: Player) {
		return this.getTycoonFromPlayer(player).IsSome();
	}

	// flamework
	onInit() {
		// initializing tycoons on a separate thread
		for (const tycoon of tycoonBinder.GetAll()) {
			task.spawn(() => tycoon.init());
		}

		this.requestTycoonMirror.SetCallback(player => {
			const [success, reason] = this.requestTycoon(player);
			if (success) {
				// spawn that character
				player.LoadCharacter();
			}
			return [success, reason] as [true] | [false, string];
		});
	}
}
