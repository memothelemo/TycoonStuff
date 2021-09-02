const HALF_PI = math.pi * 0.5;

/**
 * Get a real volume based on the CFrame argument and size provided
 *
 * _Taken (and ported) from locard's PlacementModule in Miner's Haven (open source version) under [Apache 2.0 license](https://github.com/berezaa/minershaven/blob/master/LICENSE)_
 * @param cframe
 * @param size
 */
export function getMaxExtentsWorldSpace(cframe: CFrame, size: Vector3): Vector3 {
	const lookVector = cframe.LookVector;
	const theta = -math.atan(lookVector.Z / lookVector.X) + HALF_PI;
	let maxVolume: Vector3;

	if (theta > math.pi * 0.5) {
		maxVolume = new Vector3(
			size.Z * math.cos(theta - HALF_PI) * size.X * math.sin(theta - HALF_PI),
			0,
			size.Z * math.sin(theta - HALF_PI) * size.X * math.cos(theta - HALF_PI),
		);
	} else {
		maxVolume = new Vector3(
			size.X * math.cos(theta) + size.Z * math.sin(theta),
			0,
			size.Z * math.sin(theta) + size.X * math.cos(theta),
		);
	}

	return maxVolume;
}
