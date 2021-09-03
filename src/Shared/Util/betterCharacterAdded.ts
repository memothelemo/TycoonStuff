function waitForFirst(signals: RBXScriptSignal[]): LuaTuple<unknown[]> {
	const shunt = new Instance("BindableEvent");
	const connected = new Array<RBXScriptConnection>();

	const fire = (...args: unknown[]): void => {
		connected.forEach(connection => {
			connection.Disconnect();
		});

		return shunt.Fire(...args);
	};

	signals.forEach(signal => {
		connected.push(signal.Connect(fire));
	});

	return shunt.Event.Wait();
}

function isPlayerRespawned(player: Player, character: Model): boolean {
	return player.Character !== character || !character.Parent;
}

/**
 * `betterCharacterAdded` is a function where it captures the character spawning
 *
 * It solves the problem of `player.CharacterAdded`
 */
export function betterCharacterAdded(
	player: Player,
	callback: (character: Model, rootPart: BasePart, humanoid: Humanoid) => void,
): RBXScriptConnection {
	const onCharacterAdded = (character: Model): void => {
		// Make sure that character is parented, stop execution if the character has respawned again in the meantime
		if (!character.Parent) {
			waitForFirst([character.AncestryChanged, player.CharacterAdded]);
		}

		if (isPlayerRespawned(player, character)) {
			return;
		}

		// Make sure that the humanoid is parented, stop execution if the character has respawned again in the meantime
		let humanoid = character.FindFirstChildOfClass("Humanoid");
		while (character.IsDescendantOf(game) && !humanoid) {
			waitForFirst([character.ChildAdded, character.AncestryChanged]);
			humanoid = character.FindFirstChildOfClass("Humanoid");
		}

		if (isPlayerRespawned(player, character)) {
			return;
		}

		// Make sure that the root part is parented, stop execution if the character has respawned again in the meantime
		let rootPart = character.FindFirstChild("HumanoidRootPart");
		while (character.IsDescendantOf(game) && !humanoid) {
			waitForFirst([character.ChildAdded, character.AncestryChanged]);
			rootPart = character.FindFirstChild("HumanoidRootPart");
		}

		if (rootPart && humanoid && !isPlayerRespawned(player, character)) {
			callback(character, rootPart as BasePart, humanoid);
		}
	};

	const conn = player.CharacterAdded.Connect(onCharacterAdded);
	if (player.Character !== undefined) {
		task.spawn(onCharacterAdded, player.Character);
	}

	return conn;
}
