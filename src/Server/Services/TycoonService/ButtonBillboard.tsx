import { Janitor } from "@rbxts/janitor";
import Roact, { createBinding, mount, unmount } from "@rbxts/roact";
import { lerpNumber } from "Shared/Util/lerpNumber";

export class ButtonBillboard {
	private binding: Roact.Binding<number>;
	private setBinding: Roact.BindingFunction<number>;

	private janitor = new Janitor();
	private tree: Roact.Tree;

	public constructor(parent: BasePart, price: number, displayName: string) {
		[this.binding, this.setBinding] = createBinding<number>(parent.Transparency);

		this.janitor.Add(
			(parent as BasePart & ChangedSignal).Changed.Connect(() => this.setBinding(parent.Transparency)),
		);

		const element = (
			<billboardgui
				AlwaysOnTop={true}
				LightInfluence={0}
				MaxDistance={40}
				Size={UDim2.fromScale(8, 2)}
				StudsOffset={new Vector3(0, 2, 0)}
			>
				<textlabel
					BackgroundTransparency={1}
					Key="Title"
					Size={UDim2.fromScale(1, 0.5)}
					Font={Enum.Font.SourceSansBold}
					TextScaled={true}
					TextStrokeTransparency={this.binding.map(v => lerpNumber(0.7, 1, v))}
					Text={displayName}
					TextColor3={new Color3(1, 1, 1)}
					TextTransparency={this.binding}
				/>
				<textlabel
					AnchorPoint={new Vector2(0.5, 0)}
					BackgroundColor3={new Color3(1, 1, 1)}
					BackgroundTransparency={this.binding}
					Key="Price"
					Position={UDim2.fromScale(0.5, 0.6)}
					Size={UDim2.fromScale(0.5, 0.4)}
					Text={`$${price}`}
					TextTransparency={this.binding}
					Font={Enum.Font.GothamBlack}
					TextColor3={Color3.fromRGB(126, 126, 126)}
					TextScaled={true}
				>
					<uicorner />
				</textlabel>
			</billboardgui>
		);

		this.tree = mount(element, parent);
	}

	public destroy(): void {
		this.janitor.Destroy();
		if (this.tree) {
			unmount(this.tree);
		}
	}
}
