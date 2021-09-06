import { ServerBaseTycoonComponent } from "server/typings";

import ServerTycoon from "../../tycoon";

class BaseConveyor implements ServerBaseTycoonComponent<Instance> {
	constructor(public instance: Instance, public tycoon: ServerTycoon) {}

	init() {}

	destroy() {}
}

export = BaseConveyor;
