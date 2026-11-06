import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock3,
  Edit2,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardButton, DashboardField } from "@shared/ui";
import {
  useSuperAdminMockData,
  type MockAdmin,
  type MockCategory,
  type MockProduct,
  type MockUnit,
} from "../model/mock-data";

type ModuleId = "products" | "categories" | "units" | "localAdmin";
type ModalKind = "product" | "category" | "unit" | "invite";
type FormValues = Record<string, string>;

const fieldClassName =
  "h-12 w-full rounded-control border border-border bg-surface px-4 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const textAreaClassName =
  "w-full rounded-control border border-border bg-surface p-3 text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const tableRowClassName =
  "h-14 transition-colors hover:bg-background/80";
const tableCellClassName = "px-4 py-2.5 md:px-5";

function getEmptyForm(kind: ModalKind): FormValues {
  if (kind === "product") {
    return {
      nameEn: "",
      nameNp: "",
      categoryId: "",
      descEn: "",
      descNp: "",
    };
  }
  if (kind === "category") return { nameEn: "", nameNp: "" };
  if (kind === "unit") {
    return { nameEn: "", nameNp: "", shortEn: "", shortNp: "", type: "" };
  }
  return {
    nameEn: "",
    nameNp: "",
    contact: "",
    email: "",
    password: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
  };
}

function TableFrame({
  headers,
  children,
  empty,
  emptyLabel,
  recordLabel,
  minWidth,
}: {
  headers: string[];
  children: ReactNode;
  empty: boolean;
  emptyLabel: string;
  recordLabel: string;
  minWidth: number;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex min-h-11 items-center justify-between border-b border-border px-4 md:px-5">
        <p className="text-xs font-medium text-text-muted">{recordLabel}</p>
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth }}
        >
          <thead>
            <tr className="h-11 border-b border-border bg-background text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {headers.map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 md:px-5 ${
                    index === 0 ? "w-16" : ""
                  } ${index === headers.length - 1 ? "w-36 text-right" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[13px] leading-5 text-text">
            {children}
          </tbody>
        </table>
      </div>
      {empty && (
        <div className="p-10 text-center text-sm text-text-muted">
          <Search className="mx-auto mb-2 size-8 opacity-50" aria-hidden="true" />
          <p>{emptyLabel}</p>
        </div>
      )}
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        title={editLabel}
        aria-label={editLabel}
        className="flex size-9 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-background hover:text-primary"
      >
        <Edit2 size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title={deleteLabel}
        aria-label={deleteLabel}
        className="flex size-9 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger-bg hover:text-danger"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = true,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <DashboardField
      label={label}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className={fieldClassName}
    />
  );
}

