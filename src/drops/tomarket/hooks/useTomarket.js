import useValuesMemo from "@/hooks/useValuesMemo";

export default function useTomarket(farmer) {
  const tomarket = farmer.metaQuery.data;

  return useValuesMemo({
    ...farmer,
    tomarket,
  });
}
