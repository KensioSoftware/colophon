import {
  assertArrayLength,
  assertIdentical,
  assertStringIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { createThreadPoolWarner, threadPoolSize } from "./thread-pool.js";

describe("threadPoolSize", () => {
  it("is four where the environment says nothing", () => {
    assertIdentical(threadPoolSize(undefined), 4);
  });

  it("is what UV_THREADPOOL_SIZE asked for", () => {
    assertIdentical(threadPoolSize("16"), 16);
  });

  it("falls back to the default for a setting libuv cannot read", () => {
    // libuv reads the variable with atoi and treats a zero as unset. A build
    // reporting anything else here would be describing a pool of a size the
    // process never had.
    assertIdentical(threadPoolSize("0"), 4);
    assertIdentical(threadPoolSize("-8"), 4);
    assertIdentical(threadPoolSize("many"), 4);
    assertIdentical(threadPoolSize("4.5"), 4);
  });

  it("stops at the pool's own maximum", () => {
    assertIdentical(threadPoolSize("100000"), 1024);
  });
});

/** Somewhere for a warner to write, and the list to assert on afterwards. */
function collector(): {
  warnings: string[];
  onWarning: (message: string) => void;
} {
  const warnings: string[] = [];

  return {
    warnings,
    onWarning: (message) => {
      warnings.push(message);
    },
  };
}

describe("createThreadPoolWarner", () => {
  it("says how far the pool falls short and how to raise it", () => {
    const { warnings, onWarning } = collector();

    createThreadPoolWarner()(18, onWarning, 4);

    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "18 images at once");
    assertStringIncludes(warnings[0], "4 threads");
    assertStringIncludes(warnings[0], "UV_THREADPOOL_SIZE=18");
  });

  it("says nothing where the pool is large enough", () => {
    const { warnings, onWarning } = collector();
    const warn = createThreadPoolWarner();

    warn(4, onWarning, 4);
    warn(2, onWarning, 16);

    assertArrayLength(warnings, 0);
  });

  it("says it once, however many builds ask", () => {
    // The ceiling belongs to the process. A watch rebuilding on every content
    // change would otherwise repeat a line no build can act on.
    const { warnings, onWarning } = collector();
    const warn = createThreadPoolWarner();

    warn(18, onWarning, 4);
    warn(18, onWarning, 4);
    warn(32, onWarning, 4);

    assertArrayLength(warnings, 1);
  });

  it("reads the environment where no pool size is given", () => {
    const { warnings, onWarning } = collector();

    // Whatever the suite is running under, a concurrency above libuv's own
    // maximum is above it.
    createThreadPoolWarner()(2048, onWarning);

    assertArrayLength(warnings, 1);
  });
});
