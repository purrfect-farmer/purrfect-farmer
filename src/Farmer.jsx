import { lazy, memo } from "react";
import { useMemo } from "react";

const components = new Map();

const loader = (farmer, id) =>
  components.get(farmer) ||
  components
    .set(
      farmer,
      lazy(() => import(`@/drops/${id || farmer.toLowerCase()}/${farmer}.jsx`))
    )
    .get(farmer);

export default memo(function Farmer({ id, farmer, ...props }) {
  const Component = useMemo(() => loader(farmer, id), [farmer]);

  return <Component {...props} />;
});
