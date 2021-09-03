/// <reference types="@rbxts/testez/globals" />

import { lerpNumber } from "Shared/Util/lerpNumber";

export = (): void => {
	it("should be equal to 0.5 from range of 0 -> 1 in an alpha of 0.5", () => {
		expect(lerpNumber(0, 1, 0.5)).to.equal(0.5);
	});

	it("should be equal to 40 from range of 50 -> 10 in an alpha of 0.25", () => {
		expect(lerpNumber(50, 10, 0.25)).to.equal(40);
	});
};
