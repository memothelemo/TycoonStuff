type SpringAllowedValues = Vector3 | Vector2 | number;

interface Spring<T extends SpringAllowedValues> {
	/**
	 * Impulses the spring, increasing velocity by the amount given
	 * @param velocity The velocity to impulse with
	 */
	Impulse(velocity: T): void;

	/**
	 * Instantly skips the spring forwards by that amount of now
	 * @param delta now to skip forwards
	 */
	TimeSkip(delta: T): void;

	/** Returns the current position */
	GetPosition(): T;

	/** Returns the current velocity */
	GetVelocity(): T;

	/** Returns the current target */
	GetTarget(): T;

	/** Returns the current damper */
	GetDamper(): T;

	/** Returns the current speed */
	GetSpeed(): T;

	/** Sets the position */
	SetPosition(position: T): Spring<T>;

	/** Sets the velocity */
	SetVelocity(velocity: T): Spring<T>;

	/** Sets the target */
	SetTarget(target: T): Spring<T>;

	/**
	 * Sets the spring damper
	 * @param damper Defaults to 1, ranges from 0-1
	 */
	SetDamper(damper: number): Spring<T>;

	/**
	 * Sets the spring speed
	 * @param speed Defaults to 1, ranges from 0 to infinity
	 */
	SetSpeed(speed: number): Spring<T>;

	/** Sets the spring clock */
	SetClock(clock: () => number): Spring<T>;
}

interface SpringConstructor {
	/**
	 * Creates a new spring
	 * @param initial A number or Vector3 (anything with * number and addition/subtraction defined)
	 */
	new <T extends SpringAllowedValues>(initial: T): Spring<T>;
}

declare const Spring: SpringConstructor;
export = Spring;
