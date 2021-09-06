interface TycoonAttributes {
	/**
	 * This attribute is assigned when a tycoon is owned
	 * by someone else
	 *
	 * It is automatically set as player's userId
	 */
	Owner: number;

	/**
	 * This attribute is assigned for identification
	 * because Binder doesn't automatically assign component assignment id
	 * for its classes than Knit does
	 *
	 * **TEMPLATE**: `Tycoon{ID}`
	 */
	ComponentId: string;
}

interface UnlockableModel extends Model {
	Button: Part;
}
