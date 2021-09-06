export function throwErrorFromInstance(model: Instance, message: string): never {
	throw `[${model.GetFullName()}]: ${message}`;
}

export function throwInvalidStructureMsg(instance: Instance, tag: string) {
	throw `${instance.GetFullName()} has '${tag}' but don't follow the required structure tree!`;
}
