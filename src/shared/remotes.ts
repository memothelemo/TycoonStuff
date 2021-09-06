import Net from "@rbxts/net";

// shortcut for Net.Definitions
const define = Net.Definitions;

/** Available remotes for the game */
const Remotes = define.Create({
	RequestTycoon: define.ServerAsyncFunction<() => boolean>(),
});

export default Remotes;