/**
 * Lerps number, that's all
 *
 * Same functionality and parameters as other scalar vectors
 * like Vector3 or UDim2
 */
export function lerpNumber(start: number, goal: number, alpha: number): number {
	return start + (goal - start) * alpha;
}
