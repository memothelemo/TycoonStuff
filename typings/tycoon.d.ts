import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

interface TycoonModel extends Model {
	Components: Folder;
}

interface TycoonAttributes {
	/** Owner of the tycoon (assigned by UserId) */
	Owner: number;

	/** Component id of the tycoon (useful for clients) */
	ComponentId: string;
}

/** Base component for all tycoon components (it is definitely required to do this) */
interface TycoonServerBaseComponent {
	tycoon: Tycoon;
	instance: Model | Part;

	init(): void;
	onSpawn(): void;
	destroy(): void;
}
