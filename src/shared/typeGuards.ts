import { t } from "@rbxts/t";

// This is going to be a temporary place until alihsaas
// added support for Instance interface typechecking
export const TycoonModel = t.intersection(
	t.children({
		Components: t.instanceIsA("Folder"),
		Ores: t.instanceIsA("Folder"),
		Spawn: t.instanceIsA("SpawnLocation"),
	}),
	t.instanceIsA("Model"),
);

export type TycoonModel = t.static<typeof TycoonModel>;
