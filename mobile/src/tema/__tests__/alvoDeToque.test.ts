import { alvoMinimoPara, folgaDeToque } from '../alvoDeToque';
import { TAMANHO } from '../tokens';

describe('alvo de toque por plataforma (SCRUM-41)', () => {
  it('44 no iOS e na web, 48 no Android', () => {
    expect(alvoMinimoPara('ios')).toBe(44);
    expect(alvoMinimoPara('web')).toBe(44);
    expect(alvoMinimoPara('android')).toBe(48);
  });

  it('o piso do Android sai do token, não de número solto', () => {
    expect(alvoMinimoPara('android')).toBe(TAMANHO.alvoMinimoAndroid);
    expect(alvoMinimoPara('ios')).toBe(TAMANHO.alvoMinimo);
  });

  it('a folga fecha o piso de cada plataforma', () => {
    // botão inline de 40
    expect(folgaDeToque(40, undefined, 44)).toEqual({ top: 2, bottom: 2, left: 0, right: 0 });
    expect(folgaDeToque(40, undefined, 48)).toEqual({ top: 4, bottom: 4, left: 0, right: 0 });
    // botão do stepper, 38 × 34
    expect(folgaDeToque(34, 38, 48)).toEqual({ top: 7, bottom: 7, left: 5, right: 5 });
  });

  it('peça que já passa do piso não ganha folga', () => {
    expect(folgaDeToque(TAMANHO.botaoTexto, undefined, 44)).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    // o botão de texto (46) é o caso que só o Android pega
    expect(folgaDeToque(TAMANHO.botaoTexto, undefined, 48).top).toBe(1);
  });
});
