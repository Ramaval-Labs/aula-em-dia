import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { CHAVE_TEMA } from '../dados/armazenamento';
import { CORES, MATERIAL, type Material, type Paleta } from './tokens';

export type NomeDeTema = 'claro' | 'escuro';

type Contexto = {
  tema: NomeDeTema;
  trocarTema: (t: NomeDeTema) => void;
  carregado: boolean;
};

const TemaContexto = createContext<Contexto | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const doSistema = useColorScheme();
  const [tema, setTema] = useState<NomeDeTema>('claro');
  const [carregado, setCarregado] = useState(false);
  // O tema do sistema na primeira carga. Numa ref, e não na lista de dependências:
  // o efeito roda uma vez só, e trocar o tema do sistema depois não pode passar
  // por cima da escolha manual (SCRUM-97).
  const sistemaNaCarga = useRef(doSistema);

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
      else setTema(sistemaNaCarga.current === 'dark' ? 'escuro' : 'claro');
      setCarregado(true);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const trocarTema = useCallback((t: NomeDeTema) => {
    setTema(t);
    AsyncStorage.setItem(CHAVE_TEMA, t).catch(() => {});
  }, []);

  const valor = useMemo<Contexto>(
    () => ({ tema, trocarTema, carregado }),
    [tema, trocarTema, carregado],
  );

  return <TemaContexto.Provider value={valor}>{children}</TemaContexto.Provider>;
}

/** O provider em si: qual tema está no ar, trocar de tema, e se já carregou. */
export function useTema(): Contexto {
  const ctx = useContext(TemaContexto);
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>');
  return ctx;
}

export type CoresDoTema = { tema: NomeDeTema; cores: Paleta; material: Material };

/**
 * Paleta e material do tema atual — o que toda tela e todo componente lê:
 * `const { cores } = useCores()`, ou `{ cores, material }` para sombra e vidro.
 */
export function useCores(): CoresDoTema {
  const { tema } = useTema();
  return useMemo(() => ({ tema, cores: CORES[tema], material: MATERIAL[tema] }), [tema]);
}
