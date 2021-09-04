import Attributes from "@memolemo-studios/rbxts-attributes";
import { Janitor } from "@rbxts/janitor";
import { CollectionService, HttpService } from "@rbxts/services";
import { validateTree } from "@rbxts/validate-tree";
import type { Tycoon } from "Server/Services/TycoonService/Tycoon";

import { BaseOrePart, TycoonServerBaseComponent } from "../../../../../typings/tycoon";
import { ORE_TAG_NAME } from "../Ores/BaseOre";

interface BaseUpgraderAttributes {
	Multipler: number;
	Adder: number;
}

interface BaseUpgraderModel extends Model {
	Upgraders: Model;
}

function isAnOre(basePart: BasePart): basePart is BaseOrePart {
	return CollectionService.HasTag(basePart, ORE_TAG_NAME);
}

const validateUpgraderModel = (instance: Instance): instance is BaseUpgraderModel =>
	validateTree(instance, {
		$className: "Model",
		Upgraders: "Model",
	});

/** @hidden */
class BaseUpgrader implements TycoonServerBaseComponent {
	private _realInstance: BaseUpgraderModel;
	private _attributes: Attributes<BaseUpgraderAttributes>;

	private _multipler = 1;
	private _adder = 0;

	private _janitor = new Janitor();

	public constructor(public instance: Model, public tycoon: Tycoon) {
		assert(validateUpgraderModel(instance), `${instance.GetFullName()} has invalid Upgrader structure tree`);
		this._realInstance = instance;
		this._attributes = new Attributes(this.instance);

		// multipler or adder only
		const multiplerAtt = this._attributes.get("Multipler");
		const adderAtt = this._attributes.get("Adder");

		if (multiplerAtt === undefined && adderAtt === undefined) {
			error(`${instance.GetFullName()} has no upgrader multipler or adder attribute applied`);
		}

		if (multiplerAtt !== undefined && adderAtt !== undefined) {
			error(`${instance.GetFullName()} has both upgrader multipler or adder attribute applied`);
		}

		this._multipler = multiplerAtt ?? this._multipler;
		this._adder = adderAtt ?? this._adder;
	}

	private _onUpgraderTouched(hit: BasePart, guid: string): void {
		if (!isAnOre(hit)) return;

		// making sure that ore isn't upgrader in particular upgrader part
		if (hit.FindFirstChild(guid)) return;

		const guidValue = new Instance("ObjectValue");
		guidValue.Name = guid;
		guidValue.Parent = hit;

		// increase ore's worth
		hit.Worth.Value *= this._multipler;
		hit.Worth.Value += this._adder;
	}

	private _listenUpgraderPart(part: Part): void {
		// I do not know if guid will have the same id as other upgraders
		// if it is, then that will be a great disaster!
		const guid = HttpService.GenerateGUID();
		this._janitor.Add(part.Touched.Connect(hit => this._onUpgraderTouched(hit, guid)));
	}

	public init(): void {
		// iterating each upgraders
		// whilst generate their own ids (to prevent from upgrading too much until any ore's worth is around an infinity)
		for (const upgrader of this._realInstance.Upgraders.GetChildren()) {
			if (upgrader.IsA("Part")) {
				this._listenUpgraderPart(upgrader);
			}
		}
	}

	public destroy(): void {
		this._janitor.Destroy();
	}
}

export = BaseUpgrader;
