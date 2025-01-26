import { lazy, memo } from "react";
import { useMemo } from "react";

const components = new Map();

const loader = (id, farmer) =>
  components.get(id) ||
  components
    .set(
      id,
      lazy(() => import(`@/drops/${id}/${farmer}.jsx`))
    )
    .get(id);

export default memo(function Farmer({ id, farmer, ...props }) {
  const Component = useMemo(() => loader(id, farmer), [id, farmer]);

  return <Component {...props} />;
});
