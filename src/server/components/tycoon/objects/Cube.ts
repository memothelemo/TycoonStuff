import { ServerBaseTycoonComponent } from "server/typings";

import ServerTycoon from "../tycoon";

class Cube implements ServerBaseTycoonComponent<Instance> {
	constructor(public instance: Instance, public tycoon: ServerTycoon) {}

	init() {}

	destroy() {}
}

export = Cube;
