import { ServerBaseTycoonComponent } from "server/typings";

import ServerTycoon from "../tycoon";

class Furnace implements ServerBaseTycoonComponent<Instance> {
	constructor(public instance: Instance, public tycoon: ServerTycoon) {}

	init() {}

	destroy() {}
}

export = Furnace;
