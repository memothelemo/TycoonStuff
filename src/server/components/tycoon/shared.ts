import { t } from "@rbxts/t";
import { $instance } from "rbxts-transformer-fs";

import ServerBaseOre from "./ores/BaseOre";

const oreModuleStorage = $instance<Folder>("src/server/components/tycoon/ores");

export const UNLOCKABLE_TAG = "Unlockable";

export interface DropperAttributes {
	Rate: number;
	Worth: number;
	Type: keyof ServerOres;
}

export interface ButtonAttributes {
	Price: number;
	Dependency: string;
	Target: string;
}

export function requireOreTypeClass<T extends keyof ServerOres>(typeName: T): ServerOres[T];
export function requireOreTypeClass(typeName: string): ServerBaseOre;
export function requireOreTypeClass(typeName: string): ServerBaseOre {
	const module = oreModuleStorage.FindFirstChild(typeName, true);
	if (module === undefined || !module.IsA("ModuleScript")) {
		error(`Unknown or invalid ore module: ${typeName}`, 2);
	}
	const oreTypeClass = require(module);
	assert(
		t.interface({
			constructor: t.function,
			dressOre: t.function,
			destroy: t.function,
		})(oreTypeClass),
		`Invalid ore module type: ${typeName}`,
	);
	return oreTypeClass as unknown as ServerBaseOre;
}

export function throwErrorFromInstance(model: Instance, message: string): never {
	throw `[${model.GetFullName()}]: ${message}`;
}

export function throwInvalidStructureMsg(instance: Instance, tag: string) {
	throw `${instance.GetFullName()} has '${tag}' but don't follow the required structure tree!`;
}
