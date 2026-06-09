import { MinusIcon, PlusIcon } from "./icons";

/**
 * Selector de cantidad controlado: − [input] +. El estado vive en el padre
 * (`ProductDetail`); este componente solo emite el nuevo valor ya clampado entre
 * `min` y `max`. Sin spinners nativos.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const btn =
    "flex size-11 items-center justify-center rounded-full text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--cream)] disabled:opacity-35 disabled:hover:bg-transparent motion-reduce:transition-none";

  return (
    <div className="inline-flex items-center rounded-full border border-[rgba(34,26,15,0.18)] bg-[var(--shell)] p-0.5">
      <button
        type="button"
        aria-label="Disminuir"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={btn}
      >
        <MinusIcon className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Cantidad"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isNaN(n) ? min : clamp(n));
        }}
        className="w-11 [appearance:textfield] border-0 bg-transparent text-center font-[var(--font-fraunces)] text-[18px] font-bold text-[var(--ink)] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={btn}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
