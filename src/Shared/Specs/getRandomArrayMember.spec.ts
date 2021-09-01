/// <reference types="@rbxts/testez/globals" />

import { getRandomArrayMember } from "Shared/Util/getRandomArrayMember";

export = (): void => {
	it("should get a random member of an array", () => {
		const list = new Array<string>();
		list.push("wow");

		expect(getRandomArrayMember(list)).to.equal("wow");
	});

	it("should throw an error if an array is empty", () => {
		expect(() => {
			getRandomArrayMember([]);
		}).to.throw();
	});
};
