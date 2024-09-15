import { useUpdateEffect } from "@chakra-ui/react";
import { isEqual } from "lodash";
import { useCallback, useRef, useState } from "react";

export default function usePartialState<T>(
  initialState: Partial<T> = {},
  dependencies: any[] = []
) {
  const isSetCalled = useRef(false);
  const dependencyRef = useRef<any[]>([]);
  const initialStateBackup = useRef(initialState);
  const [s, _set] = useState(initialState);

  type InitialStateType = typeof initialState;

  const set = useCallback(
    (
      update: InitialStateType | ((prev: InitialStateType) => InitialStateType)
    ) => {
      isSetCalled.current = true;
      if (typeof update === "function") return _set(update);
      _set((oldState) => ({ ...oldState, ...update }));
      return;
    },
    []
  );

  const reset = useCallback(() => {
    _set(() => ({ ...initialStateBackup.current }));
    return;
  }, []);

  useUpdateEffect(() => {
    if (!isEqual(dependencyRef.current, dependencies)) {
      _set(initialState);
      dependencyRef.current = dependencies;
    }
  }, [...dependencies, dependencyRef, initialState]);

  const arr: [typeof initialState, typeof set, typeof reset] = [s, set, reset];
  return arr;
}
