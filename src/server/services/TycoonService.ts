import { OnInit, Service } from "@flamework/core";
import Remotes from "shared/remotes";

@Service({})
export class TycoonService implements OnInit {
	private requestTycoonMirror = Remotes.Server.Create("RequestTycoon");

	requestTycoon(player: Player) {
		return true;
	}

	getTycoonFromPlayer(player: Player) {}

	onInit() {
		this.requestTycoonMirror.SetCallback(player => {
			return this.requestTycoon(player);
		});
	}
}
