/// <reference types="@rbxts/testez/globals" />

import { findFirstDescendant } from "Shared/Util/findFirstDescendant";

export = (): void => {
	it("should find a descendant", () => {
		const prototypeTree = new Instance("Folder");
		const smoke = new Instance("Smoke");
		smoke.Parent = prototypeTree;
		smoke.Name = "Smoke";

		expect(typeOf(findFirstDescendant(prototypeTree, "Smoke"))).to.be.equal("Instance");
	});
};
