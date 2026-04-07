import { lib } from '../lib.js';

export const sch = lib.object({
  key: lib.array(
    lib.array(
      lib.array(
        lib.object({
          arr: lib.array(
            lib.object({ key: lib.object({ key1: lib.object({ mykey: lib.string(), youkey: lib.number() }) }) }),
          ),
        }),
      ),
    ),
  ),
});
