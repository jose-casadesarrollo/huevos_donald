import type { FC } from "react";
import { Composition } from "remotion";

import { AgendaComposition } from "./compositions/AgendaComposition";
import {
  LifecycleHorizontal,
  LifecycleVertical,
} from "./compositions/LifecycleComposition";
import { NotifComposition } from "./compositions/NotifComposition";
import { SaldoComposition } from "./compositions/SaldoComposition";

/**
 * Registers every composition for the Remotion CLI/Studio. The landing page
 * embeds these straight through <Player> (see the `vizs/` wrappers), so this
 * Root only matters for `npx remotion render …` MP4 exports for marketing.
 */
export const RemotionRoot: FC = () => (
  <>
    <Composition id="saldo" component={SaldoComposition} durationInFrames={180} fps={30} width={400} height={160} />
    <Composition id="agenda" component={AgendaComposition} durationInFrames={180} fps={30} width={400} height={160} />
    <Composition id="notif" component={NotifComposition} durationInFrames={150} fps={30} width={400} height={160} />
    <Composition
      id="lifecycle-horizontal"
      component={LifecycleHorizontal}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={220}
    />
    <Composition
      id="lifecycle-vertical"
      component={LifecycleVertical}
      durationInFrames={300}
      fps={30}
      width={400}
      height={480}
    />
  </>
);
