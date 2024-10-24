import { lazy } from "react";

const components = new Map();

const loader = (farmer) =>
  components.get(farmer) ||
  components
    .set(
      farmer,
      lazy(() => import(`@/drops/${farmer.toLowerCase()}/${farmer}.jsx`))
    )
    .get(farmer);

export default function Farmer({ farmer, ...props }) {
  const Component = loader(farmer);

  return <Component {...props} />;
}
