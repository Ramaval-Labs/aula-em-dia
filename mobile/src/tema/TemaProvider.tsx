import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { CHAVE_TEMA } from '../dados/armazenamento';
import { CORES, type Paleta } from './tokens';

export type NomeDeTema = 'claro' | 'escuro';

type Contexto = {
  tema: NomeDeTema;
  cores: Paleta;
  trocarTema: (t: NomeDeTema) => void;
  carregado: boolean;
};

const TemaContexto = createContext<Contexto | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const doSistema = useColorScheme();
  const [tema, setTema] = useState<NomeDeTema>('claro');
  const [carregado, setCarregado] = useState(false);

  // Preferência do sistema na primeira carga; a escolha manual vence depois.
  useEffect(() => {
    let vivo = true;
    (async () => {
      let salvo: string | null = null;
      try {
        salvo = await AsyncStorage.getItem(CHAVE_TEMA);
      } catch {
        salvo = null;
      }
      if (!vivo) return;
      if (salvo === 'claro' || salvo === 'escuro') setTema(salvo);
      else setTema(doSistema === 'dark' ? 'escuro' : 'claro');
      setCarregado(true);
    })();
    return () => {
      vivo = false;
    };
    // roda uma vez: depois da primeira carga a escolha manual manda
  }, []);

  const trocarTema = useCallback((t: NomeDeTema) => {
    setTema(t);
    AsyncStorage.setItem(CHAVE_TEMA, t).catch(() => {});
  }, []);

  const valor = useMemo<Contexto>(
    () => ({ tema, cores: CORES[tema], trocarTema, carregado }),
    [tema, trocarTema, carregado],
  );

  return <TemaContexto.Provider value={valor}>{children}</TemaContexto.Provider>;
}

export function useTema(): Contexto {
  const ctx = useContext(TemaContexto);
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>');
  return ctx;
}

/** Atalho para o caso comum de só precisar da paleta. */
export function useCores(): Paleta {
  return useTema().cores;
}
