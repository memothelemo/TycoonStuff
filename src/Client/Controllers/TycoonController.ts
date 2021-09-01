import { Controller, OnStart } from "@flamework/core";
import Remotes from "Shared/Remotes";

@Controller({})
export class TycoonController implements OnStart {
	onStart(): void {
		// requesting tycoon
		Remotes.Client.Get("RequestTycoon")
			.CallServerAsync()
			.then(e => {
				if (e) {
					return warn("success");
				}
				warn("failed");
			})
			.catch(warn);
	}
}
