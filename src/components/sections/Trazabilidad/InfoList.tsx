interface InfoItem {
  number: string;
  text: string;
  badge: string;
}

const ITEMS: InfoItem[] = [
  { number: "01", text: "Quién produjo tus huevos", badge: "Productor" },
  { number: "02", text: "Cómo viven y se alimentan las gallinas", badge: "Crianza" },
  { number: "03", text: "Cuándo se pusieron, hora exacta", badge: "Postura" },
  { number: "04", text: "Kilómetros recorridos hasta tu casa", badge: "Ruta" },
  { number: "05", text: "Estado de la cadena de frío", badge: "Calidad" },
];

export function InfoList() {
  return (
    <ol className="border-t border-[var(--ink)]/10">
      {ITEMS.map((item) => (
        <li
          key={item.number}
          className="flex items-center gap-3 border-b border-[var(--ink)]/10 py-3.5 sm:gap-4 sm:py-[18px]"
        >
          <span className="shrink-0 font-[var(--font-jetbrains-mono)] text-[11px] font-bold tracking-[0.1em] text-[var(--ink-soft)]">
            {item.number}
          </span>
          <span className="min-w-0 flex-1 font-[var(--font-fraunces)] text-[15px] font-medium leading-snug text-[var(--ink)] sm:text-[17px]">
            {item.text}
          </span>
          <span
            className={[
              "shrink-0 rounded-full px-2 py-1",
              "font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.1em]",
              "bg-[rgba(74,93,58,0.1)] text-[var(--moss)]",
            ].join(" ")}
          >
            {item.badge}
          </span>
        </li>
      ))}
    </ol>
  );
}
