import {registerAFrameComponent} from "./AFrame";
import {LabelComponent} from "./LabelComponent";
import {IdentityComponent} from "./IdentityComponent";
import {DataspaceComponent} from "./DataspaceComponent";
import {ArcadeControlsComponent} from "./component/controls/ArcadeControlsComponent";
import {AnimatorComponent} from "./component/animation/AnimatorComponent";
import {AvatarComponent} from "./component/avatar/AvatarComponent";

registerAFrameComponent(() => new DataspaceComponent());
registerAFrameComponent(() => new IdentityComponent());
registerAFrameComponent(() => new LabelComponent());
registerAFrameComponent(() => new ArcadeControlsComponent());
registerAFrameComponent(() => new AnimatorComponent());
registerAFrameComponent(() => new AvatarComponent());



