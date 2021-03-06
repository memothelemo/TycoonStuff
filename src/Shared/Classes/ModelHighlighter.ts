import { t } from "@rbxts/t";
import { lerpNumber } from "Shared/Util/lerpNumber";

interface CacheInfo {
	transparency: number;
	canCollide: boolean;
	color: Color3;
	castShadow: boolean;
}

const partTypecheck = t.instanceIsA("BasePart");

export class ModelHighlighter {
	private _cache = new Map<BasePart, CacheInfo>();

	public constructor(model: Model, ignoredParts = new Array<BasePart>()) {
		// ignoredParts checking
		ignoredParts.forEach((part, i) => {
			if (!partTypecheck(part))
				throw `Bad index #${i}: expected Instance and BasePart got ${
					typeIs(part, "Instance") ? `wrong class` : typeOf(part)
				}`;

			if (!part.IsDescendantOf(model))
				throw `Bad index #${i}: ${part.GetFullName()} is not a descendant of ${model.GetFullName()}`;
		});

		model
			.GetDescendants()
			.filter((child): child is BasePart => {
				if (ignoredParts.includes(child as BasePart)) {
					return false;
				}
				return child.IsA("BasePart");
			})
			.forEach(child =>
				this._cache.set(child, {
					transparency: child.Transparency,
					color: child.Color,
					canCollide: child.CanCollide,
					castShadow: child.CastShadow,
				}),
			);
	}

	public setCastShadow(shadow: boolean): void {
		this._cache.forEach((_, part) => (part.CastShadow = shadow));
	}

	public setCanCollide(canCollide: boolean): void {
		this._cache.forEach((_, part) => (part.CanCollide = canCollide));
	}

	public setTransparencyLerp(lerpAlpha: number): void {
		this._cache.forEach((info, part) => (part.Transparency = lerpNumber(info.transparency, 1, lerpAlpha)));
	}

	public setTransparency(transparency: number): void {
		this._cache.forEach((_, part) => (part.Transparency = transparency));
	}

	public setColor(color: Color3): void {
		this._cache.forEach((_, part) => (part.Color = color));
	}

	public reset(): void {
		this._cache.forEach((info, part) => {
			part.Color = info.color;
			part.Transparency = info.transparency;
			part.CanCollide = info.canCollide;
			part.CastShadow = info.castShadow;
		});
	}
}