export function SuperAdminModulePage() {
  const { t, i18n } = useTranslation();
  const moduleId = useRouterState({
    select: (state) => state.location.pathname.split("/").at(-1) ?? "",
  });
  const currentModule: ModuleId = (
    ["products", "categories", "units", "localAdmin"] as const
  ).includes(moduleId as ModuleId)
    ? (moduleId as ModuleId)
    : "products";
  const isNepali = i18n.language.startsWith("ne");
  const products = useSuperAdminMockData((state) => state.products);
  const categories = useSuperAdminMockData((state) => state.categories);
  const units = useSuperAdminMockData((state) => state.units);
  const admins = useSuperAdminMockData((state) => state.admins);
  const setProducts = useSuperAdminMockData((state) => state.setProducts);
  const setCategories = useSuperAdminMockData((state) => state.setCategories);
  const setUnits = useSuperAdminMockData((state) => state.setUnits);
  const setAdmins = useSuperAdminMockData((state) => state.setAdmins);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormValues>({});
  const [selectedUnits, setSelectedUnits] = useState<string[]>(["kg"]);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: ModuleId;
    id: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pageConfig = {
    products: {
      title: t("dashboard.moduleNames.superAdmin.products"),
      description: t("dashboard.superAdminPages.productsDescription"),
      addLabel: t("dashboard.superAdminPages.addProduct"),
    },
    categories: {
      title: t("dashboard.moduleNames.superAdmin.categories"),
      description: t("dashboard.superAdminPages.categoriesDescription"),
      addLabel: t("dashboard.superAdminPages.addCategory"),
    },
    units: {
      title: t("dashboard.moduleNames.superAdmin.units"),
      description: t("dashboard.superAdminPages.unitsDescription"),
      addLabel: t("dashboard.superAdminPages.addUnit"),
    },
    localAdmin: {
      title: t("dashboard.moduleNames.superAdmin.localAdmin"),
      description: t("dashboard.superAdminPages.adminsDescription"),
      addLabel: t("dashboard.superAdminPages.sendInvitation"),
    },
  }[currentModule];

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const category =
        categories.find((item) => item.id === product.categoryId)?.nameEn ?? "";
      return [
        product.nameEn,
        product.nameNp,
        category,
        product.descEn,
        product.descNp,
      ].some((value) => value.toLocaleLowerCase().includes(query));
    });
  }, [categories, products, search]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return categories.filter((category) =>
      `${category.nameEn} ${category.nameNp}`.toLocaleLowerCase().includes(query),
    );
  }, [categories, search]);

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return units.filter((unit) =>
      `${unit.nameEn} ${unit.nameNp} ${unit.shortEn} ${unit.shortNp}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [search, units]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return admins.filter((admin) =>
      `${admin.nameEn} ${admin.nameNp} ${admin.contact ?? ""} ${admin.email} ${admin.province ?? ""} ${admin.district ?? ""} ${admin.municipality ?? ""} ${admin.ward ?? ""} ${admin.regionEn} ${admin.regionNp}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [admins, search]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function updateForm(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeModal() {
    setModal(null);
    setForm({});
  }

  function openCreate(kind: ModalKind) {
    setEditingId(null);
    setForm(getEmptyForm(kind));
    setSelectedUnits(["kg"]);
    setModal(kind);
  }

  function openEdit(kind: ModalKind, item: MockProduct | MockCategory | MockUnit) {
    setEditingId(item.id);
    if (kind === "product" && "categoryId" in item) {
      setForm({
        nameEn: item.nameEn,
        nameNp: item.nameNp,
        categoryId: String(item.categoryId),
        descEn: item.descEn,
        descNp: item.descNp,
      });
      setSelectedUnits(item.units);
    } else if (kind === "category" && "nameEn" in item) {
      setForm({ nameEn: item.nameEn, nameNp: item.nameNp });
    } else if (kind === "unit" && "shortEn" in item) {
      setForm({
        nameEn: item.nameEn,
        nameNp: item.nameNp,
        shortEn: item.shortEn,
        shortNp: item.shortNp,
        type: item.type,
      });
    }
    setModal(kind);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = editingId ?? Date.now();

    if (modal === "product") {
      if (!form.categoryId || !selectedUnits.length) {
        setToast(t("dashboard.superAdminPages.requiredProductFields"));
        return;
      }
      const nextProduct: MockProduct = {
        id,
        nameEn: form.nameEn.trim(),
        nameNp: form.nameNp.trim(),
        categoryId: Number(form.categoryId),
        units: selectedUnits,
        usedCount: editingId
          ? (products.find((item) => item.id === editingId)?.usedCount ?? 0)
          : 0,
        descEn: form.descEn.trim() || form.nameEn.trim(),
        descNp: form.descNp.trim() || form.nameNp.trim(),
      };
      setProducts((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? nextProduct : item))
          : [nextProduct, ...current],
      );
    } else if (modal === "category") {
      const nextCategory: MockCategory = {
        id,
        nameEn: form.nameEn.trim(),
        nameNp: form.nameNp.trim(),
      };
      setCategories((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? nextCategory : item))
          : [nextCategory, ...current],
      );
    } else if (modal === "unit") {
      const nextUnit: MockUnit = {
        id,
        nameEn: form.nameEn.trim(),
        nameNp: form.nameNp.trim(),
        shortEn: form.shortEn.trim(),
        shortNp: form.shortNp.trim(),
        type: form.type as MockUnit["type"],
      };
      setUnits((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? nextUnit : item))
          : [nextUnit, ...current],
      );
    } else if (modal === "invite") {
      const today = new Date();
      const dateEn = today.toISOString().slice(0, 10);
      const nextAdmin: MockAdmin = {
        id,
        nameEn: form.nameEn.trim(),
        nameNp: form.nameNp.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        province: form.province.trim(),
        district: form.district.trim(),
        municipality: form.municipality.trim(),
        ward: form.ward.trim(),
        regionEn: [form.province, form.district, form.municipality, form.ward]
          .map((value) => value.trim())
          .filter(Boolean)
          .join(", "),
        regionNp: [form.province, form.district, form.municipality, form.ward]
          .map((value) => value.trim())
          .filter(Boolean)
          .join(", "),
        status: "Pending invite",
        dateEn,
        dateNp: dateEn,
      };
      setAdmins((current) => [nextAdmin, ...current]);
    }

    closeModal();
    setToast(t("dashboard.superAdminPages.saved"));
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "products") {
      setProducts((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
    } else if (deleteTarget.kind === "categories") {
      if (products.some((item) => item.categoryId === deleteTarget.id)) {
        setToast(t("dashboard.superAdminPages.categoryInUse"));
        setDeleteTarget(null);
        return;
      }
      setCategories((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
    } else if (deleteTarget.kind === "units") {
      const unit = units.find((item) => item.id === deleteTarget.id);
      if (unit && products.some((item) => item.units.includes(unit.shortEn))) {
        setToast(t("dashboard.superAdminPages.unitInUse"));
        setDeleteTarget(null);
        return;
      }
      setUnits((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
    } else {
      setAdmins((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
    }
    setDeleteTarget(null);
    setToast(t("dashboard.superAdminPages.deleted"));
  }

  function renderTableRows() {
    if (currentModule === "products") {
      return filteredProducts.map((item, index) => {
        const category = categories.find(
          (entry) => entry.id === item.categoryId,
        );
        const description = isNepali ? item.descNp : item.descEn;
        return (
          <tr key={item.id} className={tableRowClassName}>
            <td className={`${tableCellClassName} whitespace-nowrap font-mono text-xs text-text-muted`}>{index + 1}</td>
            <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>{item.nameNp}</td>
            <td className={`${tableCellClassName} whitespace-nowrap`}>{item.nameEn}</td>
            <td className={`${tableCellClassName} whitespace-nowrap text-text-muted`}>
              {category ? (isNepali ? category.nameNp : category.nameEn) : "—"}
            </td>
            <td className={tableCellClassName}>
              <div className="flex flex-wrap gap-1">
                {item.units.map((unitKey) => {
                  const unit = units.find((entry) => entry.shortEn === unitKey);
                  return (
                    <span
                      key={unitKey}
                      className="rounded bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary"
                    >
                      {unit ? (isNepali ? unit.shortNp : unit.shortEn) : unitKey}
                    </span>
                  );
                })}
              </div>
            </td>
            <td className={`${tableCellClassName} max-w-xs truncate text-text-muted`}>
              {description}
            </td>
            <td className={tableCellClassName}>
              <RowActions
                editLabel={t("dashboard.superAdminPages.edit")}
                deleteLabel={t("dashboard.superAdminPages.delete")}
                onEdit={() => openEdit("product", item)}
                onDelete={() => setDeleteTarget({ kind: "products", id: item.id })}
              />
            </td>
          </tr>
        );
      });
    }
    if (currentModule === "categories") {
      return filteredCategories.map((item, index) => (
        <tr key={item.id} className={tableRowClassName}>
          <td className={`${tableCellClassName} whitespace-nowrap font-mono text-xs text-text-muted`}>{index + 1}</td>
          <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>{item.nameNp}</td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>{item.nameEn}</td>
          <td className={tableCellClassName}>
            <RowActions
              editLabel={t("dashboard.superAdminPages.edit")}
              deleteLabel={t("dashboard.superAdminPages.delete")}
              onEdit={() => openEdit("category", item)}
              onDelete={() =>
                setDeleteTarget({ kind: "categories", id: item.id })
              }
            />
          </td>
        </tr>
      ));
    }
    if (currentModule === "units") {
      return filteredUnits.map((item, index) => (
        <tr key={item.id} className={tableRowClassName}>
          <td className={`${tableCellClassName} whitespace-nowrap font-mono text-xs text-text-muted`}>{index + 1}</td>
          <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>{item.nameNp}</td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>{item.nameEn}</td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>
            <span className="rounded border border-border bg-background px-2.5 py-1 font-mono text-xs font-semibold">
              {isNepali ? item.shortNp : item.shortEn}
            </span>
          </td>
          <td className={`${tableCellClassName} whitespace-nowrap text-text-muted`}>
            {t(`dashboard.superAdminPages.unitTypes.${item.type}`)}
          </td>
          <td className={tableCellClassName}>
            <RowActions
              editLabel={t("dashboard.superAdminPages.edit")}
              deleteLabel={t("dashboard.superAdminPages.delete")}
              onEdit={() => openEdit("unit", item)}
              onDelete={() => setDeleteTarget({ kind: "units", id: item.id })}
            />
          </td>
        </tr>
      ));
    }
    return filteredAdmins.map((item, index) => {
      const name = isNepali ? item.nameNp : item.nameEn;
      const regionParts = [item.province, item.district, item.municipality, item.ward].filter(Boolean);
      const region = regionParts.length
        ? regionParts.join(", ")
        : isNepali
          ? item.regionNp
          : item.regionEn;
      const date = isNepali ? item.dateNp : item.dateEn;
      const active = item.status === "Active";
      return (
        <tr key={item.id} className={tableRowClassName}>
          <td className={`${tableCellClassName} whitespace-nowrap font-mono text-xs text-text-muted`}>{index + 1}</td>
          <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>
            <span className="mr-2.5 inline-flex size-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
              {item.nameEn.charAt(0)}
            </span>
            {name}
          </td>
          <td className={`${tableCellClassName} whitespace-nowrap text-xs text-text-muted`}>
            <span className="block font-mono">{item.email}</span>
            {item.contact && <span className="mt-1 block">{item.contact}</span>}
          </td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>{region}</td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                active
                  ? "bg-success-bg text-success-text"
                  : "bg-warning-bg text-warning-text"
              }`}
            >
              {active ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
              {t(`dashboard.superAdminPages.status.${item.status}`)}
            </span>
          </td>
          <td className={`${tableCellClassName} whitespace-nowrap font-mono text-xs text-text-muted`}>{date}</td>
          <td className={tableCellClassName}>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                title={t("dashboard.superAdminPages.resendInvite")}
                aria-label={t("dashboard.superAdminPages.resendInvite")}
                onClick={() =>
                  setToast(`${t("dashboard.superAdminPages.inviteSent")}: ${item.email}`)
                }
                className="flex size-9 items-center justify-center rounded-control text-text-muted hover:bg-background hover:text-primary"
              >
                <Send size={17} />
              </button>
              <button
                type="button"
                title={t("dashboard.superAdminPages.revoke")}
                aria-label={t("dashboard.superAdminPages.revoke")}
                onClick={() => setDeleteTarget({ kind: "localAdmin", id: item.id })}
                className="flex size-9 items-center justify-center rounded-control text-text-muted hover:bg-danger-bg hover:text-danger"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }

  const tableHeaders =
    currentModule === "products"
      ? [
          t("dashboard.superAdminPages.no"),
          t("dashboard.superAdminPages.nameNp"),
          t("dashboard.superAdminPages.nameEn"),
          t("dashboard.superAdminPages.category"),
          t("dashboard.superAdminPages.units"),
          t("dashboard.superAdminPages.description"),
          t("dashboard.superAdminPages.action"),
        ]
      : currentModule === "categories"
        ? [
            t("dashboard.superAdminPages.no"),
            t("dashboard.superAdminPages.nameNp"),
            t("dashboard.superAdminPages.nameEn"),
            t("dashboard.superAdminPages.action"),
          ]
        : currentModule === "units"
          ? [
              t("dashboard.superAdminPages.no"),
              t("dashboard.superAdminPages.fullNameNp"),
              t("dashboard.superAdminPages.fullNameEn"),
              t("dashboard.superAdminPages.shortName"),
              t("dashboard.superAdminPages.unitType"),
              t("dashboard.superAdminPages.action"),
            ]
          : [
              t("dashboard.superAdminPages.no"),
              t("dashboard.superAdminPages.officerName"),
              t("dashboard.superAdminPages.emailContact"),
              t("dashboard.superAdminPages.region"),
              t("dashboard.superAdminPages.statusLabel"),
          t("dashboard.superAdminPages.invitedDate"),
              t("dashboard.superAdminPages.action"),
            ];
  const rows =
    currentModule === "products"
      ? filteredProducts
      : currentModule === "categories"
        ? filteredCategories
        : currentModule === "units"
          ? filteredUnits
          : filteredAdmins;
  const tableMinWidth =
    currentModule === "products"
      ? 1040
      : currentModule === "categories"
        ? 620
        : currentModule === "units"
          ? 800
          : 1080;
  const modalTitle =
    modal === "invite"
      ? t("dashboard.superAdminPages.sendInvitation")
      : t(
          `dashboard.superAdminPages.${
            editingId ? "edit" : "add"
          }${modal === "product" ? "Product" : modal === "category" ? "Category" : "Unit"}`,
        );

  return (
    <section className="space-y-6 md:space-y-7">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold leading-tight text-text md:text-[30px]">
          {pageConfig.title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-text-muted">
          {pageConfig.description}
        </p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-sm">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-3 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("dashboard.superAdminPages.search")}
            aria-label={t("dashboard.superAdminPages.search")}
            className="h-11 w-full rounded-control border border-border bg-surface pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <DashboardButton
          type="button"
          onClick={() => openCreate(currentModule === "localAdmin" ? "invite" : currentModule === "products" ? "product" : currentModule === "categories" ? "category" : "unit")}
          className="w-full px-5 text-sm font-semibold md:w-auto"
        >
          {currentModule === "localAdmin" ? <Send size={18} /> : <Plus size={18} />}
          {pageConfig.addLabel}
        </DashboardButton>
      </div>

      <TableFrame
        headers={tableHeaders}
        empty={rows.length === 0}
        emptyLabel={t("dashboard.superAdminPages.nothingFound")}
        recordLabel={t("dashboard.superAdminPages.recordCount", {
          count: rows.length,
        })}
        minWidth={tableMinWidth}
      >
        {renderTableRows()}
      </TableFrame>

      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="super-admin-modal-title"
            className={`my-auto flex max-h-[90vh] w-full flex-col overflow-hidden rounded-card border border-border bg-surface ${
              modal === "product" || modal === "invite"
                ? "max-w-[760px]"
                : "max-w-[560px]"
            }`}
          >
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
              <h2 id="super-admin-modal-title" className="text-xl font-semibold text-text">
                {modalTitle}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t("common.cancel")}
                className="flex size-9 items-center justify-center rounded-control text-text-muted hover:bg-background hover:text-text"
              >
                <X size={20} />
              </button>
            </header>
            <form
              onSubmit={handleSubmit}
              className="space-y-6 overflow-y-auto p-6"
            >
              {modal === "product" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("dashboard.superAdminPages.nameEn")}
                      value={form.nameEn ?? ""}
                      onChange={(value) => updateForm("nameEn", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.nameNp")}
                      value={form.nameNp ?? ""}
                      onChange={(value) => updateForm("nameNp", value)}
                    />
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-text-muted">
                      {t("dashboard.superAdminPages.category")} *
                    </span>
                    <select
                      required
                      value={form.categoryId ?? ""}
                      onChange={(event) =>
                        updateForm("categoryId", event.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">
                        {t("dashboard.superAdminPages.selectCategory")}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {isNepali ? category.nameNp : category.nameEn}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-text-muted">
                      {t("dashboard.superAdminPages.units")} *
                    </legend>
                    <p className="text-xs text-text-muted">
                      {t("dashboard.superAdminPages.multipleUnits")}
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {units.map((unit) => {
                        const selected = selectedUnits.includes(unit.shortEn);
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setSelectedUnits((current) =>
                                selected
                                  ? current.filter((key) => key !== unit.shortEn)
                                  : [...current, unit.shortEn],
                              )
                            }
                            className={`flex h-10 items-center gap-2 rounded-control border px-4 text-sm font-medium transition-colors ${
                              selected
                                ? "border-primary bg-primary-light text-primary"
                                : "border-border bg-surface text-text hover:border-primary"
                            }`}
                          >
                            {selected && <CheckCircle2 size={16} />}
                            {unit.nameEn} ({unit.shortEn})
                          </button>
                        );
                      })}
                    </div>
                    {!selectedUnits.length && (
                      <p className="text-xs text-danger">
                        {t("dashboard.superAdminPages.chooseUnit")}
                      </p>
                    )}
                  </fieldset>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-text-muted">
                        {t("dashboard.superAdminPages.descriptionEn")}
                      </span>
                      <textarea
                        rows={3}
                        value={form.descEn ?? ""}
                        onChange={(event) =>
                          updateForm("descEn", event.target.value)
                        }
                        className={textAreaClassName}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-text-muted">
                        {t("dashboard.superAdminPages.descriptionNp")}
                      </span>
                      <textarea
                        rows={3}
                        value={form.descNp ?? ""}
                        onChange={(event) =>
                          updateForm("descNp", event.target.value)
                        }
                        className={textAreaClassName}
                      />
                    </label>
                  </div>
                </>
              )}
              {modal === "category" && (
                <>
                  <Field
                    label={t("dashboard.superAdminPages.nameEn")}
                    value={form.nameEn ?? ""}
                    onChange={(value) => updateForm("nameEn", value)}
                  />
                  <Field
                    label={t("dashboard.superAdminPages.nameNp")}
                    value={form.nameNp ?? ""}
                    onChange={(value) => updateForm("nameNp", value)}
                  />
                </>
              )}
              {modal === "unit" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("dashboard.superAdminPages.fullNameEn")}
                      value={form.nameEn ?? ""}
                      onChange={(value) => updateForm("nameEn", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.fullNameNp")}
                      value={form.nameNp ?? ""}
                      onChange={(value) => updateForm("nameNp", value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("dashboard.superAdminPages.shortNameEn")}
                      value={form.shortEn ?? ""}
                      onChange={(value) => updateForm("shortEn", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.shortNameNp")}
                      value={form.shortNp ?? ""}
                      onChange={(value) => updateForm("shortNp", value)}
                    />
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-text-muted">
                      {t("dashboard.superAdminPages.unitType")} *
                    </span>
                    <select
                      required
                      value={form.type ?? ""}
                      onChange={(event) => updateForm("type", event.target.value)}
                      className={fieldClassName}
                    >
                      <option value="">
                        {t("dashboard.superAdminPages.selectUnitType")}
                      </option>
                      {(["Weight", "Volume", "Count"] as const).map((type) => (
                        <option key={type} value={type}>
                          {t(`dashboard.superAdminPages.unitTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {modal === "invite" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("dashboard.superAdminPages.fullNameEn")}
                      value={form.nameEn ?? ""}
                      onChange={(value) => updateForm("nameEn", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.fullNameNp")}
                      value={form.nameNp ?? ""}
                      onChange={(value) => updateForm("nameNp", value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("dashboard.superAdminPages.contact")}
                      value={form.contact ?? ""}
                      onChange={(value) => updateForm("contact", value)}
                      type="tel"
                    />
                    <Field
                      label={t("dashboard.superAdminPages.emailAddress")}
                      value={form.email ?? ""}
                      onChange={(value) => updateForm("email", value)}
                      type="email"
                    />
                  </div>
                  <Field
                    label={t("dashboard.superAdminPages.password")}
                    value={form.password ?? ""}
                    onChange={(value) => updateForm("password", value)}
                    type="password"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label={t("dashboard.superAdminPages.province")}
                      value={form.province ?? ""}
                      onChange={(value) => updateForm("province", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.district")}
                      value={form.district ?? ""}
                      onChange={(value) => updateForm("district", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.municipality")}
                      value={form.municipality ?? ""}
                      onChange={(value) => updateForm("municipality", value)}
                    />
                    <Field
                      label={t("dashboard.superAdminPages.ward")}
                      value={form.ward ?? ""}
                      onChange={(value) => updateForm("ward", value)}
                      type="number"
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {t("dashboard.superAdminPages.inviteHelp")}
                  </p>
                </>
              )}
              <footer className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                <DashboardButton
                  variant="secondary"
                  type="button"
                  onClick={closeModal}
                  className="px-6"
                >
                  {t("common.cancel")}
                </DashboardButton>
                <DashboardButton
                  type="submit"
                  className="px-8"
                >
                  {modal === "invite"
                    ? t("dashboard.superAdminPages.sendInvitation")
                    : editingId
                      ? t("dashboard.superAdminPages.update")
                      : t("common.save")}
                </DashboardButton>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-[400px] space-y-4 rounded-card border border-border bg-surface p-6"
          >
            <div>
              <h2 id="delete-title" className="text-lg font-semibold text-text">
                {t("dashboard.superAdminPages.confirmDelete")}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {t("dashboard.superAdminPages.deleteWarning")}
              </p>
            </div>
            <footer className="flex justify-end gap-3 border-t border-border pt-4">
              <DashboardButton
                variant="neutral"
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-10 px-4 text-sm"
              >
                {t("common.cancel")}
              </DashboardButton>
              <DashboardButton
                variant="danger"
                type="button"
                onClick={confirmDelete}
                className="min-h-10 px-4 text-sm"
              >
                {t("dashboard.superAdminPages.delete")}
              </DashboardButton>
            </footer>
          </section>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[80] rounded-control border border-border bg-surface px-4 py-3 text-sm text-text"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
