import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils/cn";

interface Props {
  className?: string;
}

export function MedicalDisclaimer({ className }: Props) {
  const t = useTranslations("common");
  return (
    <p
      className={cn(
        "inline-flex items-start gap-2 text-xs leading-relaxed text-brand-700/75",
        className,
      )}
    >
      <span aria-hidden className="mt-px text-brand-500">
        ⚕
      </span>
      <span>{t("disclaimer")}</span>
    </p>
  );
}
