import { registerRoot } from "remotion";

import { RemotionRoot } from "./Root";

/**
 * Remotion CLI entry point. Only used for headless MP4 exports, e.g.:
 *   npx remotion render src/remotion/index.ts saldo out/saldo.mp4
 * The landing page never imports this file.
 */
registerRoot(RemotionRoot);
