import { RunService } from "@rbxts/services";
import { ModelHighlighter } from "shared/classes/modelHighlighter";
import { lerpNumber } from "shared/util/lerpNumber";

import Spring from "../../../../lib/Spring";

const OBJECT_SPAWN_ANIMATION_LENGTH = 1;
const RISE_FROM_Y = 1;

export function doObjectAnimation(model: Model) {
	const highlighter = new ModelHighlighter(model, [model.PrimaryPart!]);
	highlighter.setTransparency(1);
	highlighter.setCanCollide(false);
	highlighter.setCastShadow(false);

	wait(0.2);

	return new Promise<void>(resolve => {
		const spring = new Spring<number>(0).SetDamper(0.38).SetSpeed(14).SetTarget(1);
		const baseCFrame = model.PrimaryPart!.CFrame;

		let timer = 0;
		let connection: RBXScriptConnection;
		let isResolved = false;

		connection = RunService.Heartbeat.Connect(dt => {
			if (isResolved) {
				task.wait();
				return highlighter.reset();
			}

			timer += dt;

			if (timer >= OBJECT_SPAWN_ANIMATION_LENGTH) {
				isResolved = true;
				model.SetPrimaryPartCFrame(baseCFrame);
				connection.Disconnect();
				highlighter.reset();
				return resolve();
			}

			const position = spring.GetPosition();
			highlighter.setTransparencyLerp(lerpNumber(1, 0, timer / OBJECT_SPAWN_ANIMATION_LENGTH));
			model.SetPrimaryPartCFrame(baseCFrame.ToWorldSpace(new CFrame(0, lerpNumber(RISE_FROM_Y, 0, position), 0)));
		});
	}).then(() => {
		task.wait();
		highlighter.reset();
	});
}
