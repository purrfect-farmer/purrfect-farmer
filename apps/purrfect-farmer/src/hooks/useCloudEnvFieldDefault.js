import { useFormState, useWatch } from "react-hook-form";

/** Value an empty field falls back to, following the field it inherits live */
export default function useCloudEnvFieldDefault(field, parent, parentSaved) {
  const name = parent?.key;
  const disabled = !name;
  const parentValue = useWatch({ name, disabled });
  const { dirtyFields } = useFormState({ name, disabled });

  if (!parent) return field.default;

  const ownDefault = field.default ?? parent.default;
  const parentIsSet = parentSaved || Boolean(dirtyFields[name]);
  const parentIsEmpty = parentValue === "" || parentValue === null;

  return parentIsSet && !parentIsEmpty ? parentValue : ownDefault;
}
