import { lazy, memo } from "react";
import { useMemo } from "react";

const components = new Map();

const loader = (farmer) =>
  components.get(farmer) ||
  components
    .set(
      farmer,
      lazy(() => import(`@/drops/${farmer.toLowerCase()}/${farmer}.jsx`))
    )
    .get(farmer);

export default memo(function Farmer({ farmer, ...props }) {
  const Component = useMemo(() => loader(farmer), [farmer]);

  return <Component {...props} />;
});
