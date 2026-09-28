import { useEffect, useRef, useState } from 'react';
import type { TextStyle } from 'react-native';
import { Txt } from '../../ui';
import { formatCountdown, nowMs } from '../../core/clock';

/** ~30 quadros por segundo: os milissegundos correm sem pesar a bateria. */
const FRAME_MS = 33;

/**
 * Contagem regressiva até o prazo, com segundos e milissegundos correndo.
 *
 * O componente se re-renderiza sozinho — só este texto, não a tela que o
 * contém. Usa o relógio do app (que o Laboratório pode adiantar), não
 * `Date.now()` direto.
 */
export function Countdown({ deadline, tone = 'red', style }: {
  deadline: string | undefined; tone?: 'red' | 'dim'; style?: TextStyle;
}) {
  const end = deadline ? new Date(deadline).getTime() : 0;
  const [left, setLeft] = useState(() => end - nowMs());
  const last = useRef(0);

  useEffect(() => {
    if (!end) return;
    let raf = 0;
    const tick = (t: number) => {
      if (t - last.current >= FRAME_MS) {
        last.current = t;
        const ms = end - nowMs();
        setLeft(ms);
        if (ms <= 0) return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end]);

  const text = formatCountdown(left);
  return (
    <Txt
      variant="stat"
      tone={tone}
      // Dígitos de largura fixa: sem isso o texto "treme" a cada milissegundo.
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      accessibilityLabel={text.slice(0, 8)}
    >
      {text}
    </Txt>
  );
}
