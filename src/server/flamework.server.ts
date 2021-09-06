import { Flamework } from "@flamework/core";

Flamework.addPaths("src/server/services");

// world components can have flamework's component system
// while tycoon components will have binder in it (it has greater control)
Flamework.addPaths("src/server/components/world");

Flamework.ignite();
