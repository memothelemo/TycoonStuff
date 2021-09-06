import { t } from "@rbxts/t";

import ServerTycoon from "./components/tycoon/tycoon";

declare global {
	interface ServerTycoonComponents {}
}

/** Base blueprint component for all server tycoon components */
export interface ServerBaseTycoonComponent<T extends Instance = Instance> {
	tycoon: ServerTycoon;
	instance: T;

	init(): void;
	destroy(): void;
}

/** Typechecker for `ServerBaseTycoonComponent` */
export const checkTycoonBaseComponentClass: t.check<Constructor<ServerBaseTycoonComponent>> = t.interface({
	new: t.function,
	init: t.function,
	destroy: t.function,
}) as unknown as t.check<Constructor<ServerBaseTycoonComponent>>;
