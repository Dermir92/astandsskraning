"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CarFront,
  Check,
  Circle,
  House,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { AssetType, ReportStatus } from "@/lib/model";
import { is } from "@/lib/locale/is";
import type { ReactNode } from "react";

export const assetIcons: Record<AssetType, LucideIcon> = {
  apartment: House,
  vehicle: CarFront,
  storage: Warehouse,
  commercial: Building2,
};
export function AssetIcon({
  type,
  className = "",
}: {
  type: AssetType;
  className?: string;
}) {
  const Icon = assetIcons[type];
  return (
    <span className={`asset-icon ${className}`}>
      <Icon size={21} aria-hidden="true" />
    </span>
  );
}
export function Badge({ status }: { status: ReportStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {is.statuses[status]}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="heading-action">{action}</div> : null}
    </div>
  );
}
export function BackLink({
  href = "/",
  children = "Mínar skýrslur",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className="back-link">
      <ArrowLeft size={16} aria-hidden="true" />
      {children}
    </Link>
  );
}
export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max || 1}
      aria-label={label}
    >
      <div style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}
export const stepPaths = ["upplysingar", "rymi", "skraning", "yfirferd"];
export function Stepper({
  reportId,
  step,
}: {
  reportId: string;
  step: number;
}) {
  return (
    <nav className="stepper" aria-label="Skref skráningar">
      <ol>
        {is.steps.map((name, i) => (
          <li
            key={name}
            className={
              i === step ? "step-current" : i < step ? "step-previous" : ""
            }
          >
            <Link
              href={`/skyrslur/${reportId}/${stepPaths[i]}`}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="step-number">
                {i < step ? <Check size={14} aria-hidden="true" /> : i + 1}
              </span>
              <span>{name}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function FlowFooter({
  backHref,
  nextHref,
  nextText = "Halda áfram",
  children,
  disabled = false,
}: {
  backHref: string;
  nextHref?: string;
  nextText?: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flow-footer">
      <Link className="button button-quiet" href={backHref}>
        <ArrowLeft size={17} aria-hidden="true" />
        Til baka
      </Link>
      <div className="flow-footer-right">
        {children}
        {nextHref ? (
          <Link className="button button-primary" href={nextHref}>
            {nextText}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="submit"
            className="button button-primary"
            disabled={disabled}
          >
            {nextText}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Circle size={30} aria-hidden="true" />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
