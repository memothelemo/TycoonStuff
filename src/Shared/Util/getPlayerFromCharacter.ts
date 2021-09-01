import Option, { IOption } from "@rbxts/option";
import { Players } from "@rbxts/services";

export function getPlayerFromCharacter(character: Instance | undefined): IOption<Player> {
	return Option.Wrap(Players.GetPlayerFromCharacter(character)!);
}
