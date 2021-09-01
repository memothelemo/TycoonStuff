import Net from "@rbxts/net";

const Remotes = Net.Definitions.Create({
	RequestTycoon: Net.Definitions.ServerAsyncFunction<() => boolean>(),
});

export default Remotes;
