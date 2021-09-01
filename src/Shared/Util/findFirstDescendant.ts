/**
 * ROBLOX hasn't enabled FindFirstDescendant yet (probably)
 * I made by my own then
 *
 * It has a same functionality as FindFirstChild but it tries to find
 * the first descendant that matches the name passed from the argument
 */
export function findFirstDescendant(parent: Instance, name: string): Instance | undefined {
	for (const descendant of parent.GetDescendants()) {
		if (descendant.Name === name) {
			return descendant;
		}
	}
}
