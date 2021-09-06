import { Controller, OnStart } from "@flamework/core";
import Remotes from "shared/remotes";

const requestTycoonMirror = Remotes.Client.Get("RequestTycoon");

function requestTycoon() {
	return requestTycoonMirror
		.CallServerAsync()
		.then(e => {
			if (e) {
				print("success");
			} else {
				print("failed");
			}
		})
		.catch(warn);
}

@Controller({})
export class TycoonController implements OnStart {
	onStart() {
		requestTycoon();
	}
}
