import { RunService } from "@rbxts/services";
import { TestBootstrap } from "@rbxts/testez";
import { $instance } from "rbxts-transformer-fs";

if (RunService.IsStudio() === true) {
	TestBootstrap.run([$instance<Folder>("src/Shared/Specs")]);
}
