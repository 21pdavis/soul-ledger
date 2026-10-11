import { useId } from "react";
import { FILTER_FIELDS, type LookupFilters } from "@/story/filters";
import styles from "./FilterControls.module.css";

interface Props {
  value: LookupFilters;
  onChange: (next: LookupFilters) => void;
  /** Greys the choices out and ignores them (the form is not live yet). */
  disabled?: boolean;
}

/**
 * One choice group per filter field (ADR 0052). It only reads `FILTER_FIELDS`, so a new filter
 * shows up here without a new component.
 */
export function FilterControls({ value, onChange, disabled = false }: Props) {
  const name = useId();
  return (
    <>
      {FILTER_FIELDS.map((field) => (
        <fieldset key={field.key} className={styles.field} disabled={disabled}>
          <legend className={styles.legend}>{field.label}</legend>
          <div className={styles.options}>
            {field.options.map((option) => (
              <label key={option.value} className={styles.option}>
                <input
                  type="radio"
                  className={styles.radio}
                  name={`${name}-${field.key}`}
                  value={option.value}
                  checked={value[field.key] === option.value}
                  disabled={disabled}
                  onChange={() => onChange({ ...value, [field.key]: option.value })}
                />
                <span className={styles.stamp}>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}
