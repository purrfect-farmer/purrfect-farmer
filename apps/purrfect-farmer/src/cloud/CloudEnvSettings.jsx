import { FormProvider, useForm, useFormState } from "react-hook-form";
import { useMemo, useState } from "react";

import CloudEnvField from "./CloudEnvField";
import CloudEnvTest from "./CloudEnvTest";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import { cn } from "@/utils";
import useCloudManagerEnvPreviewMutation from "@/hooks/useCloudManagerEnvPreviewMutation";
import useCloudManagerEnvSettingsQuery from "@/hooks/useCloudManagerEnvSettingsQuery";

/** Read a saved boolean the way the server does */
const parseBoolean = (value) => /^\(?true\)?$/i.test(String(value).trim());

/** Form values from the saved settings */
const getDefaultValues = ({ fields, values }) =>
  Object.fromEntries(
    fields.map((field) => {
      const value = values[field.key];

      if (field.type === "boolean") {
        return [
          field.key,
          value !== undefined ? parseBoolean(value) : Boolean(field.default),
        ];
      }

      return [field.key, field.type === "secret" ? "" : (value ?? "")];
    }),
  );

/** Normalize a form value for the server, empty means use the default */
const toChange = (field, value) => {
  if (field.type === "boolean") return value;

  const text = String(value ?? "").trim();
  return text === "" ? null : text;
};

const SettingsGroup = ({ group, fields, data, resets, toggleReset, getTestValues, disabled, open }) => {
  const { dirtyFields } = useFormState();
  const changed = fields.filter(
    (field) => dirtyFields[field.key] || resets.has(field.key),
  ).length;

  return (
    <details
      open={open}
      className="rounded-xl bg-neutral-50 dark:bg-neutral-900 group"
    >
      <summary className="flex items-center gap-2 p-3 font-bold cursor-pointer">
        <span className="grow min-w-0 truncate">{group.title}</span>
        {changed ? (
          <span className="px-2 text-xs text-white bg-blue-500 rounded-full">
            {changed} changed
          </span>
        ) : null}
      </summary>

      <div className="flex flex-col gap-4 px-3 pb-3">
        {group.description ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {group.description}
          </p>
        ) : null}

        {fields.map((field) => (
          <CloudEnvField
            key={field.key}
            field={field}
            secret={data.secrets[field.key]}
            issue={data.issues[field.key]}
            isSet={
              field.key in data.values || Boolean(data.secrets[field.key]?.isSet)
            }
            resetting={resets.has(field.key)}
            onReset={() => toggleReset(field.key)}
            disabled={disabled}
          />
        ))}

        {group.test ? (
          <CloudEnvTest
            service={group.test}
            getValues={getTestValues}
            disabled={disabled}
          />
        ) : null}
      </div>
    </details>
  );
};

const SettingsForm = ({ data, onReview }) => {
  const form = useForm({ defaultValues: getDefaultValues(data) });
  const { dirtyFields } = form.formState;
  const previewMutation = useCloudManagerEnvPreviewMutation(form);
  const [resets, setResets] = useState(() => new Set());
  const [search, setSearch] = useState("");

  const fieldsByKey = useMemo(
    () => new Map(data.fields.map((field) => [field.key, field])),
    [data.fields],
  );

  /** Fields matching the search, grouped */
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.groups
      .map((group) => ({
        group,
        fields: data.fields.filter(
          (field) =>
            field.group === group.id &&
            (!term ||
              [field.key, field.label, field.help, group.title]
                .filter(Boolean)
                .some((text) => text.toLowerCase().includes(term))),
        ),
      }))
      .filter((item) => item.fields.length);
  }, [data, search]);

  /** Toggle a reset to default */
  const toggleReset = (key) => {
    if (!resets.has(key)) form.resetField(key);

    setResets((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /** Changed keys and their new values */
  const getChanges = () => {
    const values = form.getValues();
    const changes = {};

    Object.keys(form.formState.dirtyFields).forEach((key) => {
      changes[key] = toChange(fieldsByKey.get(key), values[key]);
    });
    resets.forEach((key) => {
      changes[key] = null;
    });

    return changes;
  };

  /** Unsaved values to test with, untouched secrets stay on the server */
  const getTestValues = () => {
    const values = form.getValues();

    return Object.fromEntries(
      data.fields
        .filter(
          (field) =>
            field.type !== "secret" || form.getFieldState(field.key).isDirty,
        )
        .map((field) => [field.key, values[field.key]]),
    );
  };

  const changeCount = new Set([...Object.keys(dirtyFields), ...resets]).size;

  /** Preview then hand over to the review step */
  const handleSubmit = async () => {
    const changes = getChanges();
    const preview = await previewMutation.mutateAsync({ changes }).catch(() => null);

    if (preview) onReview({ changes }, preview);
  };

  const generalGroups = groups.filter((item) => !item.group.farmer);
  const farmerGroups = groups.filter((item) => item.group.farmer);
  const isSearching = Boolean(search.trim());

  const renderGroup = ({ group, fields }, index) => (
    <SettingsGroup
      key={group.id}
      group={group}
      fields={fields}
      data={data}
      resets={resets}
      toggleReset={toggleReset}
      getTestValues={getTestValues}
      disabled={previewMutation.isPending}
      open={isSearching || index === 0}
    />
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-2"
      >
        <Input
          type="search"
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
          placeholder="Search settings..."
        />

        {generalGroups.map(renderGroup)}

        {farmerGroups.length ? (
          <>
            <h3 className="px-1 pt-2 font-bold text-neutral-500">Farmers</h3>
            {farmerGroups.map((item) => renderGroup(item, -1))}
          </>
        ) : null}

        {!groups.length ? (
          <p className="p-4 text-center text-neutral-500">No settings match.</p>
        ) : null}

        <PrimaryButton
          type="submit"
          className={cn("sticky bottom-0 my-1")}
          disabled={!changeCount || previewMutation.isPending}
        >
          {previewMutation.isPending
            ? "Checking..."
            : changeCount
              ? `Review ${changeCount} change${changeCount > 1 ? "s" : ""}`
              : "No changes"}
        </PrimaryButton>
      </form>
    </FormProvider>
  );
};

export default function CloudEnvSettings({ onReview }) {
  const query = useCloudManagerEnvSettingsQuery();

  return query.isSuccess ? (
    <SettingsForm
      key={query.dataUpdatedAt}
      data={query.data}
      onReview={onReview}
    />
  ) : query.isError ? (
    <p className="p-4 text-center text-red-500">
      {query.error.response?.status === 404
        ? "Update your server to use the settings form. The Advanced tab still works."
        : `Error: ${query.error.message}`}
    </p>
  ) : (
    <p className="p-4 text-center text-orange-500">Loading...</p>
  );
}
