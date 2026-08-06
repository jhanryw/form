import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect no navegador (roda antes do primeiro paint, evitando o
 * flash de "cover" ao restaurar uma sessão salva); useEffect no servidor
 * (useLayoutEffect não existe em SSR e geraria um aviso do React).
 */
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
