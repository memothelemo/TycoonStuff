import { ServerBaseTycoonComponent } from "server/typings";

import ServerTycoon from "../tycoon";

class Collector implements ServerBaseTycoonComponent<Instance> {
	constructor(public instance: Instance, public tycoon: ServerTycoon) {}

	init() {}

	destroy() {}
}

export = Collector;
