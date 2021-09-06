import { OnInit, Service } from "@flamework/core";
import Binder from "@rbxts/binder";
import Option from "@rbxts/option";
import ServerTycoon from "server/components/tycoon/tycoon";
import Remotes from "shared/remotes";

const tycoonBinder = new Binder("Tycoon", ServerTycoon);
tycoonBinder.Start();

@Service({})
export class TycoonService implements OnInit {
	private requestTycoonMirror = Remotes.Server.Create("RequestTycoon");

	requestTycoon(player: Player) {
		return true;
	}

	getTycoonFromPlayer(player: Player) {
		return Option.Wrap(tycoonBinder.GetAll().filter(tycoon => tycoon.getOwner().Contains(player))[0]);
	}

	hasTycoonFromPlayer(player: Player) {
		return this.getTycoonFromPlayer(player).IsSome();
	}

	onInit() {
		this.requestTycoonMirror.SetCallback(player => {
			return this.requestTycoon(player);
		});
	}
}
