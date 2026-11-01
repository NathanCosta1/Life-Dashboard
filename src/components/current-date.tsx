"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getClientDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function getServerDate() {
  return "";
}

export function CurrentDate() {
  const dateLabel = useSyncExternalStore(subscribe, getClientDate, getServerDate);

  return <p className="life-dashboard-date">{dateLabel ?? ""}</p>;
}
