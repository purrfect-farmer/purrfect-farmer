import Toggle from "./Toggle";

export default function LabelToggle({ children, ...props }) {
  return (
    <label className="flex items-center gap-4 p-2 cursor-pointer rounded-xl bg-neutral-100">
      <h4 className="min-w-0 min-h-0 grow">{children}</h4> <Toggle {...props} />
    </label>
  );
}
