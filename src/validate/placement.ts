import { checkKeys, isRecord } from "./check.js";
import {
  besideContentKeys,
  customPlacementKeys,
  placementStrategies,
  publicDirKeys,
} from "./keys.js";
import { describeUnknownValue } from "./values.js";

/** The keys one placement strategy accepts, or nothing if it names none. */
function placementKeys(strategy: string): readonly string[] | undefined {
  if (strategy === "beside-content") {
    return besideContentKeys;
  }

  if (strategy === "public-dir") {
    return publicDirKeys;
  }

  return strategy === "custom" ? customPlacementKeys : undefined;
}

/**
 * Check a placement against the keys of whichever strategy it declares.
 *
 * The strategy is required, unlike a background's `type`: a background with
 * none still looks like the gradient it is rendered as, where a placement with
 * none is a `dir` and a `urlBase` read by nobody and images written somewhere
 * else entirely.
 */
export function checkPlacement(placement: unknown, problems: string[]): void {
  if (!isRecord(placement)) {
    return;
  }

  const strategy = placement["strategy"];

  if (typeof strategy !== "string") {
    problems.push(
      `placement needs a "strategy": ${placementStrategies.join(", ")}.`,
    );
    return;
  }

  const keys = placementKeys(strategy);

  if (keys === undefined) {
    problems.push(
      describeUnknownValue(
        "placement strategy",
        "strategies",
        strategy,
        placementStrategies,
      ),
    );
    return;
  }

  checkKeys(placement, "placement", keys, problems);
}
