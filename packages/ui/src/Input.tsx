import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export function Input({ label, id, className, ...rest }: InputProps) {
  return (
    <div className={styles.wrap}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input id={id} className={[styles.input, className].filter(Boolean).join(" ")} {...rest} />
    </div>
  );
}
