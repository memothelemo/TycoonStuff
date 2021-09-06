import { t } from "@rbxts/t";

export const TycoonModel = t.intersection(
	t.children({
		Components: t.instanceIsA("Folder"),
		Ores: t.instanceIsA("Folder"),
		Spawn: t.instanceIsA("SpawnLocation"),
	}),
	t.instanceIsA("Model"),
);

export type TycoonModel = t.static<typeof TycoonModel>;
