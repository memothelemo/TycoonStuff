import { Players } from "@rbxts/services";

export function detectPlayerTouchesPart(part: BasePart, callback: (player: Player) => void) {
	const connection = part.Touched.Connect(hit => {
		const player = Players.GetPlayerFromCharacter(hit.Parent);
		if (player) {
			callback(player);
		}
	});

	return connection;
}
