import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
export function Countdown({ deadline, tone = 'red', size = 16 }: {
  deadline: string | undefined; tone?: 'red' | 'dim'; size?: number;
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
  // Largura TRAVADA: cada caractere numa célula de largura fixa. A fonte do
  // app não tem dígitos de largura igual (e o Android ignora tabular-nums em
  // fonte customizada), então "1" e "8" mudavam a largura a cada quadro.
  const digitW = Math.ceil(size * 0.66);
  const sepW = Math.ceil(size * 0.34);
  return (
    <View style={styles.row} accessible accessibilityRole="timer" accessibilityLabel={text.slice(0, 8)}>
      {text.split('').map((ch, i) => (
        <Txt
          key={i}
          variant="stat"
          tone={tone}
          allowFontScaling={false}
          style={{ width: /\d/.test(ch) ? digitW : sepW, fontSize: size, lineHeight: size * 1.25, textAlign: 'center' }}
        >
          {ch}
        </Txt>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
