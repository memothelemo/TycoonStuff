const rng = new Random();

/**
 * Gets a random member of an array
 *
 * **NOTE:**
 * - This function throws out if an array has no members
 */
export function getRandomArrayMember<T extends unknown>(array: T[]): T {
	assert(array.size() > 0, `Empty members are not allowed!`);

	const randomId = rng.NextInteger(0, array.size() - 1);
	return array[randomId];
}
