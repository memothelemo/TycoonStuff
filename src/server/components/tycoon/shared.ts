export const UNLOCKABLE_TAG = "Unlockable";

export interface ButtonAttributes {
	Price: number;
	Dependency: string;
	Target: string;
	Visible: boolean;
}

export function throwErrorFromInstance(model: Instance, message: string): never {
	throw `[${model.GetFullName()}]: ${message}`;
}

export function throwInvalidStructureMsg(instance: Instance, tag: string) {
	throw `${instance.GetFullName()} has '${tag}' but don't follow the required structure tree!`;
}
