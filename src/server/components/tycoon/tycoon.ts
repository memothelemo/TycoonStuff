import Attributes from "@memolemo-studios/rbxts-attributes";
import { BinderClass } from "@rbxts/binder";
import { TycoonModel } from "shared/typeGuards";

import type { TycoonAttributes } from "../../../../typings/tycoon";

function assertTycoonModel(object: Instance): asserts object is TycoonModel {
	if (!TycoonModel(object)) {
		error(
			`${object.GetFullName()} has 'Tycoon' tag but don't follow the required structure tree!`,
		);
	}
}

export default class ServerTycoon implements BinderClass {
	private attributes: Attributes<TycoonAttributes>;

	instance: TycoonModel;

	// binder requires exact parameters like this
	constructor(instance: Instance) {
		// every tycoon must met its required structure tree
		assertTycoonModel(instance);

		this.instance = instance;
		this.attributes = new Attributes(instance);
	}

	// binder requires this method
	Destroy() {}
}
