import { Controller, OnStart } from "@flamework/core";
import { makeHello } from "Shared/module";

@Controller({})
export class TestController implements OnStart {
	public onStart() {
		print(makeHello("roblox-ts and Flamework!"));
	}
}
