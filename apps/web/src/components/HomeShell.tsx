"use client";

import { Button, Input } from "@charts-generator/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { fetchHealth } from "@/lib/api";
import styles from "./HomeShell.module.css";

export function HomeShell() {
  const t = useTranslations("home");
  const [prompt, setPrompt] = useState("");
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  async function onHealthCheck() {
    try {
      const data = await fetchHealth();
      setHealthStatus(`${data.status} @ ${data.timestamp}`);
    } catch (e) {
      setHealthStatus(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>{t("sidebarTitle")}</h2>
        <p className={styles.placeholder}>—</p>
      </aside>
      <main className={styles.main}>
        <section className={styles.chartPanel}>
          <h2 className={styles.panelTitle}>{t("chartAreaTitle")}</h2>
          <div className={styles.chartPlaceholder} />
        </section>
        <section className={styles.controls}>
          <Input
            placeholder={t("promptPlaceholder")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className={styles.actions}>
            <Button type="button">{t("send")}</Button>
            <Button type="button" variant="secondary" onClick={onHealthCheck}>
              {t("healthCheck")}
            </Button>
          </div>
          {healthStatus ? (
            <p className={styles.health}>{healthStatus}</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
