import { OnStart, Service } from "@flamework/core";
import { makeHello } from "Shared/module";

@Service({})
export class TestService implements OnStart {
	public onStart() {
		print(makeHello("roblox-ts and Flamework!"));
	}
}
