import CloudEnvSettingsForm from "./CloudEnvSettingsForm";
import useCloudManagerEnvSettingsQuery from "@/hooks/useCloudManagerEnvSettingsQuery";

export default function CloudEnvSettings({ onReview }) {
  const query = useCloudManagerEnvSettingsQuery();

  return query.isSuccess ? (
    <CloudEnvSettingsForm
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
