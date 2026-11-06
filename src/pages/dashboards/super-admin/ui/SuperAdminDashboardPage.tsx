import { Shapes, Package, Ruler } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardCard } from "@shared/ui";
import { useSuperAdminMockData } from "../model/mock-data";

export function SuperAdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const products = useSuperAdminMockData((state) => state.products);
  const categories = useSuperAdminMockData((state) => state.categories);
  const units = useSuperAdminMockData((state) => state.units);
  const collectionProducts = [...products].sort(
    (first, second) => second.usedCount - first.usedCount,
  );
  const maximumCount = collectionProducts[0]?.usedCount ?? 1;
  const statistics = [
    {
      label: t("dashboard.superAdminStats.products"),
      value: products.length,
      icon: Package,
    },
    {
      label: t("dashboard.superAdminStats.categories"),
      value: categories.length,
      icon: Shapes,
    },
    {
      label: t("dashboard.superAdminStats.units"),
      value: units.length,
      icon: Ruler,
    },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-[32px] font-bold leading-tight text-text">
          {t("dashboard.dashboard")}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {t("dashboard.superAdminWelcome")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {statistics.map(({ label, value, icon: Icon }) => (
          <DashboardCard
            key={label}
            className="flex items-center justify-between gap-4 p-6"
          >
            <div className="space-y-1">
              <p className="text-sm text-text-muted">{label}</p>
              <p className="text-[48px] font-bold leading-none text-text">
                {value}
              </p>
            </div>
            <span className="flex size-[72px] shrink-0 items-center justify-center rounded-control bg-primary-light text-primary">
              <Icon size={36} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard
        aria-labelledby="products-used-heading"
        className="space-y-6 p-6"
      >
        <h2
          id="products-used-heading"
          className="text-xl font-semibold text-text"
        >
          {t("dashboard.productsUsedInCollection")}
        </h2>
        <div className="space-y-5">
          {collectionProducts.map((product) => (
            <div key={product.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-4 text-sm font-medium">
                <span className="text-text">
                  {i18n.language.startsWith("ne")
                    ? product.nameNp
                    : product.nameEn}
                </span>
                <span className="shrink-0 font-semibold text-primary">
                  {product.usedCount} {t("dashboard.times")}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={
                  i18n.language.startsWith("ne")
                    ? product.nameNp
                    : product.nameEn
                }
                aria-valuemin={0}
                aria-valuemax={maximumCount}
                aria-valuenow={product.usedCount}
                className="h-6 w-full overflow-hidden rounded-control bg-primary-light"
              >
                <div
                  className="h-full rounded-control bg-primary transition-[width]"
                  style={{
                    width: `${(product.usedCount / maximumCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </section>
  );
}
